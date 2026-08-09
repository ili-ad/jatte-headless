import json
from unittest.mock import patch

from asgiref.sync import async_to_sync, sync_to_async
from channels.testing import WebsocketCommunicator
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.test import TestCase, TransactionTestCase, override_settings
from rest_framework.test import APITestCase

from django.contrib.auth import get_user_model

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.chat.tasks import scan_attachment
from stream_server_django.chat.attachment_scanners import ScanResult
from jatte.asgi import application
from jatte.tests.jwt_factory import make_test_token
User = get_user_model()


def _scan_result(verdict, *, signature=None):
    bucket = "test-clean" if verdict == Message.ATTACHMENT_SCAN_CLEAN else "test-quarantine"
    return ScanResult(
        verdict=verdict,
        attachment_id="att_task",
        source_bucket="test-pending",
        source_blob="attachments/att_task/doc.pdf",
        verified_sha256="a" * 64,
        verified_size=100,
        destination_bucket=bucket,
        destination_blob="attachments/att_task/doc.pdf",
        engine="ClamAV",
        engine_version="1.4-test",
        definition_version="test-cvd",
        scanned_at="2026-08-09T00:00:00Z",
        source_generation="7",
        destination_generation="11",
        signature=signature,
    )


@override_settings(
    ROOT_URLCONF="stream_server_django.chat.tests.attachment_test_urls"
)
class AttachmentScanAPITests(APITestCase):
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
        self.user = User.objects.create_user(
            username="u1", email="u1@example.com", password="x", supabase_uid="u1"
        )

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

    def test_commit_sets_pending_scan_status_and_enqueues_task(self):
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
            ), patch(
                "stream_server_django.chat.api_views.scan_attachment.delay"
            ) as mock_delay:
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
        self.assertEqual(attachment["scan_status"], Message.ATTACHMENT_SCAN_PENDING)
        self.assertIsNone(attachment["scan_label"])
        self.assertEqual(attachment["mime_type"], "image/png")

        message.refresh_from_db()
        self.assertEqual(message.attachments[0]["scan_status"], Message.ATTACHMENT_SCAN_PENDING)
        mock_delay.assert_called_once_with(message.id, attachment["id"])


class AttachmentScanTaskTests(TestCase):
    def setUp(self):
        self.channel = Channel.objects.create(uuid="task-room", client="stream")
        self.message = Message.objects.create(
            channel=self.channel,
            body="hello",
            sent_by="tester",
            attachments=[
                Message.ensure_attachment_scan_defaults(
                    {
                        "id": "att_task",
                        "name": "doc.pdf",
                        "url": "https://example.com/doc.pdf",
                        "mime_type": "application/pdf",
                    }
                )
            ],
        )
        self.attachment_id = self.message.attachments[0]["id"]

    @patch("stream_server_django.chat.tasks.broadcast_message_update")
    def test_scan_marks_attachment_clean(self, mock_broadcast):
        with patch(
            "stream_server_django.chat.tasks.perform_attachment_scan",
            return_value=_scan_result(Message.ATTACHMENT_SCAN_CLEAN),
        ):
            scan_attachment(self.message.id, self.attachment_id)

        self.message.refresh_from_db()
        attachment = self.message.attachments[0]
        self.assertEqual(attachment["scan_status"], Message.ATTACHMENT_SCAN_CLEAN)
        self.assertIsNone(attachment["scan_label"])
        self.assertEqual(attachment["storage_bucket"], "test-clean")
        self.assertEqual(attachment["storage_class"], "clean")
        self.assertIn("scan_at", attachment)
        self.assertNotIn("scan_error", attachment)
        mock_broadcast.assert_called_once()

    @patch("stream_server_django.chat.tasks.broadcast_message_update")
    def test_scan_marks_attachment_flagged(self, mock_broadcast):
        with patch(
            "stream_server_django.chat.tasks.perform_attachment_scan",
            return_value=_scan_result(
                Message.ATTACHMENT_SCAN_FLAGGED, signature="Suspicious"
            ),
        ):
            scan_attachment(self.message.id, self.attachment_id)

        self.message.refresh_from_db()
        attachment = self.message.attachments[0]
        self.assertEqual(attachment["scan_status"], Message.ATTACHMENT_SCAN_FLAGGED)
        self.assertEqual(attachment["scan_label"], "Suspicious")
        self.assertEqual(attachment["storage_bucket"], "test-quarantine")
        self.assertEqual(attachment["storage_class"], "quarantine")
        mock_broadcast.assert_called_once()

    @patch("stream_server_django.chat.tasks.broadcast_message_update")
    def test_scan_records_errors(self, mock_broadcast):
        with patch(
            "stream_server_django.chat.tasks.perform_attachment_scan",
            side_effect=RuntimeError("scanner offline"),
        ):
            scan_attachment(self.message.id, self.attachment_id)

        self.message.refresh_from_db()
        attachment = self.message.attachments[0]
        self.assertEqual(attachment["scan_status"], Message.ATTACHMENT_SCAN_ERROR)
        self.assertIsNone(attachment.get("scan_label"))
        self.assertIn("scan_error", attachment)
        mock_broadcast.assert_called_once()

@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
class AttachmentScanBroadcastTests(TransactionTestCase):
    reset_sequences = True

    def test_scan_task_broadcasts_message_update(self):
        async_to_sync(self._run_test)()

    async def _run_test(self):
        channel = await sync_to_async(Channel.objects.create)(uuid="broadcast-room", client="stream")
        room = await sync_to_async(Room.objects.create)(uuid="broadcast-room", client="stream")
        message = await sync_to_async(Message.objects.create)(channel=channel, body="hi", sent_by="tester")
        await sync_to_async(room.messages.add)(message)

        attachment = Message.ensure_attachment_scan_defaults(
            {"id": "att_broadcast", "name": "file.txt", "url": "https://example.com/file.txt"}
        )
        message.attachments = [attachment]
        await sync_to_async(message.save)(update_fields=["attachments"])

        token = make_test_token("tester", email="tester@example.com")
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/?token={token}",
            headers=[(b"origin", b"http://localhost:3000")],
        )
        connected, _ = await communicator.connect()
        assert connected

        await communicator.receive_json_from()  # join event
        cid = f"messaging:{room.uuid}"
        await communicator.send_json_to({"type": "channel.watch", "cid": cid})
        payload = await communicator.receive_json_from()
        assert payload["type"] == "initialized"

        with patch(
            "stream_server_django.chat.tasks.perform_attachment_scan",
            return_value=_scan_result(Message.ATTACHMENT_SCAN_CLEAN),
        ):
            await sync_to_async(scan_attachment)(message.id, attachment["id"])

        event = await communicator.receive_json_from()
        assert event["type"] == "message.updated"
        returned = event["message"]["attachments"][0]
        assert returned["scan_status"] == Message.ATTACHMENT_SCAN_CLEAN
        assert returned["scan_label"] is None

        await communicator.disconnect()
