import json
from unittest.mock import patch

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import override_settings
from django.urls import reverse
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from stream_server_django.chat.models import Channel, Message, Room
from jatte.tests.jwt_factory import make_test_token
User = get_user_model()

@override_settings(
    ROOT_URLCONF="stream_server_django.chat.tests.attachment_test_urls"
)
class AttachmentAPITests(APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private_key = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode("utf-8")
        cls.service_account_json = json.dumps(
            {
                "client_email": "uploader@test.iam.gserviceaccount.com",
                "private_key": private_key,
            }
        )

    def make_token(self, sub="u1", email="u1@example.com"):
        return make_test_token(sub, email=email)

    def setUp(self):
        self.user = User.objects.create_user(username="u1", email="u1@example.com", password="x", supabase_uid="u1")

    def _direct_upload_settings(self, **overrides):
        base = {
            "CHAT_ATTACHMENTS_BUCKET": "test-bucket",
            "CHAT_ATTACHMENTS_PENDING_BUCKET": "test-pending",
            "CHAT_ATTACHMENTS_CLEAN_BUCKET": "test-clean",
            "CHAT_ATTACHMENTS_QUARANTINE_BUCKET": "test-quarantine",
            "CHAT_ATTACHMENTS_SCANNER_BACKEND": "test",
            "CHAT_ATTACHMENTS_SERVICE_ACCOUNT_INFO": self.service_account_json,
            "CHAT_ATTACHMENTS_ALLOWED_TYPES": ["image/png", "image/jpeg"],
            "CHAT_ATTACHMENTS_MAX_SIZE": 1024 * 1024,
            "CHAT_ATTACHMENTS_UPLOAD_TTL_SECONDS": 600,
            "CHAT_ATTACHMENTS_SIGN_TTL_SECONDS": 600,
            "CHAT_ATTACHMENTS_DOWNLOAD_TTL_SECONDS": 120,
            "CHAT_ATTACHMENTS_PUBLIC_DOWNLOADS": False,
            "CHAT_ATTACHMENTS_PUBLIC_BASE_URL": "https://storage.googleapis.com/test-bucket",
        }
        base.update(overrides)
        return base

    def test_upload_attachment(self):
        token = self.make_token()
        url = reverse("attachments")
        res = self.client.post(url, {"name": "file1"}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 201)
        self.assertIn("id", res.data["attachment"])
        self.assertEqual(res.data["attachment"]["name"], "file1")
        self.assertIn("url", res.data["attachment"])
        self.assertTrue(
            res.data["attachment"]["url"].startswith(
                "http://testserver/api/attachments/"
            )
        )

    def test_upload_attachment_alias(self):
        token = self.make_token()
        res = self.client.post(
            "/attachments/",
            {"name": "alias.txt"},
            format="json",
            HTTP_AUTHORIZATION=f"Bearer {token}",
        )
        self.assertEqual(res.status_code, 201)
        self.assertIn("attachment", res.data)
        self.assertEqual(res.data["attachment"]["name"], "alias.txt")

    def test_requires_name(self):
        token = self.make_token()
        url = reverse("attachments")
        res = self.client.post(url, {"name": "   "}, format="json", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 400)

    def test_requires_auth(self):
        url = reverse("attachments")
        res = self.client.post(url, {"name": "x"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_wrong_method(self):
        token = self.make_token()
        url = reverse("attachments")
        res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 405)

    def test_sign_and_commit_direct_upload(self):
        token = self.make_token()
        room = Room.objects.create(uuid="test-room", client=self.user.username, agent=self.user)
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)
        message = Message.objects.create(channel=channel, body="hi", sent_by=self.user.username)
        room.messages.add(message)
        with override_settings(**self._direct_upload_settings()):
            sign_res = self.client.post(
                "/api/attachments/sign/",
                {
                    "name": "photo.png",
                    "content_type": "image/png",
                    "size": 512,
                    "cid": "messaging:test-room",
                    "message_id": str(message.id),
                },
                format="json",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
            self.assertEqual(sign_res.status_code, 200)
            upload_id = sign_res.data["upload_id"]
            blob_name = sign_res.data["blob_name"]

            checksum = "a" * 64
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=(checksum, 512),
            ), patch(
                "stream_server_django.chat.api_views._broadcast_to_cid"
            ) as mock_broadcast:
                commit_res = self.client.post(
                    "/api/attachments/commit/",
                    {
                        "upload_id": upload_id,
                        "blob_name": blob_name,
                        "sha256": checksum,
                        "size": 512,
                        "cid": "messaging:test-room",
                        "message_id": str(message.id),
                    },
                    format="json",
                    HTTP_AUTHORIZATION=f"Bearer {token}",
                )

            self.assertEqual(commit_res.status_code, 201)
            attachment = commit_res.data["attachment"]
            self.assertEqual(attachment["name"], "photo.png")
            self.assertEqual(attachment["sha256"], checksum)
            self.assertEqual(
                attachment["url"],
                f"http://testserver/api/attachments/{attachment['id']}/download/",
            )
            message.refresh_from_db()
            self.assertEqual(len(message.attachments), 1)
            self.assertEqual(message.attachments[0]["id"], attachment["id"])
            mock_broadcast.assert_called_once()
            event = mock_broadcast.call_args[0][1]
            self.assertEqual(event["type"], "message.updated")

    def test_commit_rejects_checksum_mismatch(self):
        token = self.make_token()
        room = Room.objects.create(uuid="test-room2", client=self.user.username, agent=self.user)
        channel = Channel.objects.create(uuid=room.uuid, client=room.client)
        message = Message.objects.create(channel=channel, body="hi", sent_by=self.user.username)
        room.messages.add(message)
        with override_settings(**self._direct_upload_settings()):
            sign_res = self.client.post(
                "/api/attachments/sign/",
                {
                    "name": "photo.png",
                    "content_type": "image/png",
                    "size": 256,
                    "cid": "messaging:test-room2",
                    "message_id": str(message.id),
                },
                format="json",
                HTTP_AUTHORIZATION=f"Bearer {token}",
            )
            self.assertEqual(sign_res.status_code, 200)
            upload_id = sign_res.data["upload_id"]
            blob_name = sign_res.data["blob_name"]

            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("b" * 64, 256),
            ):
                commit_res = self.client.post(
                    "/api/attachments/commit/",
                    {
                        "upload_id": upload_id,
                        "blob_name": blob_name,
                        "sha256": "c" * 64,
                        "size": 256,
                        "message_id": str(message.id),
                    },
                    format="json",
                    HTTP_AUTHORIZATION=f"Bearer {token}",
                )

            self.assertEqual(commit_res.status_code, 400)
            message.refresh_from_db()
            self.assertEqual(message.attachments, [])
