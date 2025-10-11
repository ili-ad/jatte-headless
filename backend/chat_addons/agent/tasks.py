from __future__ import annotations

import logging
import os
from typing import Any

try:  # pragma: no cover - Celery optional
    from celery import shared_task
except ImportError:  # pragma: no cover - fallback when Celery is absent
    from functools import wraps

    def shared_task(*decorator_args, **decorator_kwargs):
        def decorator(func):
            @wraps(func)
            def wrapped(*args, **kwargs):
                return func(*args, **kwargs)

            def delay(*args, **kwargs):
                return func(*args, **kwargs)

            def apply_async(args=None, kwargs=None, **_):
                return func(*(args or ()), **(kwargs or {}))

            wrapped.delay = delay  # type: ignore[attr-defined]
            wrapped.apply_async = apply_async  # type: ignore[attr-defined]
            return wrapped

        if decorator_args and callable(decorator_args[0]) and not decorator_kwargs:
            return decorator(decorator_args[0])
        return decorator

from django.conf import settings
from django.db import transaction

from chat.api_views import _broadcast_to_cid
from chat.models import Channel, Message, Room
from chat.serializers import MessageSerializer
from chat.utils import canonical_cid

from ..common_audit.models import MessageProvenance
from .services.agent_service import get_agent_service

logger = logging.getLogger(__name__)


def _agent_user_id() -> str:
    return (
        getattr(settings, "CHAT_AGENT_USER_ID", None)
        or os.environ.get("AGENT_USER_ID")
        or "agent-bot"
    )


def _room_uuid(cid: str) -> str:
    return cid.split(":", 1)[1] if ":" in cid else cid


def _persist_message(*, cid: str, text: str) -> Message:
    serializer = MessageSerializer(data={"text": text})
    serializer.is_valid(raise_exception=True)

    room_uuid = _room_uuid(cid)
    agent_user = _agent_user_id()

    with transaction.atomic():
        channel, _ = Channel.objects.select_for_update().get_or_create(
            uuid=room_uuid,
            defaults={"client": "stream"},
        )
        room, _ = Room.objects.select_for_update().get_or_create(
            uuid=room_uuid,
            defaults={"client": "stream"},
        )
        serializer.save(channel=channel, sent_by=agent_user)
        room.messages.add(serializer.instance)

    payload = MessageSerializer(serializer.instance).data
    _broadcast_to_cid(cid, {"type": "message.new", "message": payload})
    return serializer.instance


@shared_task
def run_agent_invocation(
    run_id: str,
    cid: str,
    prompt: str,
    meta: dict[str, Any] | None = None,
) -> None:
    """Generate an agent reply and persist it as a chat message."""

    canonical = canonical_cid(cid)
    service = get_agent_service()

    try:
        response_text = service.generate(cid=canonical, prompt=prompt, meta=meta or {})
    except Exception:  # pragma: no cover - defensive logging
        logger.exception("Agent service failed for run %s", run_id)
        return

    if response_text is None:
        logger.info("Agent service returned no content for run %s", run_id)
        return

    try:
        message = _persist_message(cid=canonical, text=str(response_text))
        MessageProvenance.objects.get_or_create(
            message=message,
            defaults={"source": MessageProvenance.Source.AGENT},
        )
    except Exception:  # pragma: no cover - defensive logging
        logger.exception("Unable to persist agent message for run %s", run_id)
