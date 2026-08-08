from urllib.parse import quote
from unittest.mock import patch
import importlib

import jwt
from django.conf import settings
from django.apps import apps
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from stream_server_django.chat.models import Channel, Message, Room
from stream_server_django.polls.models import Poll, PollAnswer, PollOption, PollVote


User = get_user_model()


@override_settings(
    ROOT_URLCONF="jatte.urls",
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}},
)
class PollRoomAuthorizationTests(APITestCase):
    def setUp(self):
        self.member_a = self._user("member-a")
        self.member_b = self._user("member-b")
        self.outsider = self._user("outsider")
        self.participant = self._user("participant")
        self.agent = self._user("agent")
        self.staff = self._user("staff", is_staff=True)

        self.room_a = Room.objects.create(
            uuid="room-a", client=self.member_a.supabase_uid, agent=self.agent
        )
        self.room_b = Room.objects.create(
            uuid="room-b", client=self.member_b.supabase_uid
        )
        channel = Channel.objects.create(uuid="membership", client="membership")
        membership = Message.objects.create(
            channel=channel, body="joined", sent_by=self.participant.username
        )
        self.room_a.messages.add(membership)

        self.poll_a = self._poll(self.room_a, self.member_a, "Poll A")
        self.poll_b = self._poll(self.room_b, self.member_b, "Poll B")
        self.option_a = PollOption.objects.create(
            poll=self.poll_a, text="A", created_by=self.member_a
        )
        self.option_b = PollOption.objects.create(
            poll=self.poll_b, text="B", created_by=self.member_b
        )
        PollAnswer.objects.create(poll=self.poll_a, text="answer", user=self.member_a)
        PollVote.objects.create(
            poll=self.poll_a, option=self.option_a, user=self.member_a
        )
        PollVote.objects.create(
            poll=self.poll_b, option=self.option_b, user=self.member_b
        )

    def _user(self, username, **kwargs):
        return User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="pwd",
            supabase_uid=username,
            **kwargs,
        )

    def _poll(self, room, creator, question):
        return Poll.objects.create(
            room=room,
            cid=room.cid,
            question=question,
            created_by=creator,
        )

    def _headers(self, user):
        token = jwt.encode(
            {"sub": user.username, "email": user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_anonymous_poll_list_is_denied(self):
        response = self.client.get(f"/polls/?cid={self.room_a.cid}")
        self.assertEqual(response.status_code, 403)

    def test_list_is_room_scoped_and_inaccessible_counts_are_not_leaked(self):
        allowed = self.client.get(
            f"/polls/?cid={self.room_a.cid}", **self._headers(self.member_a)
        )
        self.assertEqual(allowed.status_code, 200)
        self.assertEqual(
            [item["poll_id"] for item in allowed.data["results"]],
            [str(self.poll_a.id)],
        )

        cross_room = self.client.get(
            f"/polls/?cid={self.room_b.cid}", **self._headers(self.member_a)
        )
        outsider = self.client.get(
            f"/polls/?cid={self.room_a.cid}", **self._headers(self.outsider)
        )
        self.assertEqual(cross_room.status_code, 403)
        self.assertEqual(outsider.status_code, 403)
        self.assertNotIn("count", getattr(cross_room, "data", {}))
        self.assertNotIn("count", getattr(outsider, "data", {}))

    def test_create_requires_existing_authorized_room_before_side_effects(self):
        payload = {"cid": self.room_a.cid, "question": "New?", "options": ["x"]}
        allowed = self.client.post(
            "/polls/", payload, format="json", **self._headers(self.member_a)
        )
        self.assertEqual(allowed.status_code, 201)
        created = Poll.objects.get(pk=allowed.data["poll"]["poll_id"])
        self.assertEqual(created.room, self.room_a)
        self.assertEqual(created.cid, self.room_a.cid)

        before = (Poll.objects.count(), PollOption.objects.count(), Room.objects.count())
        with patch("stream_server_django.polls.views._broadcast_poll_event") as broadcast:
            denied = self.client.post(
                "/polls/", payload, format="json", **self._headers(self.outsider)
            )
            guessed = self.client.post(
                "/polls/",
                {"cid": "messaging:guessed", "question": "No", "options": ["x"]},
                format="json",
                **self._headers(self.member_a),
            )
        self.assertEqual(denied.status_code, 403)
        self.assertEqual(guessed.status_code, 404)
        self.assertEqual(
            (Poll.objects.count(), PollOption.objects.count(), Room.objects.count()),
            before,
        )
        broadcast.assert_not_called()

    def test_option_and_answer_operations_authorize_through_poll_room(self):
        option_url = f"/polls/{self.poll_a.id}/options/"
        answer_url = f"/polls/{self.poll_a.id}/answers/"
        option = self.client.post(
            option_url,
            {"text": "new option"},
            format="json",
            **self._headers(self.member_a),
        )
        answer = self.client.post(
            answer_url,
            {"text": "new answer"},
            format="json",
            **self._headers(self.member_a),
        )
        self.assertEqual(option.status_code, 200)
        self.assertEqual(answer.status_code, 200)

        before = (PollOption.objects.count(), PollAnswer.objects.count())
        denied_option = self.client.post(
            option_url,
            {"text": "denied"},
            format="json",
            **self._headers(self.outsider),
        )
        denied_answer = self.client.post(
            answer_url,
            {"text": "denied"},
            format="json",
            **self._headers(self.outsider),
        )
        self.assertEqual(denied_option.status_code, 404)
        self.assertEqual(denied_answer.status_code, 404)
        self.assertEqual((PollOption.objects.count(), PollAnswer.objects.count()), before)

    def test_poll_and_option_substitution_is_rejected(self):
        response = self.client.post(
            f"/polls/{self.poll_a.id}/options/{self.option_b.id}/votes/",
            {},
            format="json",
            **self._headers(self.member_a),
        )
        self.assertEqual(response.status_code, 404)
        self.assertFalse(
            PollVote.objects.filter(poll=self.poll_a, user=self.member_a, option=self.option_b).exists()
        )

    def test_vote_lifecycle_is_room_authorized_and_idempotent(self):
        voter = self.participant
        url = f"/polls/{self.poll_a.id}/options/{self.option_a.id}/votes/"
        first = self.client.post(url, {}, format="json", **self._headers(voter))
        second = self.client.post(url, {}, format="json", **self._headers(voter))
        listing = self.client.get(url, **self._headers(voter))
        removed = self.client.delete(url, **self._headers(voter))
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(PollVote.objects.filter(poll=self.poll_a, user=voter).count(), 0)
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(removed.status_code, 200)

    def test_vote_change_and_event_cid_derive_from_bound_room(self):
        second_option = PollOption.objects.create(
            poll=self.poll_a, text="A2", created_by=self.member_a
        )
        PollVote.objects.create(
            poll=self.poll_a, option=self.option_a, user=self.participant
        )
        Poll.objects.filter(pk=self.poll_a.pk).update(cid=self.room_b.cid)
        self.poll_a.refresh_from_db()
        with patch("stream_server_django.polls.views._broadcast_poll_event") as broadcast:
            response = self.client.post(
                f"/polls/{self.poll_a.id}/options/{second_option.id}/votes/",
                {},
                format="json",
                **self._headers(self.participant),
            )
        self.assertEqual(response.status_code, 200)
        payload = broadcast.call_args.args[1]
        self.assertEqual(payload["type"], "poll.vote_changed")
        self.assertEqual(payload["cid"], self.room_a.cid)

    def test_outsider_cannot_read_count_or_mutate_votes_and_emits_nothing(self):
        url = f"/polls/{self.poll_a.id}/options/{self.option_a.id}/votes/"
        before = PollVote.objects.count()
        with patch("stream_server_django.polls.views._broadcast_poll_event") as broadcast:
            listing = self.client.get(url, **self._headers(self.outsider))
            create = self.client.post(url, {}, format="json", **self._headers(self.outsider))
            remove = self.client.delete(url, **self._headers(self.outsider))
        self.assertEqual([listing.status_code, create.status_code, remove.status_code], [404, 404, 404])
        self.assertEqual(PollVote.objects.count(), before)
        for response in (listing, create, remove):
            self.assertNotIn("count", getattr(response, "data", {}))
        broadcast.assert_not_called()

    def test_poll_list_cursor_is_bound_to_room(self):
        self._poll(self.room_b, self.member_b, "Poll B2")
        room_b_page = self.client.get(
            f"/polls/?cid={self.room_b.cid}&limit=1", **self._headers(self.member_b)
        )
        cursor = quote(room_b_page.data["next"], safe="")
        cross = self.client.get(
            f"/polls/?cid={self.room_a.cid}&cursor={cursor}",
            **self._headers(self.member_a),
        )
        self.assertEqual(cross.status_code, 400)
        self.assertNotIn("results", cross.data)

    def test_vote_cursor_is_bound_to_poll_and_option(self):
        second_b_voter = self._user("member-b-2")
        PollVote.objects.create(
            poll=self.poll_b, option=self.option_b, user=second_b_voter
        )
        page = self.client.get(
            f"/polls/{self.poll_b.id}/options/{self.option_b.id}/votes/?limit=1",
            **self._headers(self.member_b),
        )
        cursor = quote(page.data["next"], safe="")
        cross = self.client.get(
            f"/polls/{self.poll_a.id}/options/{self.option_a.id}/votes/?cursor={cursor}",
            **self._headers(self.member_a),
        )
        self.assertEqual(cross.status_code, 400)
        self.assertNotIn("results", cross.data)
        self.assertNotIn("count", cross.data)

    def test_delete_policy_creator_agent_staff_and_participant(self):
        participant_poll = self._poll(self.room_a, self.member_a, "participant denied")
        denied = self.client.delete(
            f"/polls/{participant_poll.id}/", **self._headers(self.participant)
        )
        self.assertEqual(denied.status_code, 403)
        self.assertTrue(Poll.objects.filter(pk=participant_poll.pk).exists())

        creator_poll = self._poll(self.room_a, self.member_a, "creator")
        creator = self.client.delete(
            f"/polls/{creator_poll.id}/", **self._headers(self.member_a)
        )
        agent_poll = self._poll(self.room_a, self.member_a, "agent")
        agent = self.client.delete(
            f"/polls/{agent_poll.id}/", **self._headers(self.agent)
        )
        staff_poll = self._poll(self.room_a, self.member_a, "staff")
        staff = self.client.delete(
            f"/polls/{staff_poll.id}/", **self._headers(self.staff)
        )
        self.assertEqual([creator.status_code, agent.status_code, staff.status_code], [204, 204, 204])

        outsider_poll = self._poll(self.room_a, self.member_a, "outsider")
        outsider = self.client.delete(
            f"/polls/{outsider_poll.id}/", **self._headers(self.outsider)
        )
        self.assertEqual(outsider.status_code, 404)
        self.assertTrue(Poll.objects.filter(pk=outsider_poll.pk).exists())

    def test_orphaned_historical_poll_is_not_api_reachable(self):
        orphan = Poll.objects.create(
            cid="messaging:missing", question="orphan", created_by=self.member_a
        )
        response = self.client.post(
            f"/polls/{orphan.id}/options/",
            {"text": "no"},
            format="json",
            **self._headers(self.member_a),
        )
        self.assertEqual(response.status_code, 404)

    def test_data_migration_binds_only_existing_rooms_and_preserves_orphans(self):
        matching = Poll.objects.create(
            cid=self.room_a.cid, question="matching", created_by=self.member_a
        )
        orphan = Poll.objects.create(
            cid="messaging:missing-room", question="orphan", created_by=self.member_a
        )
        migration = importlib.import_module(
            "stream_server_django.polls.migrations.0002_poll_room"
        )
        migration.bind_existing_polls(apps, None)
        matching.refresh_from_db()
        orphan.refresh_from_db()
        self.assertEqual(matching.room, self.room_a)
        self.assertEqual(matching.cid, self.room_a.cid)
        self.assertIsNone(orphan.room)

    def test_legacy_api_aliases_use_canonical_room_bound_models(self):
        created = self.client.post(
            "/api/polls/",
            {"cid": self.room_a.cid, "question": "legacy", "options": ["one"]},
            format="json",
            **self._headers(self.member_a),
        )
        self.assertEqual(created.status_code, 201)
        poll = Poll.objects.get(pk=created.data["poll"]["id"])
        self.assertEqual(poll.room, self.room_a)

        listed = self.client.get("/api/polls/", **self._headers(self.member_a))
        self.assertEqual(listed.status_code, 200)
        listed_ids = {item["id"] for item in listed.data}
        self.assertIn(str(self.poll_a.id), listed_ids)
        self.assertNotIn(str(self.poll_b.id), listed_ids)

        option = self.client.post(
            f"/api/polls/{poll.id}/options/",
            {"text": "two"},
            format="json",
            **self._headers(self.member_a),
        )
        self.assertEqual(option.status_code, 201)
        self.assertTrue(
            PollOption.objects.filter(
                poll_id=poll.id, id=option.data["poll_option"]["id"]
            ).exists()
        )

    def test_legacy_aliases_reject_cross_room_reads_mutations_and_delete(self):
        list_b = self.client.get(
            f"/api/polls/?cid={self.room_b.cid}", **self._headers(self.member_a)
        )
        option = self.client.post(
            f"/api/polls/{self.poll_b.id}/options/",
            {"text": "denied"},
            format="json",
            **self._headers(self.member_a),
        )
        votes = self.client.get(
            f"/api/polls/{self.poll_b.id}/options/{self.option_b.id}/votes/",
            **self._headers(self.member_a),
        )
        delete = self.client.delete(
            f"/api/polls/{self.poll_b.id}/", **self._headers(self.member_a)
        )
        self.assertEqual([list_b.status_code, option.status_code, votes.status_code, delete.status_code], [403, 404, 404, 404])
        self.assertTrue(Poll.objects.filter(pk=self.poll_b.pk).exists())
