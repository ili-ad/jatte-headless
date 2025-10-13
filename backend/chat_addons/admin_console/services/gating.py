from __future__ import annotations

import base64
import binascii
import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Iterable, Literal

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.utils import timezone

from chat.consumers import broadcast_message_update
from chat.models import Message, RoomMemberMute
from chat.serializers import MessageSerializer
from chat.utils import canonical_cid, group_name_for_cid

from ..models import GatingConfig, MessageIntake


Decision = Literal["allow", "hold", "reject"]

_DEFAULT_LANGUAGES: list[str] = ["en"]
_DEFAULT_MIN_LENGTH = 2
_DEFAULT_MAX_LENGTH = 1000
_DEFAULT_MIN_INTERVAL_SECONDS = 5
_DEFAULT_BLOCKLIST: list[str] = []

_CURSOR_PADDING = "="
_MAX_PAGE_SIZE = 100
_DEFAULT_PAGE_SIZE = 25


User = get_user_model()


@dataclass
class GatingRules:
    languages: list[str]
    min_length: int
    max_length: int
    min_interval_seconds: int
    blocklist: list[str]


@dataclass
class IntakeListItem:
    message_id: str
    cid: str
    user_id: str
    text: str
    created_at: datetime
    status: str
    reason: str | None


@dataclass
class IntakeListResult:
    results: list[IntakeListItem]
    next_cursor: str | None


@dataclass
class IntakeActionResult:
    message_id: str
    status: str
    muted: bool


def get_rules() -> GatingRules:
    config = GatingConfig.objects.order_by("-updated_at").first()
    if not config:
        return GatingRules(
            languages=list(_DEFAULT_LANGUAGES),
            min_length=_DEFAULT_MIN_LENGTH,
            max_length=_DEFAULT_MAX_LENGTH,
            min_interval_seconds=_DEFAULT_MIN_INTERVAL_SECONDS,
            blocklist=list(_DEFAULT_BLOCKLIST),
        )
    return GatingRules(
        languages=_coerce_list(config.languages, default=_DEFAULT_LANGUAGES),
        min_length=max(0, int(config.min_length or 0)),
        max_length=max(1, int(config.max_length or _DEFAULT_MAX_LENGTH)),
        min_interval_seconds=max(0, int(config.min_interval_seconds or 0)),
        blocklist=_coerce_list(config.blocklist, default=_DEFAULT_BLOCKLIST),
    )


def update_rules(payload: dict) -> GatingRules:
    rules = GatingRules(
        languages=_coerce_list(payload.get("languages"), default=_DEFAULT_LANGUAGES),
        min_length=max(0, int(payload.get("min_length", _DEFAULT_MIN_LENGTH))),
        max_length=max(1, int(payload.get("max_length", _DEFAULT_MAX_LENGTH))),
        min_interval_seconds=max(
            0, int(payload.get("min_interval_seconds", _DEFAULT_MIN_INTERVAL_SECONDS))
        ),
        blocklist=_coerce_list(payload.get("blocklist"), default=_DEFAULT_BLOCKLIST),
    )

    config, _ = GatingConfig.objects.get_or_create(slug=GatingConfig.DEFAULT_SLUG)
    config.languages = rules.languages
    config.min_length = rules.min_length
    config.max_length = rules.max_length
    config.min_interval_seconds = rules.min_interval_seconds
    config.blocklist = rules.blocklist
    config.save(
        update_fields=[
            "languages",
            "min_length",
            "max_length",
            "min_interval_seconds",
            "blocklist",
            "updated_at",
        ]
    )
    return rules


def serialize_rules(rules: GatingRules) -> dict:
    return {
        "languages": list(rules.languages),
        "min_length": rules.min_length,
        "max_length": rules.max_length,
        "min_interval_seconds": rules.min_interval_seconds,
        "blocklist": list(rules.blocklist),
    }


def decide_first_message(*, cid: str, user_id: str, text: str, now: datetime) -> Decision:
    canonical = canonical_cid(cid)
    room_uuid = _room_uuid_from_cid(canonical)
    rules = get_rules()

    if _has_approved_message(room_uuid=room_uuid, user_id=user_id):
        return "allow"

    sanitized_text = text or ""
    stripped = sanitized_text.strip()

    if stripped and _contains_blocklisted_term(stripped, rules.blocklist):
        return "reject"

    length = len(stripped)
    if length and (length < rules.min_length or length > rules.max_length):
        return "hold"
    if not length:
        return "hold"

    detected_language = _detect_language(stripped)
    if detected_language and rules.languages and detected_language not in rules.languages:
        return "hold"

    if rules.min_interval_seconds > 0 and _has_recent_message(
        room_uuid=room_uuid,
        user_id=user_id,
        now=now,
        threshold=rules.min_interval_seconds,
    ):
        return "reject"

    return "allow"


def record_intake(*, message: Message, cid: str, user_id: str, text: str, decision: Decision, initial_broadcast: bool, reason: str | None = None) -> MessageIntake | None:
    if decision == "allow":
        return None
    status = MessageIntake.STATUS_PENDING if decision == "hold" else MessageIntake.STATUS_REJECTED
    intake = MessageIntake.objects.create(
        message=message,
        cid=canonical_cid(cid),
        user_id=user_id,
        text=text,
        status=status,
        reason=reason,
        initial_broadcast=initial_broadcast,
    )
    return intake


def list_intake(*, status: str | None, limit: int | None, cursor: str | None) -> IntakeListResult:
    queryset = MessageIntake.objects.select_related("message").order_by("-created_at", "-message_id")
    if status in {MessageIntake.STATUS_PENDING, MessageIntake.STATUS_REJECTED}:
        queryset = queryset.filter(status=status)
    elif status is not None and status != "all":
        queryset = queryset.none()

    limit_value = _coerce_limit(limit)
    if cursor:
        cursor_state = _decode_cursor(cursor)
        if cursor_state:
            created_at, message_pk = cursor_state
            queryset = queryset.filter(
                models.Q(created_at__lt=created_at)
                | (models.Q(created_at=created_at) & models.Q(message_id__lt=message_pk))
            )

    rows = list(queryset[: limit_value + 1])
    has_more = len(rows) > limit_value
    sliced = rows[:limit_value]

    items = [
        IntakeListItem(
            message_id=str(row.message_id),
            cid=row.cid,
            user_id=row.user_id,
            text=row.text,
            created_at=row.created_at,
            status=row.status,
            reason=row.reason,
        )
        for row in sliced
    ]

    next_cursor = None
    if has_more and sliced:
        last = sliced[-1]
        next_cursor = _encode_cursor(last.created_at, int(last.message_id))

    return IntakeListResult(results=items, next_cursor=next_cursor)


def approve_intake(*, message_id: str, actor) -> IntakeActionResult:
    message_pk = int(message_id)
    with transaction.atomic():
        intake = (
            MessageIntake.objects.select_for_update()
            .select_related("message", "message__channel")
            .get(message_id=message_pk)
        )
        message = intake.message
        message.hidden = False
        message.hidden_at = None
        message.hidden_by = None
        message.save(update_fields=["hidden", "hidden_at", "hidden_by", "updated_at"])

        was_announced = intake.initial_broadcast
        intake.mark_approved(initial_broadcast=True)

    cid = canonical_cid(intake.cid)
    if was_announced:
        broadcast_message_update(message)
    else:
        _broadcast_message_new(cid, message)

    _schedule_agent_if_enabled(cid=cid, room_uuid=_room_uuid_from_cid(cid), message=message)

    return IntakeActionResult(
        message_id=str(message_pk),
        status=MessageIntake.STATUS_APPROVED,
        muted=False,
    )


def reject_intake(
    *, message_id: str, actor, reason: str | None = None, mute: bool = False
) -> IntakeActionResult:
    message_pk = int(message_id)
    with transaction.atomic():
        intake = (
            MessageIntake.objects.select_for_update()
            .select_related("message")
            .get(message_id=message_pk)
        )
        message = intake.message
        message.hidden = True
        message.save(update_fields=["hidden", "updated_at"])

        muted_applied = False
        if mute:
            muted_applied = _mute_user(intake=intake, actor=actor)
        intake.mark_rejected(reason=reason, muted=muted_applied)

    return IntakeActionResult(
        message_id=str(message_pk),
        status=MessageIntake.STATUS_REJECTED,
        muted=muted_applied,
    )


def _has_approved_message(*, room_uuid: str, user_id: str) -> bool:
    return Message.objects.filter(
        channel__uuid=room_uuid,
        sent_by=user_id,
        hidden=False,
    ).exists()


def _has_recent_message(*, room_uuid: str, user_id: str, now: datetime, threshold: int) -> bool:
    window_start = now - timedelta(seconds=threshold)
    return Message.objects.filter(
        channel__uuid=room_uuid,
        sent_by=user_id,
        created_at__gte=window_start,
    ).exists()


def _contains_blocklisted_term(text: str, blocklist: Iterable[str]) -> bool:
    lowered = text.lower()
    for term in blocklist:
        if not term:
            continue
        if term.lower() in lowered:
            return True
    return False


def _detect_language(text: str) -> str | None:
    ascii_letters = sum(ch.isascii() and ch.isalpha() for ch in text)
    total_letters = sum(ch.isalpha() for ch in text)
    if total_letters == 0:
        return None
    if ascii_letters / max(total_letters, 1) >= 0.6:
        return "en"
    return "unknown"


def _coerce_list(value, *, default: Iterable[str]) -> list[str]:
    if isinstance(value, (list, tuple)):
        return [str(item) for item in value if isinstance(item, str) and item]
    return list(default)


def _room_uuid_from_cid(cid: str) -> str:
    if ":" in cid:
        return cid.split(":", 1)[1]
    return cid


def _coerce_limit(value: int | None) -> int:
    if value is None:
        return _DEFAULT_PAGE_SIZE
    try:
        limit = int(value)
    except (TypeError, ValueError):
        return _DEFAULT_PAGE_SIZE
    if limit <= 0:
        return _DEFAULT_PAGE_SIZE
    return min(limit, _MAX_PAGE_SIZE)


def _encode_cursor(created_at: datetime, message_pk: int) -> str:
    payload = {
        "created": created_at.isoformat(),
        "message_id": message_pk,
    }
    raw = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _decode_cursor(cursor: str) -> tuple[datetime, int] | None:
    padding = _CURSOR_PADDING * (-len(cursor) % 4)
    try:
        raw = base64.urlsafe_b64decode(f"{cursor}{padding}".encode("utf-8"))
    except (binascii.Error, ValueError):
        return None
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return None
    created_raw = payload.get("created")
    message_id = payload.get("message_id")
    if not created_raw or message_id is None:
        return None
    created_at = datetime.fromisoformat(created_raw)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return created_at, int(message_id)


def _schedule_agent_if_enabled(*, cid: str, room_uuid: str, message: Message) -> None:
    from chat_addons.agent.models import RoomAgentFlag
    from chat_addons.agent.tasks import run_agent_invocation

    flag = RoomAgentFlag.objects.filter(room__uuid=room_uuid).first()
    if not flag or not flag.agent_enabled:
        return
    run_agent_invocation.delay(
        run_id=f"intake-{message.id}",
        cid=cid,
        prompt=message.body,
        meta={"source": "intake_approval"},
    )


def _mute_user(*, intake: MessageIntake, actor) -> bool:
    message = intake.message
    room = message.rooms.order_by("pk").first()
    if not room:
        return False
    target = User.objects.filter(username=message.sent_by).first()
    if not target:
        return False
    RoomMemberMute.objects.update_or_create(
        room=room,
        user=target,
        defaults={"muted_by": actor, "muted_until": None},
    )
    return True


def _broadcast_message_new(cid: str, message: Message) -> None:
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        payload = MessageSerializer(message).data
        canonical = canonical_cid(cid)
        async_to_sync(channel_layer.group_send)(
            group_name_for_cid(canonical),
            {
                "type": "chat.message",
                "payload": {
                    "type": "message.new",
                    "cid": canonical,
                    "message": payload,
                },
            },
        )
    except Exception:
        return
