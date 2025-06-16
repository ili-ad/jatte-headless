from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Notification
from accounts_supabase.models import CustomUser

class NotificationsAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user1 = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        self.user2 = CustomUser.objects.create_user(username="u2", email="u2@example.com", password="x", supabase_uid="u2")
        Notification.objects.create(user=self.user1, text="hello")
        Notification.objects.create(user=self.user2, text="hi")

    def test_list_notifications(self):
        token = self.make_token()
        url = reverse("notifications")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["text"], "hello")

    def test_notifications_requires_auth(self):
        url = reverse("notifications")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_notifications_wrong_method(self):
        token = self.make_token()
        url = reverse("notifications")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
