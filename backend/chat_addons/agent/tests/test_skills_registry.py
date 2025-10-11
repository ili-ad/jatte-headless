from __future__ import annotations

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[3]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.jatte.settings")

import django

django.setup()

from django.core.management import call_command

call_command("migrate", run_syncdb=True, verbosity=0)

import jwt
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts_supabase.models import CustomUser
from backend.chat_addons.agent import registry
from backend.chat_addons.agent.models import AgentRoomPolicy


class SkillRegistryTests(TestCase):
    def setUp(self) -> None:
        registry.clear_cache()

    def test_registry_discovers_dummy_skill(self) -> None:
        metas = registry.list_all()
        self.assertTrue(any(meta.name == "dummy.echo" for meta in metas))

    def test_registry_execute_returns_payload(self) -> None:
        ctx = {
            "cid": "messaging:test",
            "user_id": "user-123",
            "now": timezone.now(),
            "metadata": {},
        }
        payload = registry.execute("dummy.echo", {"message": "ping"}, ctx)
        self.assertTrue(payload["echoed"].startswith("ping"))

    def test_enabled_for_room_respects_policy(self) -> None:
        cid = "messaging:test-room"
        registry.set_policy(cid, True, ["dummy.echo"])

        skills = registry.enabled_for_room(cid)
        self.assertEqual([skill.name for skill in skills], ["dummy.echo"])


class SkillPolicyViewTests(APITestCase):
    def setUp(self) -> None:
        self.operator, _ = CustomUser.objects.get_or_create(
            username="skills-operator",
            defaults={
                "email": "skills@example.com",
                "supabase_uid": "skills-operator",
            },
        )
        if not self.operator.has_usable_password():
            self.operator.set_password("secret")
            self.operator.save(update_fields=["password"])

    def make_token(self) -> str:
        return jwt.encode(
            {"sub": self.operator.supabase_uid, "email": self.operator.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def auth_headers(self) -> dict[str, str]:
        return {"HTTP_AUTHORIZATION": f"Bearer {self.make_token()}"}

    def test_get_skills_returns_defaults(self) -> None:
        registry.clear_cache()
        url = reverse("agent-room-skills")
        response = self.client.get(url, {"cid": "messaging:room-a"}, **self.auth_headers())

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(payload["cid"], "messaging:room-a")
        self.assertTrue(any(item["name"] == "dummy.echo" for item in payload["skills"]))

    def test_put_skills_updates_policy(self) -> None:
        registry.clear_cache()
        url = reverse("agent-room-skills")
        response = self.client.put(
            url,
            {
                "cid": "messaging:room-b",
                "skills": [{"name": "dummy.echo", "enabled": True}],
            },
            format="json",
            **self.auth_headers(),
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertTrue(any(item["enabled"] for item in payload["skills"] if item["name"] == "dummy.echo"))

        policy = AgentRoomPolicy.objects.get(cid="messaging:room-b")
        self.assertEqual(policy.enabled_skills, ["dummy.echo"])
        self.assertFalse(policy.agent_enabled)
