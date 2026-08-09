"""Queue-compatible entry point for persisted agent work orders."""

from __future__ import annotations

from functools import wraps

try:  # pragma: no cover - Celery optional
    from celery import shared_task
except ImportError:  # pragma: no cover - fallback when Celery is absent
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


from .services.agent_service import get_agent_service


@shared_task
def run_agent_invocation(run_id: str) -> bool:
    """Execute one persisted run; broker arguments carry no room authority."""

    return get_agent_service().execute_agent_run(run_id)
