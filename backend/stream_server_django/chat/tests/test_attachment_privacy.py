import json
from unittest.mock import patch

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from django.contrib.auth import get_user_model
from django.core.cache import caches
from django.test import override_settings
from rest_framework.test import APITestCase

from stream_server_django.chat.api_views import (
    _delete_upload_session,
    _load_upload_session,
)
from stream_server_django.chat.attachment_security import sign_attachment_metadata
from stream_server_django.chat.models import Channel, Message, Room
from jatte.tests.jwt_factory import make_test_token


User = get_user_model()


@override_settings(
    ROOT_URLCONF="stream_server_django.chat.tests.attachment_test_urls",
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "attachment-privacy-default",
        },
        "throttles": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "attachment-privacy-throttles",
        },
    },
)
class AttachmentPrivacyTests(APITestCase):
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

    def setUp(self):
        caches["default"].clear()
        caches["throttles"].clear()
        self.owner = User.objects.create_user(
            username="owner-sub",
            email="owner@example.com",
            password="x",
            supabase_uid="owner-sub",
        )
        self.outsider = User.objects.create_user(
            username="outsider-sub",
            email="outsider@example.com",
            password="x",
            supabase_uid="outsider-sub",
        )
        self.room = Room.objects.create(uuid="room-a", client=self.owner.username)
        self.channel = Channel.objects.create(
            uuid=self.room.uuid, client=self.room.client
        )
        self.message = Message.objects.create(
            channel=self.channel,
            body="attachment parent",
            sent_by=self.owner.username,
        )
        self.room.messages.add(self.message)

    def tearDown(self):
        caches["default"].clear()
        caches["throttles"].clear()
        super().tearDown()

    def token(self, user):
        return make_test_token(user.supabase_uid, email=user.email)

    def auth(self, user):
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token(user)}"}

    def upload_settings(self, **overrides):
        values = {
            "CHAT_ATTACHMENTS_BUCKET": "test-bucket",
            "CHAT_ATTACHMENTS_SERVICE_ACCOUNT_INFO": self.service_account_json,
            "CHAT_ATTACHMENTS_ALLOWED_TYPES": ["image/png", "text/plain"],
            "CHAT_ATTACHMENTS_MAX_SIZE": 1024,
            "CHAT_ATTACHMENTS_UPLOAD_TTL_SECONDS": 600,
            "CHAT_ATTACHMENTS_SIGN_TTL_SECONDS": 600,
            "CHAT_ATTACHMENTS_DOWNLOAD_TTL_SECONDS": 120,
            "CHAT_ATTACHMENTS_PUBLIC_DOWNLOADS": False,
            "CHAT_ATTACHMENTS_PUBLIC_BASE_URL": "https://public.example.test",
        }
        values.update(overrides)
        return values

    def sign(self, user=None, **payload):
        data = {
            "name": "photo.png",
            "content_type": "image/png",
            "size": 512,
            "cid": f"messaging:{self.room.uuid}",
        }
        data.update(payload)
        with patch(
            "stream_server_django.chat.api_views.generate_signed_url",
            return_value="https://storage.example.test/signed-put",
        ):
            return self.client.post(
                "/api/attachments/sign/",
                data,
                format="json",
                **self.auth(user or self.owner),
            )

    def commit(self, sign_response, user=None, **payload):
        data = {
            "upload_id": sign_response.data["upload_id"],
            "blob_name": sign_response.data["blob_name"],
            "sha256": "a" * 64,
            "size": 512,
            "cid": f"messaging:{self.room.uuid}",
            "message_id": str(self.message.id),
        }
        data.update(payload)
        return self.client.post(
            "/api/attachments/commit/",
            data,
            format="json",
            **self.auth(user or self.owner),
        )

    def commit_unbound(self, sign_response, *, room=None, user=None):
        target_room = room or self.room
        data = {
            "upload_id": sign_response.data["upload_id"],
            "blob_name": sign_response.data["blob_name"],
            "sha256": "a" * 64,
            "size": 512,
            "cid": f"messaging:{target_room.uuid}",
        }
        with patch(
            "stream_server_django.chat.api_views.download_blob",
            return_value=("a" * 64, 512),
        ):
            return self.client.post(
                "/api/attachments/commit/",
                data,
                format="json",
                **self.auth(user or self.owner),
            )

    def create_message(self, attachment, *, room=None):
        target_room = room or self.room
        with patch(
            "stream_server_django.chat.api_views.should_gate_first_message",
            return_value="allow",
        ), patch("stream_server_django.chat.api_views._broadcast_to_cid"):
            return self.client.post(
                f"/api/rooms/messaging:{target_room.uuid}/messages/",
                {"text": "attachment message", "attachments": [attachment]},
                format="json",
                **self.auth(self.owner),
            )

    def update_message(self, message, attachment):
        with patch("stream_server_django.chat.api_views._broadcast_to_cid"):
            return self.client.put(
                f"/api/messages/{message.id}/",
                {"text": "updated", "attachments": [attachment]},
                format="json",
                **self.auth(self.owner),
            )

    def test_sign_binds_sanitized_metadata_to_uploader_room_and_message(self):
        with override_settings(**self.upload_settings()):
            response = self.sign(
                name="../../unsafe name?.png", message_id=str(self.message.id)
            )

        self.assertEqual(response.status_code, 200)
        session = _load_upload_session(response.data["upload_id"])
        self.assertIsNotNone(session)
        self.assertEqual(session["user_id"], self.owner.id)
        self.assertEqual(session["cid"], "messaging:room-a")
        self.assertEqual(session["room_uuid"], self.room.uuid)
        self.assertEqual(session["message_id"], str(self.message.id))
        self.assertEqual(session["content_type"], "image/png")
        self.assertEqual(session["size"], 512)
        self.assertEqual(session["name"], "unsafe_name_.png")
        self.assertTrue(session["blob_name"].endswith("/unsafe_name_.png"))

    def test_sign_requires_existing_accessible_room_or_message(self):
        with override_settings(**self.upload_settings()):
            forbidden = self.sign(self.outsider)
            missing_binding = self.sign(cid="")
            guessed = self.sign(cid="messaging:missing-room")

        self.assertEqual(forbidden.status_code, 403)
        self.assertEqual(missing_binding.status_code, 400)
        self.assertEqual(guessed.status_code, 404)
        self.assertFalse(Room.objects.filter(uuid="missing-room").exists())

    def test_sign_rejects_invalid_mime_and_oversize(self):
        with override_settings(**self.upload_settings()):
            invalid_mime = self.sign(content_type="application/x-msdownload")
            oversized = self.sign(size=1025)

        self.assertEqual(invalid_mime.status_code, 400)
        self.assertEqual(oversized.status_code, 400)

    def test_commit_is_private_bound_and_idempotent(self):
        with override_settings(**self.upload_settings()):
            signed = self.sign(message_id=str(self.message.id))
            self.assertEqual(signed.status_code, 200)
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("a" * 64, 512),
            ) as verify, patch(
                "stream_server_django.chat.api_views.scan_attachment.delay"
            ), patch(
                "stream_server_django.chat.api_views._broadcast_to_cid"
            ):
                first = self.commit(signed)
                replay = self.commit(signed)

        self.assertEqual(first.status_code, 201)
        self.assertEqual(replay.status_code, 200)
        self.assertEqual(first.data, replay.data)
        attachment = first.data["attachment"]
        self.assertEqual(
            attachment["url"],
            f"http://testserver/api/attachments/{attachment['id']}/download/",
        )
        self.assertNotIn("public.example.test", attachment["url"])
        self.assertEqual(attachment["blob"], signed.data["blob_name"])
        self.assertEqual(attachment["uploaded_by"], str(self.owner.id))
        self.assertEqual(attachment["message_id"], str(self.message.id))
        self.assertEqual(attachment["cid"], "messaging:room-a")
        self.assertTrue(attachment["integrity"])
        self.message.refresh_from_db()
        self.assertEqual(len(self.message.attachments), 1)
        verify.assert_called_once()

    def test_cross_user_cannot_consume_or_destroy_upload_session(self):
        with override_settings(**self.upload_settings()):
            signed = self.sign(message_id=str(self.message.id))
            denied = self.commit(signed, self.outsider)
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("a" * 64, 512),
            ), patch(
                "stream_server_django.chat.api_views.scan_attachment.delay"
            ), patch(
                "stream_server_django.chat.api_views._broadcast_to_cid"
            ):
                owner_commit = self.commit(signed)

        self.assertEqual(denied.status_code, 403)
        self.assertEqual(owner_commit.status_code, 201)

    def test_commit_rejects_blob_size_checksum_and_expired_sessions(self):
        with override_settings(**self.upload_settings()):
            wrong_blob_sign = self.sign(message_id=str(self.message.id))
            wrong_blob = self.commit(wrong_blob_sign, blob_name="attachments/other")

            wrong_size_sign = self.sign(message_id=str(self.message.id))
            wrong_size = self.commit(wrong_size_sign, size=511)

            actual_size_sign = self.sign(message_id=str(self.message.id))
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("a" * 64, 511),
            ):
                actual_size = self.commit(actual_size_sign)

            wrong_checksum_sign = self.sign(message_id=str(self.message.id))
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("b" * 64, 512),
            ):
                wrong_checksum = self.commit(wrong_checksum_sign)

            expired_sign = self.sign(message_id=str(self.message.id))
            _delete_upload_session(expired_sign.data["upload_id"])
            expired = self.commit(expired_sign)

        self.assertEqual(wrong_blob.status_code, 400)
        self.assertEqual(wrong_size.status_code, 400)
        self.assertEqual(actual_size.status_code, 400)
        self.assertEqual(wrong_checksum.status_code, 400)
        self.assertEqual(expired.status_code, 400)
        self.message.refresh_from_db()
        self.assertEqual(self.message.attachments, [])

    def test_commit_rejects_message_cid_mismatch_and_access_revocation(self):
        other_room = Room.objects.create(uuid="room-b", client=self.owner.username)
        other_channel = Channel.objects.create(uuid="room-b", client=self.owner.username)
        other_message = Message.objects.create(
            channel=other_channel, body="other", sent_by=self.owner.username
        )
        other_room.messages.add(other_message)

        with override_settings(**self.upload_settings()):
            signed = self.sign(message_id=str(self.message.id))
            mismatch = self.commit(signed, message_id=str(other_message.id))

            cid_sign = self.sign(message_id=str(self.message.id))
            cid_mismatch = self.commit(cid_sign, cid="messaging:room-b")

            revoked_sign = self.sign(message_id=str(self.message.id))
            self.room.client = "someone-else"
            self.room.save(update_fields=["client"])
            self.message.sent_by = "someone-else"
            self.message.save(update_fields=["sent_by"])
            revoked = self.commit(revoked_sign)

        self.assertEqual(mismatch.status_code, 400)
        self.assertEqual(cid_mismatch.status_code, 400)
        self.assertEqual(revoked.status_code, 403)
        self.message.refresh_from_db()
        self.assertEqual(self.message.attachments, [])

    def store_attachment(self, scan_status, attachment_id="att_private"):
        attachment = {
            "id": attachment_id,
            "name": "private.txt",
            "filename": "private.txt",
            "url": f"http://testserver/api/attachments/{attachment_id}/download/",
            "blob": f"attachments/{attachment_id}/private.txt",
            "content_type": "text/plain",
            "mime_type": "text/plain",
            "size": 10,
            "sha256": "a" * 64,
            "uploaded_by": str(self.owner.id),
            "message_id": str(self.message.id),
            "cid": "messaging:room-a",
            "room_uuid": "room-a",
            "scan_status": scan_status,
            "scan_label": None,
        }
        attachment["integrity"] = sign_attachment_metadata(attachment)
        self.message.attachments = [attachment]
        self.message.save(update_fields=["attachments"])
        return attachment

    def test_download_reauthorizes_parent_room_and_hides_inaccessible_ids(self):
        attachment = self.store_attachment(Message.ATTACHMENT_SCAN_CLEAN)
        url = f"/api/attachments/{attachment['id']}/download/"
        with override_settings(**self.upload_settings()), patch(
            "stream_server_django.chat.api_views.generate_signed_url",
            return_value="https://storage.example.test/private-get",
        ) as signer:
            allowed = self.client.get(url, **self.auth(self.owner))
            denied = self.client.get(url, **self.auth(self.outsider))
            guessed = self.client.get(
                "/api/attachments/att_unknown/download/", **self.auth(self.outsider)
            )
            anonymous = self.client.get(url)

        self.assertEqual(allowed.status_code, 302)
        self.assertEqual(allowed["Location"], "https://storage.example.test/private-get")
        self.assertEqual(allowed["Cache-Control"], "private, no-store")
        self.assertEqual(denied.status_code, 404)
        self.assertEqual(guessed.status_code, 404)
        self.assertEqual(anonymous.status_code, 403)
        signer.assert_called_once()

    def test_download_rejects_forged_or_cross_room_attachment_metadata(self):
        attachment = self.store_attachment(Message.ATTACHMENT_SCAN_CLEAN)
        attachment["blob"] = "attachments/someone-else/private.txt"
        self.message.attachments = [attachment]
        self.message.save(update_fields=["attachments"])

        with override_settings(**self.upload_settings()), patch(
            "stream_server_django.chat.api_views.generate_signed_url"
        ) as signer:
            response = self.client.get(
                f"/api/attachments/{attachment['id']}/download/",
                **self.auth(self.owner),
            )

        self.assertEqual(response.status_code, 404)
        signer.assert_not_called()

    def test_download_is_revoked_when_room_access_is_removed(self):
        attachment = self.store_attachment(Message.ATTACHMENT_SCAN_CLEAN)
        self.room.client = "someone-else"
        self.room.save(update_fields=["client"])
        self.message.sent_by = "someone-else"
        self.message.save(update_fields=["sent_by"])

        with override_settings(**self.upload_settings()), patch(
            "stream_server_django.chat.api_views.generate_signed_url"
        ) as signer:
            response = self.client.get(
                f"/api/attachments/{attachment['id']}/download/",
                **self.auth(self.owner),
            )

        self.assertEqual(response.status_code, 404)
        signer.assert_not_called()

    def test_download_scan_policy_blocks_pending_flagged_and_error(self):
        expectations = {
            Message.ATTACHMENT_SCAN_PENDING: 423,
            Message.ATTACHMENT_SCAN_FLAGGED: 403,
            Message.ATTACHMENT_SCAN_ERROR: 503,
        }
        with override_settings(**self.upload_settings()):
            for scan_status, expected in expectations.items():
                with self.subTest(scan_status=scan_status):
                    attachment = self.store_attachment(scan_status)
                    response = self.client.get(
                        f"/api/attachments/{attachment['id']}/download/",
                        **self.auth(self.owner),
                    )
                    self.assertEqual(response.status_code, expected)

    def test_public_url_requires_explicit_public_download_flag(self):
        with override_settings(**self.upload_settings()):
            private_sign = self.sign(message_id=str(self.message.id))
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("a" * 64, 512),
            ), patch(
                "stream_server_django.chat.api_views.scan_attachment.delay"
            ), patch(
                "stream_server_django.chat.api_views._broadcast_to_cid"
            ):
                private_commit = self.commit(private_sign)

        self.message.attachments = []
        self.message.save(update_fields=["attachments"])

        public_settings = self.upload_settings(CHAT_ATTACHMENTS_PUBLIC_DOWNLOADS=True)
        with override_settings(**public_settings):
            public_sign = self.sign(message_id=str(self.message.id))
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("a" * 64, 512),
            ), patch(
                "stream_server_django.chat.api_views.scan_attachment.delay"
            ), patch(
                "stream_server_django.chat.api_views._broadcast_to_cid"
            ):
                public_commit = self.commit(public_sign)

        self.assertIn("/api/attachments/", private_commit.data["attachment"]["url"])
        self.assertTrue(
            public_commit.data["attachment"]["url"].startswith(
                "https://public.example.test/attachments/"
            )
        )

    def test_message_create_rejects_arbitrary_attachment_url(self):
        arbitrary = {
            "id": "att_external",
            "name": "external.txt",
            "url": "https://attacker.example/secret.txt",
            "legacy_placeholder": True,
        }
        with override_settings(**self.upload_settings()):
            response = self.create_message(arbitrary)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(self.room.messages.filter(body="attachment message").exists())

    def test_message_create_rejects_arbitrary_blob_and_checksum(self):
        arbitrary = {
            "id": "att_blob",
            "name": "forged.txt",
            "url": "http://testserver/api/attachments/att_blob/download/",
            "blob": "attachments/victim/private.txt",
            "content_type": "text/plain",
            "size": 10,
            "sha256": "f" * 64,
            "uploaded_by": str(self.owner.id),
            "cid": "messaging:room-a",
            "room_uuid": "room-a",
        }
        with override_settings(**self.upload_settings()):
            response = self.create_message(arbitrary)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(self.room.messages.filter(body="attachment message").exists())

    def test_message_create_rejects_forged_integrity(self):
        forged = {
            "id": "att_forged",
            "name": "forged.txt",
            "url": "http://testserver/api/attachments/att_forged/download/",
            "blob": "attachments/att_forged/forged.txt",
            "content_type": "text/plain",
            "size": 10,
            "sha256": "f" * 64,
            "uploaded_by": str(self.owner.id),
            "message_id": None,
            "cid": "messaging:room-a",
            "room_uuid": "room-a",
            "integrity": "forged-signature",
        }
        with override_settings(**self.upload_settings()):
            response = self.create_message(forged)

        self.assertEqual(response.status_code, 400)
        self.assertFalse(self.room.messages.filter(body="attachment message").exists())

    def test_message_create_accepts_and_rebinds_committed_pre_message_attachment(self):
        with override_settings(**self.upload_settings()):
            signed = self.sign()
            committed = self.commit_unbound(signed)
            self.assertEqual(committed.status_code, 201)
            unbound = committed.data["attachment"]
            self.assertIsNone(unbound["message_id"])
            response = self.create_message(unbound)
            replay = self.create_message(unbound)

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(replay.status_code, 400)
        created = self.room.messages.get(body="attachment message")
        attachment = created.attachments[0]
        self.assertEqual(attachment["message_id"], str(created.id))
        self.assertNotEqual(attachment["integrity"], unbound["integrity"])

    def test_message_create_rejects_committed_attachment_from_another_room(self):
        room_b = Room.objects.create(uuid="room-b", client=self.owner.username)
        with override_settings(**self.upload_settings()):
            signed = self.sign(cid="messaging:room-b")
            committed = self.commit_unbound(signed, room=room_b)
            self.assertEqual(committed.status_code, 201)
            response = self.create_message(committed.data["attachment"])

        self.assertEqual(response.status_code, 400)
        self.assertFalse(self.room.messages.filter(body="attachment message").exists())

    def test_message_update_rejects_arbitrary_url(self):
        arbitrary = {
            "id": "att_update_external",
            "name": "external.txt",
            "url": "https://attacker.example/secret.txt",
            "legacy_placeholder": True,
            "message_id": str(self.message.id),
        }
        with override_settings(**self.upload_settings()):
            response = self.update_message(self.message, arbitrary)

        self.assertEqual(response.status_code, 400)
        self.message.refresh_from_db()
        self.assertEqual(self.message.attachments, [])

    def test_message_update_rejects_cross_message_attachment(self):
        other = Message.objects.create(
            channel=self.channel, body="other message", sent_by=self.owner.username
        )
        self.room.messages.add(other)
        with override_settings(**self.upload_settings()):
            signed = self.sign(message_id=str(other.id))
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("a" * 64, 512),
            ), patch(
                "stream_server_django.chat.api_views.scan_attachment.delay"
            ), patch(
                "stream_server_django.chat.api_views._broadcast_to_cid"
            ):
                committed = self.commit(signed, message_id=str(other.id))
            self.assertEqual(committed.status_code, 201)
            response = self.update_message(
                self.message, committed.data["attachment"]
            )

        self.assertEqual(response.status_code, 400)
        self.message.refresh_from_db()
        self.assertEqual(self.message.attachments, [])

    def test_message_update_accepts_valid_same_message_attachment(self):
        with override_settings(**self.upload_settings()):
            signed = self.sign(message_id=str(self.message.id))
            with patch(
                "stream_server_django.chat.api_views.download_blob",
                return_value=("a" * 64, 512),
            ), patch(
                "stream_server_django.chat.api_views.scan_attachment.delay"
            ), patch(
                "stream_server_django.chat.api_views._broadcast_to_cid"
            ):
                committed = self.commit(signed)
            self.assertEqual(committed.status_code, 201)
            response = self.update_message(
                self.message, committed.data["attachment"]
            )

        self.assertEqual(response.status_code, 200, response.data)
        self.message.refresh_from_db()
        self.assertEqual(self.message.body, "updated")
        self.assertEqual(len(self.message.attachments), 1)

    def test_message_create_public_metadata_requires_explicit_flag(self):
        public_settings = self.upload_settings(CHAT_ATTACHMENTS_PUBLIC_DOWNLOADS=True)
        with override_settings(**public_settings):
            denied_sign = self.sign()
            denied_attachment = self.commit_unbound(denied_sign).data["attachment"]
            allowed_sign = self.sign()
            allowed_attachment = self.commit_unbound(allowed_sign).data["attachment"]
            allowed = self.create_message(allowed_attachment)

        with override_settings(**self.upload_settings()):
            denied = self.create_message(denied_attachment)

        self.assertEqual(allowed.status_code, 201)
        self.assertEqual(denied.status_code, 400)

    def test_message_create_accepts_explicit_non_downloadable_legacy_placeholder(self):
        with override_settings(**self.upload_settings()):
            placeholder = self.client.post(
                "/api/attachments/",
                {"name": "legacy.txt"},
                format="json",
                **self.auth(self.owner),
            )
            self.assertEqual(placeholder.status_code, 201)
            response = self.create_message(placeholder.data["attachment"])

        self.assertEqual(response.status_code, 201, response.data)
        created = self.room.messages.get(body="attachment message")
        attachment = created.attachments[0]
        self.assertTrue(attachment["legacy_placeholder"])
        self.assertNotIn("blob", attachment)
        self.assertNotIn("integrity", attachment)
