from django.urls import reverse
from rest_framework.test import APITestCase
from django.conf import settings
import jwt

from chat.models import Room, Notification
from accounts_supabase.models import CustomUser

class RecoverStateAPITests(APITestCase):
    def make_token(self, sub="u1", email="u1@example.com"):
        return jwt.encode({"sub": sub, "email": email}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")

    def setUp(self):
        self.user = CustomUser.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")
        Room.objects.create(uuid="r1", client="c1", status=Room.ACTIVE)
        Notification.objects.create(user=self.user, text="hi")

    def test_recover_state_returns_data(self):
        token = self.make_token()
        url = reverse("recover-state")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data["rooms"]), 1)
        self.assertEqual(len(res.data["notifications"]), 1)

    def test_recover_state_requires_auth(self):
        url = reverse("recover-state")
        res = self.client.get(url)
        self.assertEqual(res.status_code, 403)

    def test_recover_state_wrong_method(self):
        token = self.make_token()
        url = reverse("recover-state")
        res = self.client.post(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)
