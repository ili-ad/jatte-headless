from __future__ import annotations

import json
import logging
import time
from collections.abc import Mapping
from functools import wraps
from typing import Any, Optional

from django.utils.functional import cached_property

from .models import AuditTrail

logger = logging.getLogger("chat_addons.common_audit")


def _request_identifier(request: Any) -> str:
    request_id = getattr(request, "request_id", None)
    if request_id:
        return str(request_id)
    headers = getattr(request, "headers", {}) or {}
    request_id = headers.get("X-Request-ID")
    if request_id:
        return str(request_id)
    meta = getattr(request, "META", {}) or {}
    request_id = meta.get("HTTP_X_REQUEST_ID")
    if request_id:
        return str(request_id)
    return ""


def _user_identifier(user: Any) -> str:
    if not user or not getattr(user, "is_authenticated", False):
        return "anonymous"
    return (
        getattr(user, "supabase_uid", None)
        or getattr(user, "username", None)
        or str(getattr(user, "pk", ""))
        or "anonymous"
    )


def _combine_meta(context: Mapping[str, Any] | None) -> dict[str, Any]:
    if not context:
        return {}
    meta = context.get("meta") if isinstance(context, Mapping) else None
    if isinstance(meta, Mapping):
        return dict(meta)
    return {}


class _AuditContext:
    def __init__(self, request: Any, *, cid_kwarg: str | None, target_kwarg: str | None):
        self.request = request
        self.cid_kwarg = cid_kwarg
        self.target_kwarg = target_kwarg

    @cached_property
    def context(self) -> Mapping[str, Any]:
        data = getattr(self.request, "_audit_context", None)
        if isinstance(data, Mapping):
            return data
        return {}

    def resolve_cid(self, kwargs: dict[str, Any]) -> str:
        cid = self.context.get("cid")
        if cid:
            return str(cid)
        if self.cid_kwarg and self.cid_kwarg in kwargs:
            return str(kwargs[self.cid_kwarg])
        return ""

    def resolve_target_id(self, kwargs: dict[str, Any]) -> str:
        target_id = self.context.get("target_id")
        if target_id:
            return str(target_id)
        if self.target_kwarg and self.target_kwarg in kwargs:
            return str(kwargs[self.target_kwarg])
        return ""

    @cached_property
    def meta(self) -> dict[str, Any]:
        return _combine_meta(self.context)


def audit_action(
    *,
    action: str,
    cid_kwarg: str | None = None,
    target_kwarg: str | None = None,
) -> Any:
    """Decorate a view handler to persist and log audit metadata."""

    def decorator(func):
        @wraps(func)
        def wrapped(view, request, *args, **kwargs):
            start = time.perf_counter()
            response = None
            raised: Optional[BaseException] = None
            try:
                response = func(view, request, *args, **kwargs)
                return response
            except BaseException as exc:  # pragma: no cover - defensive branch
                raised = exc
                raise
            finally:
                status_code = getattr(response, "status_code", None)
                if raised is not None:
                    status_code = getattr(raised, "status_code", None) or 500
                elapsed = int((time.perf_counter() - start) * 1000)
                audit_context = _AuditContext(
                    request, cid_kwarg=cid_kwarg, target_kwarg=target_kwarg
                )
                cid_value = audit_context.resolve_cid(kwargs)
                target_value = audit_context.resolve_target_id(kwargs)
                user_id = _user_identifier(getattr(request, "user", None))
                request_id = _request_identifier(request)
                meta = audit_context.meta

                log_payload: dict[str, Any] = {
                    "action": action,
                    "cid": cid_value,
                    "user_id": user_id,
                    "request_id": request_id,
                    "status": status_code or 0,
                    "latency_ms": elapsed,
                }
                if target_value:
                    log_payload["target_id"] = target_value

                try:
                    AuditTrail.objects.create(
                        action=action,
                        cid=cid_value,
                        user_id=user_id,
                        target_id=target_value or None,
                        request_id=request_id,
                        meta=meta,
                    )
                except Exception:  # pragma: no cover - persistence failures should not bubble
                    logger.exception("Failed to persist audit trail entry", extra=log_payload)
                else:
                    logger.info(json.dumps(log_payload, sort_keys=True))

                if hasattr(request, "_audit_context"):
                    try:
                        delattr(request, "_audit_context")
                    except AttributeError:  # pragma: no cover - defensive cleanup
                        pass

        return wrapped

    return decorator
