"""Tests for the ChatIdentity abstraction."""

from __future__ import annotations

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

BACKEND_ROOT = PROJECT_ROOT / "backend"
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

import django

django.setup()

from django.contrib.auth import get_user_model  # noqa: E402  pylint: disable=wrong-import-position
from django.contrib.auth.models import AnonymousUser  # noqa: E402  pylint: disable=wrong-import-position
from django.test import RequestFactory, SimpleTestCase  # noqa: E402  pylint: disable=wrong-import-position

from stream_server_django.common.identity import (  # noqa: E402  pylint: disable=wrong-import-position
    ChatIdentity,
    get_chat_identity,
)

User = get_user_model()


class ChatIdentityTests(SimpleTestCase):
    def test_authenticated_user_properties(self):
        user = User(username="alice", email="alice@example.com", supabase_uid="abc123")
        user.id = 1
        identity = ChatIdentity(user)

        self.assertTrue(identity.is_authenticated)
        self.assertEqual(identity.id, user.id)
        self.assertEqual(identity.username, user.username)
        self.assertEqual(identity.email, user.email)
        self.assertEqual(identity.supabase_uid, user.supabase_uid)
        self.assertEqual(identity.is_staff, user.is_staff)
        self.assertEqual(identity.is_superuser, user.is_superuser)
        self.assertEqual(identity.role, getattr(user, "role", "user"))
        self.assertIs(identity.user, user)
        self.assertIs(identity.as_user(), user)

    def test_anonymous_identity_defaults(self):
        identity = ChatIdentity(AnonymousUser())

        self.assertFalse(identity.is_authenticated)
        self.assertIsNone(identity.id)
        self.assertEqual(identity.username, "")
        self.assertEqual(identity.email, "")
        self.assertEqual(identity.role, "anonymous")

    def test_request_without_user_uses_anonymous(self):
        factory = RequestFactory()
        request = factory.get("/")

        identity = get_chat_identity(request)

        self.assertFalse(identity.is_authenticated)
        self.assertIsInstance(identity.user, AnonymousUser)

    def test_supabase_uid_missing_attribute(self):
        class MinimalUser:
            is_authenticated = True
            id = 42
            username = "minimal"
            email = "minimal@example.com"

        identity = ChatIdentity(MinimalUser())

        self.assertTrue(identity.is_authenticated)
        self.assertIsNone(identity.supabase_uid)
        self.assertEqual(identity.role, "user")
