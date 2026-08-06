from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from stream_server_django.chat.models import (
    Channel,
    Draft,
    Flag,
    Message,
    Pin,
    Reaction,
    ReadState,
    Room,
    RoomMemberMute,
    RoomMute,
)
from stream_server_django.rooms.utils import user_has_room_access


User = get_user_model()


@override_settings(
    ROOT_URLCONF="stream_server_django.chat.tests.rest_authorization_urls",
    PUBLIC_AGENT_ROOM_SLUGS=[],
)
class RestRoomAuthorizationTests(APITestCase):
    def setUp(self):
        self.member = self._user("member")
        self.collaborator = self._user("collaborator")
        self.agent = self._user("agent")
        self.outsider = self._user("outsider")
        self.staff = self._user("staff", is_staff=True)

        self.room_a = Room.objects.create(
            uuid="room-a", client=self.member.username, agent=self.agent
        )
        self.room_b = Room.objects.create(
            uuid="room-b", client=self.outsider.username
        )
        self.channel_a = Channel.objects.create(
            uuid=self.room_a.uuid, client=self.room_a.client
        )
        self.channel_b = Channel.objects.create(
            uuid=self.room_b.uuid, client=self.room_b.client
        )
        self.member_message = self._message(
            self.room_a, self.channel_a, self.member, "member text"
        )
        self.collaborator_message = self._message(
            self.room_a, self.channel_a, self.collaborator, "collaborator text"
        )
        self.secret_message = self._message(
            self.room_b, self.channel_b, self.outsider, "known secret phrase"
        )

    def _user(self, username, **extra):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            supabase_uid=username,
            password="x",
            **extra,
        )

    def _message(self, room, channel, sender, text):
        message = Message.objects.create(
            channel=channel, body=text, sent_by=sender.username
        )
        room.messages.add(message)
        return message

    def login(self, user):
        self.client.force_authenticate(user=user, token="validated-test-token")

    def test_policy_documents_client_agent_prior_sender_staff_and_nonmember(self):
        self.assertTrue(user_has_room_access(self.member, self.room_a))
        self.assertTrue(user_has_room_access(self.agent, self.room_a))
        self.assertTrue(user_has_room_access(self.collaborator, self.room_a))
        self.assertTrue(user_has_room_access(self.staff, self.room_a))
        self.assertFalse(user_has_room_access(self.outsider, self.room_a))

    def test_members_require_access_and_guessed_room_is_not_created(self):
        self.login(self.member)
        response = self.client.get(f"/test/rooms/{self.room_a.uuid}/members/")
        self.assertEqual(response.status_code, 200)
        cid_response = self.client.get(
            f"/test/cids/messaging:{self.room_a.uuid}/members/"
        )
        self.assertEqual(cid_response.status_code, 200)

        self.login(self.outsider)
        self.assertEqual(
            self.client.get(f"/test/rooms/{self.room_a.uuid}/members/").status_code,
            403,
        )

    def test_lightweight_production_aliases_apply_the_same_access_policy(self):
        self.login(self.member)
        rooms = self.client.get("/light/rooms/")
        self.assertEqual(rooms.status_code, 200)
        self.assertIn(self.room_a.uuid, {item["uuid"] for item in rooms.data})
        self.assertNotIn(self.room_b.uuid, {item["uuid"] for item in rooms.data})
        self.assertEqual(
            self.client.get(
                f"/light/rooms/messaging:{self.room_a.uuid}/members/"
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(
                f"/light/rooms/{self.room_a.uuid}/messages/"
            ).status_code,
            200,
        )
        self.assertEqual(
            self.client.post(
                f"/light/rooms/{self.room_a.uuid}/draft/",
                {"text": "light draft"},
                format="json",
            ).status_code,
            200,
        )

        self.login(self.outsider)
        before = Room.objects.count()
        self.assertEqual(
            self.client.get(
                f"/light/rooms/messaging:{self.room_a.uuid}/members/"
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(
                f"/light/rooms/{self.room_a.uuid}/messages/"
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get("/light/rooms/guessed/messages/").status_code, 404
        )
        self.assertEqual(Room.objects.count(), before)
        before = Room.objects.count()
        self.assertEqual(
            self.client.get("/test/rooms/guessed-room/members/").status_code, 404
        )
        self.assertEqual(Room.objects.count(), before)

        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get(f"/test/rooms/{self.room_a.uuid}/members/").status_code,
            403,
        )

    def test_message_list_create_and_cursor_are_room_scoped(self):
        self.login(self.member)
        url = f"/api/rooms/messaging:{self.room_a.uuid}/messages/"
        listed = self.client.get(url)
        self.assertEqual(listed.status_code, 200)
        listed_ids = {item["id"] for item in listed.data["messages"]}
        self.assertIn(self.member_message.id, listed_ids)
        self.assertNotIn(self.secret_message.id, listed_ids)

        before_cross_reply = Message.objects.count()
        cross_reply = self.client.post(
            url,
            {"text": "cross-room reply", "reply_to": self.secret_message.id},
            format="json",
        )
        self.assertEqual(cross_reply.status_code, 400)
        self.assertEqual(Message.objects.count(), before_cross_reply)

        created = self.client.post(url, {"text": "new allowed"}, format="json")
        self.assertEqual(created.status_code, 201)
        self.assertTrue(self.room_a.messages.filter(body="new allowed").exists())

        wrong_cursor = self.client.get(url, {"before": self.secret_message.id})
        self.assertEqual(wrong_cursor.status_code, 400)

        before = Message.objects.count()
        self.login(self.outsider)
        self.assertEqual(self.client.get(url).status_code, 403)
        denied = self.client.post(url, {"text": "must not exist"}, format="json")
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(Message.objects.count(), before)

    def test_read_state_is_authorized_and_scoped_to_current_user(self):
        self.login(self.member)
        mark_url = f"/test/rooms/{self.room_a.uuid}/mark-read/"
        self.assertEqual(self.client.post(mark_url).status_code, 200)
        state = ReadState.objects.get(
            channel=self.channel_a, user=str(self.member.id)
        )
        self.assertIsNotNone(state.last_read)

        self.login(self.collaborator)
        read_response = self.client.get(f"/test/rooms/{self.room_a.uuid}/read/")
        self.assertEqual(read_response.status_code, 200)
        self.assertEqual(read_response.data, [])

        self.login(self.outsider)
        count_url = f"/test/rooms/{self.room_a.uuid}/count-unread/"
        self.assertEqual(self.client.get(count_url).status_code, 403)
        self.assertEqual(self.client.post(mark_url).status_code, 403)
        self.assertEqual(
            self.client.post(
                f"/test/rooms/{self.room_a.uuid}/mark-unread/"
            ).status_code,
            403,
        )
        self.assertTrue(ReadState.objects.filter(pk=state.pk).exists())

    def test_private_config_requires_access_and_public_carveout_is_limited(self):
        self.login(self.member)
        self.assertEqual(
            self.client.get(
                f"/test/rooms/messaging:{self.room_a.uuid}/config/"
            ).status_code,
            200,
        )

        self.login(self.outsider)
        self.assertEqual(
            self.client.get(
                f"/test/rooms/messaging:{self.room_a.uuid}/config/"
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(
                f"/test/rooms/{self.room_a.uuid}/config-state/"
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(
                f"/light/rooms/{self.room_a.uuid}/config-state/"
            ).status_code,
            403,
        )
        self.assertEqual(
            self.client.get(f"/test/rooms/{self.room_a.uuid}/cooldown/").status_code,
            403,
        )

        with override_settings(PUBLIC_AGENT_ROOM_SLUGS=[self.room_a.uuid]):
            public_response = self.client.get(
                f"/test/rooms/{self.room_a.uuid}/config-state/"
            )
            lightweight_public = self.client.get(
                f"/light/rooms/{self.room_a.uuid}/config-state/"
            )
        self.assertEqual(public_response.status_code, 200)
        self.assertEqual(lightweight_public.status_code, 200)
        self.assertEqual(
            self.client.get(
                f"/test/rooms/messaging:{self.room_a.uuid}/config/"
            ).status_code,
            403,
        )

    def test_drafts_are_user_and_room_scoped(self):
        url = f"/test/rooms/{self.room_a.uuid}/draft/"
        self.login(self.member)
        self.assertEqual(
            self.client.post(url, {"text": "member draft"}, format="json").status_code,
            200,
        )
        self.assertEqual(Draft.objects.filter(room=self.room_a).count(), 1)

        self.login(self.collaborator)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])

        self.login(self.outsider)
        denied = self.client.post(url, {"text": "outsider"}, format="json")
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(Draft.objects.filter(room=self.room_a).count(), 1)

    def test_member_mute_requires_room_admin_and_actual_participant(self):
        url = f"/test/rooms/messaging:{self.room_a.uuid}/mutes/"
        self.login(self.member)
        self_mute = self.client.post(url, {"user_id": self.member.id})
        self.assertEqual(self_mute.status_code, 201)
        denied = self.client.post(url, {"user_id": self.collaborator.id})
        self.assertEqual(denied.status_code, 403)
        self.assertFalse(
            RoomMemberMute.objects.filter(user=self.collaborator).exists()
        )

        self.login(self.agent)
        allowed = self.client.post(url, {"user_id": self.collaborator.id})
        self.assertEqual(allowed.status_code, 201)
        cross_room = self.client.post(url, {"user_id": self.outsider.id})
        self.assertEqual(cross_room.status_code, 403)
        self.assertFalse(
            RoomMemberMute.objects.filter(
                room=self.room_a, user=self.outsider
            ).exists()
        )

    def test_room_mute_status_and_list_do_not_leak_inaccessible_rooms(self):
        RoomMute.objects.create(user=self.member, room=self.room_a)
        RoomMute.objects.create(user=self.member, room=self.room_b)
        self.login(self.member)
        status_response = self.client.get(
            f"/test/rooms/messaging:{self.room_a.uuid}/mute/"
        )
        self.assertEqual(status_response.status_code, 200)
        self.assertTrue(status_response.data["muted"])
        listed = self.client.get("/test/muted-channels/")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual([item["uuid"] for item in listed.data], [self.room_a.uuid])

        self.login(self.outsider)
        self.assertEqual(
            self.client.get(
                f"/test/rooms/messaging:{self.room_a.uuid}/mute/"
            ).status_code,
            403,
        )

    def test_query_and_pinned_results_require_room_access(self):
        Pin.objects.create(message=self.member_message, user=self.agent)
        Pin.objects.create(message=self.secret_message, user=self.staff)
        self.login(self.member)
        pinned = self.client.get(f"/test/rooms/{self.room_a.uuid}/pinned/")
        self.assertEqual(pinned.status_code, 200)
        self.assertEqual([item["id"] for item in pinned.data], [self.member_message.id])
        query = self.client.get(f"/test/rooms/{self.room_a.uuid}/query/")
        self.assertEqual(query.status_code, 200)
        self.assertNotIn(self.secret_message.id, {item["id"] for item in query.data["messages"]})

        self.login(self.outsider)
        self.assertEqual(
            self.client.get(f"/test/rooms/{self.room_a.uuid}/pinned/").status_code,
            403,
        )
        self.assertEqual(
            self.client.get(f"/test/rooms/{self.room_a.uuid}/query/").status_code,
            403,
        )

    def test_room_admin_mutations_reject_member_and_allow_agent_or_staff(self):
        self.login(self.member)
        self.assertEqual(
            self.client.post(f"/test/rooms/{self.room_a.uuid}/archive/").status_code,
            403,
        )
        self.room_a.refresh_from_db()
        self.assertEqual(self.room_a.status, Room.ACTIVE)
        self.assertEqual(
            self.client.post(f"/test/rooms/{self.room_a.uuid}/truncate/").status_code,
            403,
        )
        self.assertTrue(self.room_a.messages.exists())

        self.login(self.agent)
        self.assertEqual(
            self.client.post(f"/test/rooms/{self.room_a.uuid}/archive/").status_code,
            200,
        )
        self.assertEqual(
            self.client.post(f"/test/rooms/{self.room_a.uuid}/unarchive/").status_code,
            200,
        )
        self.assertEqual(
            self.client.post(f"/test/rooms/{self.room_a.uuid}/hide/").status_code,
            200,
        )
        self.assertEqual(
            self.client.post(f"/test/rooms/{self.room_a.uuid}/show/").status_code,
            200,
        )

        self.login(self.staff)
        self.assertEqual(
            self.client.post(f"/test/rooms/{self.room_a.uuid}/truncate/").status_code,
            200,
        )
        self.assertFalse(self.room_a.messages.exists())

    def test_direct_message_access_and_mutation_roles(self):
        self.login(self.member)
        self.assertEqual(
            self.client.get(f"/api/messages/{self.collaborator_message.id}/").status_code,
            200,
        )
        denied = self.client.put(
            f"/api/messages/{self.collaborator_message.id}/",
            {"text": "member overwrite"},
            format="json",
        )
        self.assertEqual(denied.status_code, 403)
        denied_delete = self.client.delete(
            f"/api/messages/{self.collaborator_message.id}/"
        )
        self.assertEqual(denied_delete.status_code, 403)
        self.collaborator_message.refresh_from_db()
        self.assertEqual(self.collaborator_message.body, "collaborator text")
        self.assertIsNone(self.collaborator_message.deleted_at)

        self.login(self.collaborator)
        allowed = self.client.put(
            f"/api/messages/{self.collaborator_message.id}/",
            {"text": "author update"},
            format="json",
        )
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(
            self.client.delete(
                f"/api/messages/{self.collaborator_message.id}/"
            ).status_code,
            200,
        )

        self.login(self.member)
        wrong_room = self.client.get(
            f"/api/rooms/messaging:{self.room_a.uuid}/messages/{self.secret_message.id}/"
        )
        self.assertEqual(wrong_room.status_code, 404)

        self.login(self.outsider)
        self.assertEqual(
            self.client.get(f"/api/messages/{self.member_message.id}/").status_code,
            403,
        )

    @override_settings(CHAT_ALLOW_SELF_HIDE=True)
    def test_hide_restore_require_access_and_author_or_room_admin(self):
        self.member_message.deleted_at = self.member_message.created_at
        self.member_message.save(update_fields=["deleted_at"])

        self.login(self.member)
        hidden = self.client.post(f"/api/messages/{self.member_message.id}/hide/")
        self.assertEqual(hidden.status_code, 200)
        restored = self.client.post(
            f"/api/messages/{self.member_message.id}/restore/"
        )
        self.assertEqual(restored.status_code, 200)

        self.login(self.outsider)
        self.assertEqual(
            self.client.post(f"/api/messages/{self.member_message.id}/hide/").status_code,
            403,
        )

    def test_react_and_flag_require_access_and_reaction_is_idempotent(self):
        reaction_url = f"/api/messages/{self.member_message.id}/reactions/like/"
        flag_url = f"/api/messages/{self.member_message.id}/flag/"
        self.login(self.member)
        self.assertEqual(self.client.post(reaction_url).status_code, 200)
        self.assertEqual(self.client.post(reaction_url).status_code, 200)
        self.assertEqual(
            Reaction.objects.filter(
                message=self.member_message, user=self.member, type="like"
            ).count(),
            1,
        )
        self.assertEqual(self.client.post(flag_url).status_code, 201)
        self.assertTrue(Flag.objects.filter(message=self.member_message).exists())

        self.login(self.outsider)
        before = Reaction.objects.count()
        self.assertEqual(self.client.post(reaction_url).status_code, 403)
        self.assertEqual(Reaction.objects.count(), before)

    def test_pin_unpin_and_actions_require_room_admin(self):
        pin_url = f"/api/messages/{self.member_message.id}/pin/"
        unpin_url = f"/api/messages/{self.member_message.id}/unpin/"
        action_url = f"/api/messages/{self.member_message.id}/actions/"
        self.login(self.member)
        self.assertEqual(self.client.post(pin_url).status_code, 403)
        self.assertEqual(
            self.client.put(
                f"/api/messages/{self.member_message.id}/",
                {"text": "member edit", "pinned": True},
                format="json",
            ).status_code,
            403,
        )
        self.assertFalse(Pin.objects.filter(message=self.member_message).exists())
        self.assertEqual(
            self.client.post(action_url, {"name": "unsafe"}).status_code, 403
        )

        self.login(self.agent)
        self.assertEqual(self.client.post(pin_url).status_code, 201)
        self.assertEqual(
            self.client.post(action_url, {"name": "approve"}).status_code, 201
        )
        self.assertEqual(self.client.delete(unpin_url).status_code, 204)

    def test_search_and_room_lists_are_access_scoped(self):
        misbound = Message.objects.create(
            channel=self.channel_a,
            body="misbound channel secret",
            sent_by=self.outsider.username,
        )
        self.room_b.messages.add(misbound)
        self.login(self.member)
        found = self.client.get("/search/messages/", {"q": "member"})
        self.assertEqual(found.status_code, 200)
        self.assertIn(
            self.member_message.id, {item["id"] for item in found.data["results"]}
        )
        secret = self.client.get("/search/messages/", {"q": "known secret"})
        self.assertEqual(secret.status_code, 200)
        self.assertEqual(secret.data["results"], [])
        misbound_search = self.client.get(
            "/search/messages/", {"q": "misbound channel secret"}
        )
        self.assertEqual(misbound_search.status_code, 200)
        self.assertEqual(misbound_search.data["results"], [])

        rooms = self.client.get("/api/rooms/")
        self.assertEqual(rooms.status_code, 200)
        room_ids = {item["uuid"] for item in rooms.data}
        self.assertIn(self.room_a.uuid, room_ids)
        self.assertNotIn(self.room_b.uuid, room_ids)
        created = self.client.post(
            "/api/rooms/",
            {"uuid": "member-created", "client": self.outsider.username},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(
            Room.objects.get(uuid="member-created").client, self.member.username
        )
        self.assertEqual(
            self.client.get(f"/api/rooms/{self.room_b.uuid}/").status_code, 404
        )
        denied_update = self.client.patch(
            f"/api/rooms/{self.room_a.uuid}/",
            {"data": {"name": "member cannot rename"}},
            format="json",
        )
        self.assertEqual(denied_update.status_code, 403)

        self.login(self.agent)
        allowed_update = self.client.patch(
            f"/api/rooms/{self.room_a.uuid}/",
            {"data": {"name": "agent rename"}},
            format="json",
        )
        self.assertEqual(allowed_update.status_code, 200)

        self.login(self.staff)
        staff_rooms = self.client.get("/api/rooms/")
        self.assertEqual(
            {item["uuid"] for item in staff_rooms.data},
            {self.room_a.uuid, self.room_b.uuid, "member-created"},
        )

    def test_replies_and_thread_counts_exclude_cross_room_replies(self):
        allowed_reply = Message.objects.create(
            channel=self.channel_a,
            body="allowed reply",
            sent_by=self.collaborator.username,
            reply_to=self.member_message,
        )
        self.room_a.messages.add(allowed_reply)
        secret_reply = Message.objects.create(
            channel=self.channel_b,
            body="secret reply",
            sent_by=self.outsider.username,
            reply_to=self.member_message,
        )
        self.room_b.messages.add(secret_reply)

        self.login(self.member)
        replies = self.client.get(
            f"/messages/{self.member_message.id}/replies/"
        )
        self.assertEqual(replies.status_code, 200)
        self.assertEqual(
            [item["id"] for item in replies.data["messages"]],
            [allowed_reply.id],
        )
        threads = self.client.get(
            "/threads/", {"cid": f"messaging:{self.room_a.uuid}"}
        )
        self.assertEqual(threads.status_code, 200)
        self.assertEqual(threads.data["results"][0]["reply_count"], 1)

        self.login(self.outsider)
        self.assertEqual(
            self.client.get(
                f"/messages/{self.member_message.id}/replies/"
            ).status_code,
            403,
        )
