from django.conf import settings
from django.urls import reverse
from rest_framework.test import APITestCase
import jwt

from accounts_supabase.models import CustomUser
from chat.models import Room
from backend.chat_addons.models import RoomOwnership


class AdminConsoleQueueTests(APITestCase):
    def setUp(self):
        self.operator = CustomUser.objects.create_user(
            username="op1",
            email="op1@example.com",
            password="secret",
            supabase_uid="op1",
        )
        self.other_operator = CustomUser.objects.create_user(
            username="op2",
            email="op2@example.com",
            password="secret",
            supabase_uid="op2",
        )

    def make_token(self, user: CustomUser) -> str:
        return jwt.encode(
            {"sub": user.supabase_uid, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def test_list_new_rooms(self):
        Room.objects.create(uuid="queue-r1", client="stream")
        token = self.make_token(self.operator)

        url = reverse("list-admin-queue")
        response = self.client.get(
            url,
            {"status": "new"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["results"]), 1)
        self.assertEqual(payload["results"][0]["cid"], "messaging:queue-r1")

    def test_claim_room(self):
        room = Room.objects.create(uuid="claim-r1", client="stream")
        token = self.make_token(self.operator)

        url = reverse("claim-room", kwargs={"cid": "messaging:claim-r1"})
        response = self.client.post(url, {}, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["cid"], "messaging:claim-r1")
        self.assertEqual(payload["owner_id"], self.operator.supabase_uid)
        self.assertTrue(RoomOwnership.objects.filter(room=room, owner=self.operator).exists())

    def test_claim_rejected_when_owned_by_other(self):
        room = Room.objects.create(uuid="claim-r2", client="stream")
        RoomOwnership.objects.create(room=room, owner=self.other_operator)

        token = self.make_token(self.operator)
        url = reverse("claim-room", kwargs={"cid": "messaging:claim-r2"})
        response = self.client.post(url, {}, HTTP_AUTHORIZATION=f"Bearer {token}")

        self.assertEqual(response.status_code, 403)

    def test_list_mine_only_returns_owned_rooms(self):
        Room.objects.create(uuid="mine-new", client="stream")
        owned = Room.objects.create(uuid="mine-owned", client="stream")
        RoomOwnership.objects.create(room=owned, owner=self.operator)

        token = self.make_token(self.operator)
        url = reverse("list-admin-queue")

        response = self.client.get(
            url,
            {"status": "mine"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload["results"]), 1)
        self.assertEqual(payload["results"][0]["cid"], "messaging:mine-owned")
        self.assertEqual(payload["results"][0]["owner_id"], self.operator.supabase_uid)

        response_new = self.client.get(
            url,
            {"status": "new"},
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(len(response_new.json()["results"]), 1)
        self.assertEqual(response_new.json()["results"][0]["cid"], "messaging:mine-new")
