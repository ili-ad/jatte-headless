from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from jatte.tests.jwt_factory import make_test_token


User = get_user_model()


@override_settings(
    ROOT_URLCONF="stream_server_django.chat_addons.tests.pr5_urls",
    CHAT_INTERNAL_SERVICE_TOKEN="service-secret",
)
class NotificationServiceAuthorizationTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="notification-staff",
            supabase_uid="notification-staff",
            is_staff=True,
        )
        self.member = User.objects.create_user(
            username="notification-member", supabase_uid="notification-member"
        )
        self.intake_url = reverse("intake-summary")
        self.oncall_url = reverse("notifications-oncall")

    def auth(self, user) -> dict[str, str]:
        token = make_test_token(user.supabase_uid, email=user.email)
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_staff_and_service_are_accepted(self):
        staff = self.client.get(self.intake_url, **self.auth(self.staff))
        service = self.client.get(
            self.intake_url, HTTP_X_CHAT_SERVICE_TOKEN="service-secret"
        )

        self.assertEqual(staff.status_code, 200)
        self.assertEqual(service.status_code, 200)

    def test_missing_wrong_and_browser_member_credentials_are_rejected(self):
        missing = self.client.get(self.intake_url)
        wrong = self.client.get(
            self.intake_url, HTTP_X_CHAT_SERVICE_TOKEN="wrong-secret"
        )
        member = self.client.get(self.intake_url, **self.auth(self.member))

        for response in (missing, wrong, member):
            self.assertIn(response.status_code, {401, 403})

    def test_service_actor_can_update_oncall_without_staff_impersonation(self):
        response = self.client.put(
            self.oncall_url,
            {"email": "ops@example.com"},
            format="json",
            HTTP_X_CHAT_SERVICE_TOKEN="service-secret",
        )

        self.assertEqual(response.status_code, 200, response.data)
        actor = User.objects.get(username="__chat_internal_service__")
        self.assertFalse(actor.is_staff)
        self.assertFalse(actor.is_superuser)

    @patch(
        "stream_server_django.chat_addons.notifications.views.NotificationService.send_email"
    )
    @patch(
        "stream_server_django.chat_addons.notifications.views.NotificationService.send_sms"
    )
    def test_service_actor_can_trigger_explicit_operational_escalation(
        self, send_sms, send_email
    ):
        response = self.client.post(
            reverse("notifications-escalate"),
            {"cid": "messaging:ops-room", "reason": "provider alarm"},
            format="json",
            HTTP_X_CHAT_SERVICE_TOKEN="service-secret",
        )

        self.assertEqual(response.status_code, 200, response.data)
        send_sms.assert_not_called()
        send_email.assert_not_called()
