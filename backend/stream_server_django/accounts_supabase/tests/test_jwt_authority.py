import time
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import jwt
from asgiref.sync import async_to_sync
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from cryptography.hazmat.primitives.asymmetric import rsa
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase, override_settings
from django.urls import path
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APITestCase

from jatte.tests.jwt_factory import make_test_token
from stream_server_django.accounts_supabase.authentication import (
    decode_supabase_token,
)
from stream_server_django.chat.consumers import ChatConsumer


User = get_user_model()
websocket_application = URLRouter(
    [path("ws/<str:room_key>/", ChatConsumer.as_asgi())]
)


@override_settings(ROOT_URLCONF="jatte.urls")
class JWTAuthorityHTTPTests(APITestCase):
    def test_valid_hs256_token_authenticates_and_api_token_relays_exactly(self):
        token = make_test_token("valid-http")
        with patch("jwt.encode") as encode:
            response = self.client.get(
                "/api/token/", HTTP_AUTHORIZATION=f"Bearer {token}"
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["userToken"], token)
        self.assertEqual(response["Cache-Control"], "no-store")
        self.assertEqual(response["Pragma"], "no-cache")
        self.assertTrue(User.objects.filter(username="valid-http").exists())
        encode.assert_not_called()

    def test_ws_auth_compatibility_url_relays_without_minting(self):
        token = make_test_token("ws-auth-relay")
        with patch("jwt.encode") as encode:
            response = self.client.get(
                "/api/ws-auth/", HTTP_AUTHORIZATION=f"Bearer {token}"
            )
        self.assertEqual(response.status_code, 200)
        relayed = parse_qs(
            urlparse(response.data["stream_server_django.auth"]).query
        )["token"][0]
        self.assertEqual(relayed, token)
        self.assertEqual(response["Cache-Control"], "no-store")
        encode.assert_not_called()

    def test_invalid_authority_and_lifetime_matrix_fails_before_provisioning(self):
        now = int(time.time())
        cases = {
            "expired": make_test_token(
                "expired", claims={"iat": now - 7200, "exp": now - 3600}
            ),
            "missing-exp": make_test_token("missing-exp", remove=("exp",)),
            "missing-iat": make_test_token("missing-iat", remove=("iat",)),
            "missing-issuer": make_test_token("missing-issuer", remove=("iss",)),
            "wrong-issuer": make_test_token(
                "wrong-issuer", claims={"iss": "https://attacker.invalid/auth/v1"}
            ),
            "missing-audience": make_test_token(
                "missing-audience", remove=("aud",)
            ),
            "wrong-audience": make_test_token(
                "wrong-audience", claims={"aud": "service_role"}
            ),
            "missing-subject": make_test_token("removed", remove=("sub",)),
            "invalid-signature": make_test_token(
                "invalid-signature", key="different-secret"
            ),
            "unexpected-algorithm": make_test_token(
                "unexpected-algorithm", algorithm="HS384"
            ),
        }
        for label, token in cases.items():
            with self.subTest(label=label):
                before = User.objects.count()
                response = self.client.get(
                    "/api/token/", HTTP_AUTHORIZATION=f"Bearer {token}"
                )
                self.assertIn(response.status_code, {401, 403})
                self.assertEqual(User.objects.count(), before)

    def test_old_locally_minted_token_cannot_authenticate_or_extend_itself(self):
        old_token = jwt.encode(
            {"sub": "old-local", "email": "old@example.com"},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        for route in ("/refresh-token/", "/api/refresh-token/"):
            with self.subTest(route=route):
                response = self.client.get(
                    route, HTTP_AUTHORIZATION=f"Bearer {old_token}"
                )
                self.assertIn(response.status_code, {401, 403})
        self.assertFalse(User.objects.filter(username="old-local").exists())

    def test_expired_token_cannot_use_refresh_relays(self):
        now = int(time.time())
        token = make_test_token(
            "expired-refresh", claims={"iat": now - 7200, "exp": now - 3600}
        )
        for route in ("/refresh-token/", "/api/refresh-token/"):
            response = self.client.get(
                route, HTTP_AUTHORIZATION=f"Bearer {token}"
            )
            self.assertIn(response.status_code, {401, 403})

    def test_both_refresh_aliases_are_exact_non_minting_no_store_relays(self):
        token = make_test_token("relay-user")
        with patch("jwt.encode") as encode:
            responses = [
                self.client.get(route, HTTP_AUTHORIZATION=f"Bearer {token}")
                for route in ("/refresh-token/", "/api/refresh-token/")
            ]
        for response in responses:
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data, {"token": token})
            self.assertEqual(response["Cache-Control"], "no-store")
            self.assertEqual(response["Pragma"], "no-cache")
        encode.assert_not_called()

    def test_missing_trusted_authority_configuration_fails_closed(self):
        token = make_test_token("config-user")
        with override_settings(SUPABASE_JWT_ISSUER=None):
            with self.assertRaises(AuthenticationFailed):
                decode_supabase_token(token)
        with override_settings(SUPABASE_JWT_AUDIENCE=None):
            with self.assertRaises(AuthenticationFailed):
                decode_supabase_token(token)

    def test_rs256_uses_same_claim_and_authority_validation(self):
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key = private_key.public_key()
        valid = make_test_token(
            "rs-valid",
            algorithm="RS256",
            key=private_key,
            headers={"kid": "test-key"},
        )
        missing_exp = make_test_token(
            "rs-missing-exp",
            algorithm="RS256",
            key=private_key,
            headers={"kid": "test-key"},
            remove=("exp",),
        )
        wrong_issuer = make_test_token(
            "rs-wrong-issuer",
            algorithm="RS256",
            key=private_key,
            headers={"kid": "test-key"},
            claims={"iss": "https://attacker.invalid/auth/v1"},
        )
        with override_settings(SUPABASE_JWKS_URL="https://project.test/jwks"):
            with patch(
                "stream_server_django.accounts_supabase.authentication.PyJWKClient.get_signing_key_from_jwt",
                return_value=SimpleNamespace(key=public_key),
            ):
                self.assertEqual(decode_supabase_token(valid)["sub"], "rs-valid")
                for token in (missing_exp, wrong_issuer):
                    with self.assertRaises(AuthenticationFailed):
                        decode_supabase_token(token)


@override_settings(
    CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
)
class JWTAuthorityWebSocketTests(TransactionTestCase):
    def _connect(self, token):
        return async_to_sync(self._connect_async)(token)

    async def _connect_async(self, token):
        communicator = WebsocketCommunicator(
            websocket_application, f"/ws/chat/?token={token}"
        )
        connected, code = await communicator.connect()
        if connected:
            await communicator.receive_json_from()
            await communicator.disconnect()
        else:
            await communicator.wait()
        return connected, code

    def test_valid_token_authenticates_websocket(self):
        connected, _code = self._connect(make_test_token("valid-websocket"))
        self.assertTrue(connected)

    def test_authority_lifetime_and_required_claim_failures_close_websocket(self):
        now = int(time.time())
        cases = (
            make_test_token(
                "ws-expired", claims={"iat": now - 7200, "exp": now - 3600}
            ),
            make_test_token("ws-missing-exp", remove=("exp",)),
            make_test_token("ws-missing-iat", remove=("iat",)),
            make_test_token("ws-missing-issuer", remove=("iss",)),
            make_test_token(
                "ws-wrong-issuer",
                claims={"iss": "https://attacker.invalid/auth/v1"},
            ),
            make_test_token("ws-missing-audience", remove=("aud",)),
            make_test_token(
                "ws-wrong-audience", claims={"aud": "service_role"}
            ),
            make_test_token("ws-missing-subject", remove=("sub",)),
        )
        for token in cases:
            connected, code = self._connect(token)
            self.assertFalse(connected)
            self.assertEqual(code, 4401)
        self.assertEqual(User.objects.count(), 0)
