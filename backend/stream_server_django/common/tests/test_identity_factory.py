"""Tests for configurable ChatIdentity factory hook."""

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
from django.test import RequestFactory, SimpleTestCase, override_settings  # noqa: E402  pylint: disable=wrong-import-position

from stream_server_django.common.identity import (  # noqa: E402  pylint: disable=wrong-import-position
    ChatIdentity,
    get_chat_identity,
)

User = get_user_model()


def dummy_identity_factory(_request):
    return ChatIdentity(user="SENTINEL")


def bad_identity_factory(_request):
    return "not-a-chat-identity"


class ChatIdentityFactoryTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_default_factory_wraps_request_user(self):
        user = User(username="carol")
        request = self.factory.get("/")
        request.user = user

        identity = get_chat_identity(request)

        self.assertIsInstance(identity, ChatIdentity)
        self.assertIs(identity.user, user)

    def test_default_factory_falls_back_to_anonymous(self):
        request = self.factory.get("/")

        identity = get_chat_identity(request)

        self.assertIsInstance(identity.user, AnonymousUser)
        self.assertEqual(identity.role, "anonymous")

    @override_settings(
        STREAM_SERVER_CHAT_IDENTITY_FACTORY=(
            "stream_server_django.common.tests.test_identity_factory.dummy_identity_factory"
        )
    )
    def test_overridden_factory_is_used(self):
        request = self.factory.get("/")

        identity = get_chat_identity(request)

        self.assertIsInstance(identity, ChatIdentity)
        self.assertEqual(identity.user, "SENTINEL")

    @override_settings(
        STREAM_SERVER_CHAT_IDENTITY_FACTORY=(
            "stream_server_django.common.tests.test_identity_factory.bad_identity_factory"
        )
    )
    def test_invalid_factory_raises_type_error(self):
        request = self.factory.get("/")

        with self.assertRaises(TypeError):
            get_chat_identity(request)
