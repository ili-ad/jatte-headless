from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest.mock import patch

ROOT_DIR = Path(__file__).resolve().parents[3]
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from accounts_supabase.models import CustomUser
from chat.models import Notification

from chat_addons.notifications.models import AdminPresence, EscalationRecord


@override_settings(ROOT_URLCONF="jatte.urls")
class NotificationEscalationTests(APITestCase):
    def setUp(self) -> None:
        self.admin = CustomUser.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="secret",
            supabase_uid="admin-uid",
        )
        self.client.force_authenticate(user=self.admin)
        self.oncall_url = reverse("notifications-oncall")
        self.heartbeat_url = reverse("notifications-presence")
        self.escalate_url = reverse("notifications-escalate")

    def test_set_and_get_oncall_config(self) -> None:
        payload = {"phone_e164": "+15551234567", "email": "ops@example.com"}
        response = self.client.put(self.oncall_url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["phone_e164"], "+15551234567")

        fetched = self.client.get(self.oncall_url)
        self.assertEqual(fetched.status_code, 200)
        data = fetched.json()
        self.assertEqual(data["email"], "ops@example.com")

    @patch("backend.chat_addons.notifications.views.NotificationService.send_email")
    @patch("backend.chat_addons.notifications.views.NotificationService.send_sms")
    def test_escalate_with_active_admin_creates_in_app_only(
        self, mocked_sms, mocked_email
    ) -> None:
        self.client.put(self.oncall_url, {"phone_e164": "+15551230000"}, format="json")
        presence_response = self.client.post(self.heartbeat_url, {}, format="json")
        self.assertEqual(presence_response.status_code, 204)
        self.assertEqual(AdminPresence.objects.count(), 1)

        escalate_response = self.client.post(
            self.escalate_url,
            {"cid": "messaging:test-room", "reason": "manual"},
            format="json",
        )
        self.assertEqual(escalate_response.status_code, 200)
        body = escalate_response.json()
        self.assertTrue(body["notified"])
        self.assertEqual(body["via"], "none")
        mocked_sms.assert_not_called()
        mocked_email.assert_not_called()

        self.assertEqual(EscalationRecord.objects.count(), 1)
        record = EscalationRecord.objects.get()
        self.assertEqual(record.delivered_via, EscalationRecord.DELIVERED_NONE)
        self.assertIsNone(record.delivered_at)
        self.assertGreater(Notification.objects.count(), 0)

    @patch("backend.chat_addons.notifications.views.NotificationService.send_email")
    @patch("backend.chat_addons.notifications.views.NotificationService.send_sms")
    def test_escalate_without_active_admin_triggers_sms(
        self, mocked_sms, mocked_email
    ) -> None:
        mocked_sms.return_value = None
        self.client.put(self.oncall_url, {"phone_e164": "+15554440000"}, format="json")

        escalate_response = self.client.post(
            self.escalate_url,
            {"cid": "messaging:no-admin", "reason": "no operator"},
            format="json",
        )
        self.assertEqual(escalate_response.status_code, 200)
        body = escalate_response.json()
        self.assertTrue(body["notified"])
        self.assertEqual(body["via"], "sms")
        mocked_sms.assert_called_once()
        mocked_email.assert_not_called()

        record = EscalationRecord.objects.get()
        self.assertEqual(record.delivered_via, EscalationRecord.DELIVERED_SMS)
        self.assertIsNotNone(record.delivered_at)
        self.assertGreater(Notification.objects.count(), 0)

    @patch("backend.chat_addons.notifications.views.NotificationService.send_sms")
    def test_escalation_respects_cooldown(self, mocked_sms) -> None:
        mocked_sms.return_value = None
        self.client.put(self.oncall_url, {"phone_e164": "+15553330000"}, format="json")

        first = self.client.post(
            self.escalate_url,
            {"cid": "messaging:cooldown", "reason": "initial"},
            format="json",
        )
        self.assertEqual(first.status_code, 200)
        mocked_sms.assert_called_once()

        second = self.client.post(
            self.escalate_url,
            {"cid": "messaging:cooldown", "reason": "repeat"},
            format="json",
        )
        self.assertEqual(second.status_code, 200)
        body_first = first.json()
        body_second = second.json()
        self.assertEqual(body_second["via"], body_first["via"])
        self.assertEqual(body_second["notified"], body_first["notified"])
        self.assertEqual(EscalationRecord.objects.count(), 1)
        self.assertEqual(Notification.objects.count(), 1)
