from __future__ import annotations

import json
import os
import sys
import uuid
from pathlib import Path
from typing import Iterator, TYPE_CHECKING

BACKEND_DIR = Path(__file__).resolve().parents[3]
if str(BACKEND_DIR) not in sys.path:
    sys.path.append(str(BACKEND_DIR))

import django
import jwt
import pytest
from django.conf import settings
from django.core.management import call_command
from django.test import override_settings
from django.urls import reverse

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")
django.setup()
call_command("migrate", run_syncdb=True, verbosity=0)
call_command("flush", verbosity=0, interactive=False)

from accounts_supabase.models import CustomUser
from chat.models import Channel, Message, Room
from backend.chat_addons.admin_console.models import MessageIntake
from backend.chat_addons.agent.tasks import run_agent_invocation
from backend.chat_addons.common_audit.models import AuditTrail, MessageProvenance
from backend.chat_addons.common_audit.throttling import reset_rate_limit_cache

if TYPE_CHECKING:  # pragma: no cover - typing helpers
    from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def reset_rate_limits() -> Iterator[None]:
    reset_rate_limit_cache()
    yield
    reset_rate_limit_cache()


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def operator_user() -> CustomUser:
    supabase_uid = f"operator-{uuid.uuid4()}"
    return CustomUser.objects.create_user(
        username=supabase_uid,
        email="operator@example.com",
        password="secret",
        supabase_uid=supabase_uid,
    )


@pytest.fixture
def operator_token(operator_user: CustomUser) -> str:
    return jwt.encode(
        {"sub": operator_user.supabase_uid, "email": operator_user.email},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256",
    )


@pytest.fixture
def auth_headers(operator_token: str) -> dict[str, str]:
    return {"HTTP_AUTHORIZATION": f"Bearer {operator_token}"}


def test_agent_message_provenance_recorded() -> None:
    cid = "messaging:room-prov"
    prompt = "Hello agent"

    run_agent_invocation("run-123", cid, prompt, meta={"foo": "bar"})

    message = Message.objects.filter(channel__uuid="room-prov").order_by("-id").first()
    assert message is not None
    provenance = MessageProvenance.objects.get(message=message)
    assert provenance.source == MessageProvenance.Source.AGENT


@override_settings(ADDON_RATE_LIMITS={"claim": "1/min"})
def test_claim_room_throttled(
    api_client: "APIClient", operator_user: CustomUser, auth_headers: dict[str, str]
) -> None:
    room_uuid = f"claim-{uuid.uuid4()}"
    Room.objects.create(uuid=room_uuid, client="stream")

    url = reverse("claim-room", kwargs={"cid": f"messaging:{room_uuid}"})
    first = api_client.post(url, {}, **auth_headers)
    assert first.status_code == 200

    second = api_client.post(url, {}, **auth_headers)
    assert second.status_code == 429


@override_settings(ADDON_RATE_LIMITS={"intake_write": "10/min"})
def test_approve_intake_creates_audit_log(
    api_client: "APIClient",
    operator_user: CustomUser,
    auth_headers: dict[str, str],
    caplog,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    channel = Channel.objects.create(uuid="audit-room", client="stream")
    room = Room.objects.create(uuid="audit-room", client="stream")
    message = Message.objects.create(
        channel=channel,
        body="pending",
        sent_by="visitor-1",
        hidden=True,
    )
    intake = MessageIntake.objects.create(
        message=message,
        cid="messaging:audit-room",
        user_id="visitor-1",
        text="pending",
    )

    url = reverse("approve-intake", kwargs={"message_id": str(message.id)})

    monkeypatch.setattr(
        "backend.chat_addons.admin_console.services.gating._broadcast_message_new",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "backend.chat_addons.admin_console.services.gating.broadcast_message_update",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        "backend.chat_addons.admin_console.services.gating._schedule_agent_if_enabled",
        lambda *args, **kwargs: None,
    )

    with caplog.at_level("INFO", logger="backend.chat_addons.common_audit"):
        response = api_client.post(
            url,
            {},
            **auth_headers,
            HTTP_X_REQUEST_ID="req-approve-1",
        )

    assert response.status_code == 200
    audit_entry = AuditTrail.objects.get(action=AuditTrail.Action.APPROVE)
    assert audit_entry.request_id == "req-approve-1"
    assert audit_entry.cid == "messaging:audit-room"
    assert audit_entry.target_id == str(message.id)
    assert audit_entry.meta.get("status") == MessageIntake.STATUS_APPROVED

    assert len(caplog.records) == 1
    payload = json.loads(caplog.records[0].message)
    assert payload["action"] == AuditTrail.Action.APPROVE
    assert payload["request_id"] == "req-approve-1"
    assert payload["status"] == 200


def test_list_audit_entries_paginated(
    api_client: "APIClient", operator_user: CustomUser, auth_headers: dict[str, str]
) -> None:
    AuditTrail.objects.all().delete()
    for index in range(5):
        AuditTrail.objects.create(
            action=AuditTrail.Action.CLAIM,
            cid=f"messaging:cid-{index}",
            user_id=operator_user.supabase_uid,
            target_id=f"room-{index}",
            request_id=f"rid-{index}",
            meta={},
        )

    url = reverse("list-audit-trail")
    response = api_client.get(url, {"limit": 2}, **auth_headers)
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["results"]) == 2
    assert payload["next"] is not None

    next_cursor = payload["next"]
    response_next = api_client.get(url, {"cursor": next_cursor, "limit": 10}, **auth_headers)
    assert response_next.status_code == 200
    payload_next = response_next.json()
    assert len(payload_next["results"]) == 3
    assert payload_next["next"] is None

    for item in payload_next["results"]:
        assert "request_id" in item
