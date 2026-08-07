"""Authorized REST contract coverage for the frontend Stream adapter subset."""

from unittest.mock import patch

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import caches
from django.test import override_settings
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Channel, Message, Reaction, Room


User = get_user_model()


@override_settings(
    ROOT_URLCONF="jatte.urls",
    PUBLIC_AGENT_ROOM_SLUGS=[],
    CACHES={
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "stream-contract-default",
        },
        "throttles": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "stream-contract-throttles",
        },
    },
)
class StreamRestContractTests(APITestCase):
    def setUp(self):
        caches["default"].clear()
        caches["throttles"].clear()
        self.member = self._user("contract-member")
        self.agent = self._user("contract-agent")
        self.outsider = self._user("contract-outsider")
        self.room = Room.objects.create(
            uuid="contract-room",
            client=self.member.username,
            agent=self.agent,
            data={"name": "Contract room"},
            status=Room.ACTIVE,
        )
        self.channel = Channel.objects.create(
            uuid=self.room.uuid, client=self.room.client
        )
        self.messages = [
            self._message(f"contract message {index}") for index in range(4)
        ]

    def tearDown(self):
        caches["default"].clear()
        caches["throttles"].clear()
        super().tearDown()

    def _user(self, username, **extra):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            supabase_uid=username,
            password="x",
            **extra,
        )

    def _message(self, text, *, sender=None, reply_to=None):
        message = Message.objects.create(
            channel=self.channel,
            body=text,
            sent_by=(sender or self.member).username,
            reply_to=reply_to,
        )
        self.room.messages.add(message)
        return message

    def token(self, user=None):
        actor = user or self.member
        return jwt.encode(
            {"sub": actor.supabase_uid, "email": actor.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )

    def auth(self, user=None):
        return {"HTTP_AUTHORIZATION": f"Bearer {self.token(user)}"}

    def assert_message_contract(self, payload):
        self.assertTrue(
            {
                "id",
                "text",
                "body",
                "sent_by",
                "created_at",
                "updated_at",
                "deleted_at",
                "attachments",
                "custom_data",
                "parent_id",
                "pinned",
            }.issubset(payload)
        )

    def test_bootstrap_routes_keep_frontend_fields_and_require_bearer_auth(self):
        token = self.token()
        headers = self.auth()

        token_response = self.client.get("/api/token/", **headers)
        self.assertEqual(token_response.status_code, 200)
        self.assertEqual(token_response.data["userID"], self.member.id)
        self.assertEqual(token_response.data["userToken"], token)

        ws_auth = self.client.get("/api/ws-auth/", **headers)
        connection = self.client.get("/api/connection-id/", **headers)
        client = self.client.get("/api/get-client/", **headers)
        state = self.client.get("/api/state/", **headers)
        initial = self.client.get("/api/init-state/", **headers)
        recovered = self.client.get("/api/recover-state/", **headers)

        self.assertEqual(ws_auth.status_code, 200)
        self.assertEqual(set(ws_auth.data), {"stream_server_django.auth", "expires"})
        self.assertTrue(
            ws_auth.data["stream_server_django.auth"].startswith(
                "ws://testserver/ws/?token="
            )
        )
        self.assertIsInstance(connection.data["connection_id"], str)
        self.assertEqual(client.data["client"]["username"], self.member.username)
        self.assertIn("stream_server_django.users", state.data)
        self.assertEqual(
            set(initial.data),
            {"text", "attachments", "poll", "custom_data", "quoted_message"},
        )
        self.assertTrue(
            {"stream_server_django.rooms", "notifications"}.issubset(recovered.data)
        )
        self.assertEqual(self.client.get("/api/get-client/").status_code, 403)

    def test_room_bootstrap_payload_and_resolver_contract(self):
        rooms = self.client.get("/api/rooms/", **self.auth())
        active = self.client.get("/api/rooms/active/", **self.auth())
        detail = self.client.get(f"/api/rooms/{self.room.uuid}/", **self.auth())

        self.assertEqual(rooms.status_code, 200)
        self.assertEqual([item["uuid"] for item in rooms.data], [self.room.uuid])
        room_payload = rooms.data[0]
        self.assertTrue(
            {
                "uuid",
                "cid",
                "type",
                "name",
                "client",
                "agent",
                "messages",
                "visible",
                "status",
            }.issubset(room_payload)
        )
        self.assertEqual(room_payload["cid"], f"messaging:{self.room.uuid}")
        self.assertEqual(room_payload["type"], "messaging")
        self.assertEqual(active.data[0]["uuid"], self.room.uuid)
        self.assertEqual(detail.data["name"], "Contract room")

        first = self.client.post(
            "/api/rooms/resolve/", {"label": "Agent Lab"}, format="json", **self.auth()
        )
        second = self.client.post(
            "/api/rooms/resolve/", {"label": "Agent Lab"}, format="json", **self.auth()
        )
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data, second.data)
        self.assertEqual(set(first.data), {"room_uuid", "name"})

    @patch("stream_server_django.chat.api_views._broadcast_to_cid")
    @patch(
        "stream_server_django.chat.api_views.should_gate_first_message",
        return_value="allow",
    )
    def test_message_crud_pagination_and_direct_payloads(self, _gate, _broadcast):
        url = f"/api/rooms/messaging:{self.room.uuid}/messages/"
        first = self.client.get(url, {"limit": 2}, **self.auth())
        self.assertEqual(first.status_code, 200)
        self.assertEqual(set(first.data), {"messages", "next"})
        self.assertEqual(len(first.data["messages"]), 2)
        self.assertIsNotNone(first.data["next"])
        self.assert_message_contract(first.data["messages"][0])

        second = self.client.get(
            url, {"limit": 2, "before": first.data["next"]}, **self.auth()
        )
        self.assertEqual(second.status_code, 200)
        self.assertTrue(
            {item["id"] for item in first.data["messages"]}.isdisjoint(
                {item["id"] for item in second.data["messages"]}
            )
        )

        created = self.client.post(
            url,
            {"body": "created through adapter", "text": "created through adapter"},
            format="json",
            **self.auth(),
        )
        self.assertEqual(created.status_code, 201, created.data)
        self.assert_message_contract(created.data)
        self.assertEqual(created.data["text"], "created through adapter")

        message_url = f"/api/messages/{created.data['id']}/"
        fetched = self.client.get(message_url, **self.auth())
        updated = self.client.put(
            message_url,
            {"body": "updated", "text": "updated"},
            format="json",
            **self.auth(),
        )
        deleted = self.client.delete(message_url, **self.auth())
        for response in (fetched, updated, deleted):
            self.assertEqual(response.status_code, 200)
            self.assert_message_contract(response.data)
        self.assertEqual(updated.data["text"], "updated")
        self.assertIsNotNone(deleted.data["deleted_at"])

    def test_member_uuid_and_cid_contracts_are_both_supported(self):
        uuid_response = self.client.get(
            f"/api/rooms/{self.room.uuid}/members/", **self.auth()
        )
        cid_response = self.client.get(
            f"/api/rooms/messaging:{self.room.uuid}/members/",
            {"limit": 1, "offset": 0},
            **self.auth(),
        )

        self.assertEqual(uuid_response.status_code, 200)
        self.assertIsInstance(uuid_response.data, list)
        self.assertTrue(all("id" in item for item in uuid_response.data))
        self.assertEqual(cid_response.status_code, 200)
        self.assertEqual(set(cid_response.data), {"members"})
        self.assertEqual(len(cid_response.data["members"]), 1)
        self.assertTrue(
            {"user_id", "role", "banned"}.issubset(cid_response.data["members"][0])
        )

    def test_read_draft_config_and_composer_shapes(self):
        room_url = f"/api/rooms/{self.room.uuid}"
        mark_read = self.client.post(f"{room_url}/mark_read/", **self.auth())
        read = self.client.get(f"{room_url}/read/", **self.auth())
        unread = self.client.get(f"{room_url}/count_unread/", **self.auth())
        last_read = self.client.get(f"{room_url}/last_read/", **self.auth())
        mark_unread = self.client.post(f"{room_url}/mark_unread/", **self.auth())

        self.assertEqual(mark_read.data, {"status": "ok"})
        self.assertTrue(
            {"user", "last_read", "unread_messages"}.issubset(read.data[0])
        )
        self.assertEqual(set(unread.data), {"unread"})
        self.assertEqual(set(last_read.data), {"last_read"})
        self.assertEqual(mark_unread.data, {"status": "ok"})

        draft_url = f"{room_url}/draft/"
        self.assertEqual(
            self.client.post(
                draft_url, {"text": "draft text"}, format="json", **self.auth()
            ).data,
            {"status": "ok"},
        )
        draft = self.client.get(draft_url, **self.auth())
        self.assertTrue({"id", "text", "body", "updated_at"}.issubset(draft.data[0]))
        self.assertEqual(self.client.delete(draft_url, **self.auth()).data, {"status": "ok"})

        config = self.client.get(
            f"/api/rooms/messaging:{self.room.uuid}/config/", **self.auth()
        )
        config_state = self.client.get(f"{room_url}/config-state/", **self.auth())
        cooldown = self.client.get(f"{room_url}/cooldown/", **self.auth())
        self.assertEqual(
            config.data,
            {"name": "Contract room", "type": "messaging", "muted": False},
        )
        self.assertTrue({"config", "has_ai_assistant", "ai_assistant"}.issubset(config_state.data))
        self.assertTrue({"composer", "ai"}.issubset(config_state.data["config"]))
        self.assertEqual(cooldown.data, {"cooldown": 0})

        composer_cases = [
            ("/api/text-composer/", {"text": "hello"}, {"text": "hello"}),
            ("/api/compose/", {"text": "hello"}, {"composition": {"text": "hello"}}),
            ("/api/has-sendable-data/", {"text": "hello"}, {"has_sendable_data": True}),
            ("/api/composition-is-empty/", {"text": "  "}, {"is_empty": True}),
        ]
        for path, payload, expected in composer_cases:
            with self.subTest(path=path):
                response = self.client.post(path, payload, format="json", **self.auth())
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.data, expected)

    def test_reaction_flag_pin_and_action_shapes(self):
        message = self.messages[0]
        base = f"/api/messages/{message.id}"

        reaction = self.client.post(
            f"{base}/reactions/", {"type": "like"}, format="json", **self.auth()
        )
        self.assertEqual(reaction.status_code, 201)
        self.assertTrue({"id", "type", "user_id", "created_at"}.issubset(reaction.data))
        listed = self.client.get(f"{base}/reactions/", **self.auth())
        self.assertEqual(listed.data[0]["type"], "like")

        typed_url = f"{base}/reactions/wow/"
        first = self.client.post(typed_url, **self.auth())
        second = self.client.post(typed_url, **self.auth())
        expected = {"status": "ok", "message_id": str(message.id), "type": "wow"}
        self.assertEqual(first.data, expected)
        self.assertEqual(second.data, expected)
        self.assertEqual(
            Reaction.objects.filter(message=message, user=self.member, type="wow").count(),
            1,
        )
        self.assertEqual(self.client.delete(typed_url, **self.auth()).data, expected)

        flagged = self.client.post(f"{base}/flag/", **self.auth())
        pinned = self.client.post(f"{base}/pin/", **self.auth(self.agent))
        action = self.client.post(
            f"{base}/actions/",
            {"name": "approve"},
            format="json",
            **self.auth(self.agent),
        )
        unpinned = self.client.delete(f"{base}/unpin/", **self.auth(self.agent))
        self.assertTrue({"flag"}.issubset(flagged.data))
        self.assertTrue({"pin"}.issubset(pinned.data))
        self.assertEqual(action.data, {"action": {"name": "approve"}})
        self.assertEqual(unpinned.status_code, 204)

    def test_search_replies_threads_and_aliases_keep_paginated_envelopes(self):
        secret_room = Room.objects.create(
            uuid="secret-contract-room", client=self.outsider.username
        )
        secret_channel = Channel.objects.create(
            uuid=secret_room.uuid, client=secret_room.client
        )
        secret = Message.objects.create(
            channel=secret_channel,
            body="exact forbidden contract phrase",
            sent_by=self.outsider.username,
        )
        secret_room.messages.add(secret)

        search = self.client.get(
            "/search/messages/", {"q": "contract", "limit": 2}, **self.auth()
        )
        self.assertEqual(search.status_code, 200)
        self.assertEqual(set(search.data), {"results", "next"})
        self.assertEqual(len(search.data["results"]), 2)
        self.assertTrue(
            {"id", "text", "user_id", "created_at", "cid"}.issubset(
                search.data["results"][0]
            )
        )
        leaked = self.client.get(
            "/search/messages/", {"q": "forbidden contract"}, **self.auth()
        )
        self.assertEqual(leaked.data, {"results": [], "next": None})

        parent = self._message("thread parent")
        self._message("thread reply", reply_to=parent)
        api_replies = self.client.get(
            f"/api/messages/{parent.id}/replies/", **self.auth()
        )
        alias_replies = self.client.get(
            f"/messages/{parent.id}/replies/", **self.auth()
        )
        self.assertEqual(api_replies.status_code, 200)
        self.assertEqual(api_replies.data, alias_replies.data)
        self.assertEqual(set(api_replies.data), {"messages", "next"})
        self.assertEqual(api_replies.data["messages"][0]["parent_id"], parent.id)

        query = {"cid": f"messaging:{self.room.uuid}", "limit": 1}
        api_threads = self.client.get("/api/threads/", query, **self.auth())
        alias_threads = self.client.get("/threads/", query, **self.auth())
        self.assertEqual(api_threads.status_code, 200)
        self.assertEqual(api_threads.data, alias_threads.data)
        self.assertEqual(set(api_threads.data), {"results", "next"})
        self.assertTrue(
            {"thread_id", "cid", "root_message", "reply_count"}.issubset(
                api_threads.data["results"][0]
            )
        )

    @override_settings(
        CHAT_ATTACHMENTS_BUCKET="contract-bucket",
        CHAT_ATTACHMENTS_ALLOWED_TYPES=["image/png"],
        CHAT_ATTACHMENTS_MAX_SIZE=1024,
        CHAT_ATTACHMENTS_PUBLIC_DOWNLOADS=False,
        CHAT_ATTACHMENTS_PUBLIC_BASE_URL="https://public.invalid",
    )
    @patch("stream_server_django.chat.api_views._get_service_account", return_value=object())
    @patch(
        "stream_server_django.chat.api_views.generate_signed_url",
        return_value="https://storage.example.test/signed",
    )
    def test_attachment_alias_sign_commit_serialization_and_private_download(
        self, _signed_url, _account
    ):
        legacy_api = self.client.post(
            "/api/attachments/", {"name": "legacy.txt"}, format="json", **self.auth()
        )
        legacy_alias = self.client.post(
            "/attachments/", {"name": "legacy.txt"}, format="json", **self.auth()
        )
        for response in (legacy_api, legacy_alias):
            self.assertEqual(response.status_code, 201)
            attachment = response.data["attachment"]
            self.assertTrue(
                {"id", "name", "filename", "url", "uploaded_by", "legacy_placeholder", "scan_status"}.issubset(
                    attachment
                )
            )
            self.assertTrue(attachment["legacy_placeholder"])
            self.assertIn("/api/attachments/", attachment["url"])

        sign = self.client.post(
            "/api/attachments/sign/",
            {
                "name": "contract.png",
                "content_type": "image/png",
                "size": 512,
                "cid": f"messaging:{self.room.uuid}",
                "message_id": str(self.messages[0].id),
            },
            format="json",
            **self.auth(),
        )
        self.assertEqual(sign.status_code, 200, sign.data)
        self.assertTrue(
            {"upload_id", "method", "url", "headers", "constraints", "blob_name", "attachment_id"}.issubset(
                sign.data
            )
        )

        with patch(
            "stream_server_django.chat.api_views.download_blob",
            return_value=("a" * 64, 512),
        ), patch("stream_server_django.chat.api_views.scan_attachment.delay"), patch(
            "stream_server_django.chat.api_views._broadcast_to_cid"
        ):
            commit = self.client.post(
                "/attachments/commit/",
                {
                    "upload_id": sign.data["upload_id"],
                    "blob_name": sign.data["blob_name"],
                    "sha256": "a" * 64,
                    "size": 512,
                    "cid": f"messaging:{self.room.uuid}",
                    "message_id": str(self.messages[0].id),
                },
                format="json",
                **self.auth(),
            )
        self.assertEqual(commit.status_code, 201, commit.data)
        attachment = commit.data["attachment"]
        self.assertTrue(
            {"id", "url", "blob", "content_type", "size", "sha256", "uploaded_by", "message_id", "cid", "room_uuid", "integrity", "scan_status"}.issubset(
                attachment
            )
        )
        self.assertIn(f"/api/attachments/{attachment['id']}/download/", attachment["url"])
        self.assertNotIn("public.invalid", attachment["url"])

        message = self.messages[0]
        message.refresh_from_db()
        message.attachments[0]["scan_status"] = Message.ATTACHMENT_SCAN_CLEAN
        message.save(update_fields=["attachments"])
        download = self.client.get(
            f"/api/attachments/{attachment['id']}/download/", **self.auth()
        )
        self.assertEqual(download.status_code, 302)
        self.assertEqual(download["Location"], "https://storage.example.test/signed")
        self.assertEqual(download["Cache-Control"], "private, no-store")
