from __future__ import annotations

import re
import uuid

from django.db import transaction
from django.utils import timezone

from stream_server_django.accounts_supabase.models import CustomUser
from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat.utils import canonical_cid

from ..models import SmsRelay, SmsRoomLink

PHONE_CLEAN_RE = re.compile(r"[^\d]")


def _sanitize_username(phone_e164: str) -> str:
    digits = PHONE_CLEAN_RE.sub("", phone_e164)
    if not digits:
        digits = uuid.uuid4().hex[:12]
    return f"sms_{digits}"[:150]


def get_or_create_phone_user(phone_e164: str) -> CustomUser:
    supabase_uid = f"sms:{phone_e164}"
    user = CustomUser.objects.filter(supabase_uid=supabase_uid).first()
    if user:
        return user

    username = _sanitize_username(phone_e164)
    user = CustomUser.objects.create_user(
        username=username,
        email="",
        password=None,
        supabase_uid=supabase_uid,
    )
    user.first_name = "SMS"
    user.last_name = "Contact"
    user.save(update_fields=["first_name", "last_name"])
    return user


def ensure_room(cid: str, *, client_identifier: str | None = None) -> tuple[Room, Channel]:
    canonical = canonical_cid(cid)
    _, room_uuid = canonical.split(":", 1)

    channel_defaults = {"client": client_identifier or "sms"}
    channel, created_channel = Channel.objects.get_or_create(
        uuid=room_uuid,
        defaults=channel_defaults,
    )
    if not created_channel and client_identifier and channel.client != client_identifier:
        channel.client = client_identifier
        channel.save(update_fields=["client"])

    room_defaults = {"client": client_identifier or getattr(channel, "client", "sms")}
    room, created_room = Room.objects.get_or_create(
        uuid=room_uuid,
        defaults=room_defaults,
    )
    if not created_room and client_identifier and room.client != client_identifier:
        room.client = client_identifier
        room.save(update_fields=["client"])

    return room, channel


def ensure_link(
    *,
    phone_e164: str,
    cid: str | None = None,
    client_identifier: str | None = None,
) -> SmsRoomLink:
    now = timezone.now()
    canonical = canonical_cid(cid) if cid else None

    with transaction.atomic():
        if canonical:
            link, created = SmsRoomLink.objects.select_for_update().get_or_create(
                cid=canonical,
                phone_e164=phone_e164,
                defaults={"last_seen_at": now},
            )
            if not created:
                link.last_seen_at = now
                link.save(update_fields=["last_seen_at"])
        else:
            link = (
                SmsRoomLink.objects.select_for_update()
                .filter(phone_e164=phone_e164)
                .order_by("-last_seen_at")
                .first()
            )
            if link is None:
                room_uuid = uuid.uuid4().hex
                canonical = canonical_cid(None, room_uuid=room_uuid)
                link = SmsRoomLink.objects.create(
                    cid=canonical,
                    phone_e164=phone_e164,
                    last_seen_at=now,
                )
            else:
                canonical = link.cid
                link.last_seen_at = now
                link.save(update_fields=["last_seen_at"])

    ensure_room(canonical, client_identifier=client_identifier)
    return link


def record_inbound_message(
    *,
    cid: str,
    text: str,
    sender_identifier: str,
    relay_external_id: str,
) -> Message:
    room, channel = ensure_room(cid, client_identifier=sender_identifier)
    message = Message.objects.create(
        channel=channel,
        body=text,
        sent_by=sender_identifier,
        custom_data={"delivery_status": SmsRelay.STATUS_DELIVERED},
    )
    room.messages.add(message)
    SmsRelay.objects.create(
        cid=cid,
        direction=SmsRelay.DIRECTION_INBOUND,
        external_id=relay_external_id,
        status=SmsRelay.STATUS_DELIVERED,
        message_id=str(message.id),
    )
    return message


def record_outbound_message(
    *,
    cid: str,
    text: str,
    sender_identifier: str,
    relay_external_id: str,
) -> Message:
    room, channel = ensure_room(cid)
    message = Message.objects.create(
        channel=channel,
        body=text,
        sent_by=sender_identifier,
        custom_data={"delivery_status": SmsRelay.STATUS_PENDING},
    )
    room.messages.add(message)
    SmsRelay.objects.create(
        cid=cid,
        direction=SmsRelay.DIRECTION_OUTBOUND,
        external_id=relay_external_id,
        status=SmsRelay.STATUS_PENDING,
        message_id=str(message.id),
    )
    return message
