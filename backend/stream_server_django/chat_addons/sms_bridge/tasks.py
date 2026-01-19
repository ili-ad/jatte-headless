from __future__ import annotations

import logging

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

logger = logging.getLogger(__name__)


@shared_task
def sms_autoreply_task(*, cid: str, sender_e164: str | None, text: str) -> None:
    """Stub task for SMS autoreplies."""

    logger.info(
        "sms.autoreply.enqueued",
        extra={"cid": cid, "sender_e164": sender_e164, "text": text},
    )
