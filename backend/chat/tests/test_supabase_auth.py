from django.urls import reverse
from rest_framework.test import APITestCase
from unittest.mock import patch
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from jwt.utils import base64url_encode
import jwt
from django.conf import settings


def make_keys():
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pub = priv.public_key().public_numbers()
    jwk = {
        "kty": "RSA",
        "kid": "test",
        "use": "sig",
        "alg": "RS256",
        "n": base64url_encode(pub.n.to_bytes((pub.n.bit_length() + 7) // 8, "big")),
        "e": base64url_encode(pub.e.to_bytes((pub.e.bit_length() + 7) // 8, "big")),
    }
    return priv, {"keys": [jwk]}


class SupabaseAuthAPITests(APITestCase):
    def test_rs256_jwt_via_jwks(self):
        priv, jwks = make_keys()
        token = jwt.encode({"sub": "u1", "email": "u1@example.com"}, priv, algorithm="RS256", headers={"kid": "test"})
        url = reverse("ws-auth")
        with patch("jwt.PyJWKClient.fetch_data", return_value=jwks):
            res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertIn("auth", res.data)
        self.assertIn("expires", res.data)

    def test_token_endpoint(self):
        priv, jwks = make_keys()
        token = jwt.encode({"sub": "u1", "email": "u1@example.com"}, priv, algorithm="RS256", headers={"kid": "test"})
        url = reverse("token-obtain")
        with patch("jwt.PyJWKClient.fetch_data", return_value=jwks):
            res = self.client.get(url, HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["userID"], 1)
        payload = jwt.decode(res.data["userToken"], settings.SUPABASE_JWT_SECRET, algorithms=["HS256"])
        self.assertEqual(payload["user_id"], 1)

