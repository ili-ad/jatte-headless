from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from accounts_supabase.models import CustomUser
from chat.models import Reminder

class ReminderAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        self.other = CustomUser.objects.create_user(username="u2", email="u2@example.com", password="x", supabase_uid="u2")
        Reminder.objects.create(user=self.user, text="hi", remind_at="2025-01-01T00:00:00Z")
        Reminder.objects.create(user=self.other, text="bye", remind_at="2025-01-02T00:00:00Z")

    def test_list_reminders(self):
        token = self.make_token()
        url = reverse("reminders")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["text"], "hi")

    def test_reminders_requires_auth(self):
        url = reverse("reminders")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_reminders_wrong_method(self):
        token = self.make_token()
        url = reverse("reminders")
        res = self.client.put(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_create_reminder(self):
        token = self.make_token()
        url = reverse("reminders")
        res = self.client.post(url, {"text": "new", "remind_at": "2025-01-03T00:00:00Z"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Reminder.objects.filter(text="new").count(), 1)
        self.assertEqual(res.data["reminder"]["text"], "new")

