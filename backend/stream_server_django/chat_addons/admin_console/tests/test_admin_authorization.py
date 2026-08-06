import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Room


User = get_user_model()


@override_settings(
    ROOT_URLCONF="stream_server_django.chat_addons.tests.pr5_urls",
    CHAT_INTERNAL_SERVICE_TOKEN="service-secret",
)
class AdminAuthorizationTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="admin-staff", supabase_uid="admin-staff", is_staff=True
        )
        self.member = User.objects.create_user(
            username="admin-member", supabase_uid="admin-member"
        )
        Room.objects.create(uuid="admin-secret-room", client="client")
        self.url = reverse("list-admin-queue")

    def auth(self, user) -> dict[str, str]:
        token = jwt.encode(
            {"sub": user.supabase_uid},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_queue_is_staff_only_and_does_not_leak_to_other_actors(self):
        allowed = self.client.get(self.url, **self.auth(self.staff))
        member = self.client.get(self.url, **self.auth(self.member))
        anonymous = self.client.get(self.url)
        service = self.client.get(
            self.url, HTTP_X_CHAT_SERVICE_TOKEN="service-secret"
        )

        self.assertEqual(allowed.status_code, 200)
        self.assertIn("results", allowed.data)
        for response in (member, anonymous, service):
            self.assertIn(response.status_code, {401, 403})
            self.assertNotIn("results", response.data)
