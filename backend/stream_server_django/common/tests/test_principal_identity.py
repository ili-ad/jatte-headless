from __future__ import annotations

from typing import List

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase

from stream_server_django.common.identity import PrincipalBackedIdentity


class DummyPrincipal:
    def __init__(self) -> None:
        self.id = "principal-id"
        self.username = "principal-user"
        self.email = "principal@example.com"
        self.is_authenticated = True
        self.is_staff = False
        self.is_superuser = False
        self.role = "user"
        self.supabase_uid = "supabase-123"


class PrincipalBackedIdentityPrincipalTests(SimpleTestCase):
    def test_principal_identity_prefers_principal_fields(self) -> None:
        principal = DummyPrincipal()
        identity = PrincipalBackedIdentity(principal=principal)

        self.assertTrue(identity.is_authenticated)
        self.assertEqual(identity.id, "principal-id")
        self.assertEqual(identity.username, "principal-user")
        self.assertEqual(identity.email, "principal@example.com")
        self.assertFalse(identity.is_staff)
        self.assertFalse(identity.is_superuser)
        self.assertEqual(identity.supabase_uid, "supabase-123")
        self.assertEqual(identity.role, "user")


class PrincipalBackedIdentityLazyUserTests(TestCase):
    def test_principal_identity_lazy_user_loader(self) -> None:
        User = get_user_model()
        created = User.objects.create_user(username="dbuser", password="x")

        loader_calls: List[int] = []

        def loader():
            loader_calls.append(1)
            return created

        principal = DummyPrincipal()
        identity = PrincipalBackedIdentity(principal=principal, user_loader=loader)

        # Before as_user is called, user should remain the base ChatIdentity user
        self.assertFalse(identity.user.is_authenticated)

        loaded_user = identity.as_user()
        self.assertIs(loaded_user, created)
        self.assertEqual(loader_calls, [1])

        # Subsequent calls should reuse the cached user without invoking loader again
        again = identity.as_user()
        self.assertIs(again, created)
        self.assertEqual(loader_calls, [1])


class PrincipalBackedIdentityFallbackTests(TestCase):
    def test_principal_identity_falls_back_to_user_when_missing_fields(self) -> None:
        class MinimalPrincipal:
            def __init__(self) -> None:
                self.sub = "sub-only"

        User = get_user_model()
        user = User.objects.create_user(username="fallback", password="x")

        principal = MinimalPrincipal()
        identity = PrincipalBackedIdentity(principal=principal, user=user)

        self.assertEqual(identity.id, "sub-only")
        self.assertEqual(identity.username, "fallback")
        self.assertIs(identity.as_user(), user)
