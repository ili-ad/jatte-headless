import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

import jwt
from django.conf import settings
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts_supabase.models import CustomUser
from reminders.models import Reminder

call_command("migrate", run_syncdb=True, verbosity=0)


class ReminderAPITests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="pwd",
            supabase_uid="alice",
        )
        self.other = CustomUser.objects.create_user(
            username="bob",
            email="bob@example.com",
            password="pwd",
            supabase_uid="bob",
        )

    def _auth_headers(self, user: CustomUser | None = None) -> dict[str, str]:
        actor = user or self.user
        token = jwt.encode(
            {"sub": actor.username, "email": actor.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_list_returns_user_reminders(self):
        Reminder.objects.create(
            user=self.user,
            text="Standup",
            remind_at=timezone.now(),
        )
        Reminder.objects.create(
            user=self.other,
            text="Ignore",
            remind_at=timezone.now(),
        )

        response = self.client.get("/reminders/", **self._auth_headers())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["text"], "Standup")

    def test_create_reminder(self):
        remind_at = timezone.now().replace(microsecond=0).isoformat().replace("+00:00", "Z")
        payload = {"text": "Prep standup", "remind_at": remind_at}
        response = self.client.post("/reminders/", payload, format="json", **self._auth_headers())
        self.assertEqual(response.status_code, 201)
        data = response.json()
        reminder = data["reminder"]
        self.assertIn("id", reminder)
        self.assertEqual(reminder["text"], "Prep standup")
        self.assertEqual(reminder["remind_at"], remind_at)
        self.assertTrue(Reminder.objects.filter(id=reminder["id"], user=self.user).exists())

    def test_delete_reminder(self):
        reminder = Reminder.objects.create(
            user=self.user,
            text="Demo",
            remind_at=timezone.now(),
        )
        response = self.client.delete(
            f"/reminders/{reminder.id}/",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Reminder.objects.filter(id=reminder.id).exists())

    def test_delete_unknown_returns_404(self):
        response = self.client.delete(
            "/reminders/00000000-0000-0000-0000-000000000000/",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 404)

    def test_requires_authentication(self):
        response = self.client.get("/reminders/")
        self.assertIn(response.status_code, {401, 403})
        response = self.client.post(
            "/reminders/",
            {"text": "Nope", "remind_at": timezone.now().isoformat()},
            format="json",
        )
        self.assertIn(response.status_code, {401, 403})
        reminder = Reminder.objects.create(
            user=self.user,
            text="Test",
            remind_at=timezone.now(),
        )
        response = self.client.delete(f"/reminders/{reminder.id}/")
        self.assertIn(response.status_code, {401, 403})
