import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

import jwt
from django.conf import settings
from django.core.management import call_command
from rest_framework.test import APITestCase

from stream_server_django.accounts_supabase.models import CustomUser
from stream_server_django.polls.models import Poll, PollOption

call_command("migrate", run_syncdb=True, verbosity=0)


class PollsAPITests(APITestCase):
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username="alice",
            email="alice@example.com",
            password="pwd",
            supabase_uid="alice",
        )

    def _auth_headers(self, sub: str | None = None) -> dict[str, str]:
        token = jwt.encode(
            {"sub": sub or self.user.username, "email": self.user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_create_poll_with_options(self):
        payload = {
            "cid": "general",
            "question": "Lunch?",
            "options": ["🍕", "🥗"],
        }
        response = self.client.post("/polls/", payload, format="json", **self._auth_headers())
        self.assertEqual(response.status_code, 201)
        data = response.json()
        poll_data = data["poll"]
        self.assertEqual(poll_data["cid"], "messaging:general")
        self.assertEqual(poll_data["question"], "Lunch?")
        self.assertEqual(len(poll_data["options"]), 2)
        poll = Poll.objects.get(id=poll_data["poll_id"])
        self.assertEqual(poll.cid, "messaging:general")
        self.assertEqual(PollOption.objects.filter(poll=poll).count(), 2)

    def test_list_polls_requires_cid(self):
        response = self.client.get("/polls/", **self._auth_headers())
        self.assertEqual(response.status_code, 400)
        self.assertIn("cid", response.json()["detail"])

    def test_list_polls_returns_results(self):
        poll = Poll.objects.create(
            cid="messaging:general",
            question="Favorite color?",
            created_by=self.user,
        )
        PollOption.objects.create(poll=poll, text="Blue", created_by=self.user)
        PollOption.objects.create(poll=poll, text="Green", created_by=self.user)

        response = self.client.get(
            "/polls/?cid=messaging:general&limit=30",
            **self._auth_headers(),
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("results", data)
        self.assertEqual(len(data["results"]), 1)
        returned = data["results"][0]
        self.assertEqual(returned["poll_id"], str(poll.id))
        self.assertEqual(returned["question"], poll.question)
        self.assertEqual(len(returned["options"]), 2)
