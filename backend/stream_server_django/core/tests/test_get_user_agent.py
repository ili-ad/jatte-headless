import jwt
from django.conf import settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class GetUserAgentTests(APITestCase):
    def setUp(self):
        super().setUp()
        payload = {"sub": "user-1", "email": "user-1@example.com"}
        token = jwt.encode(payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        self.auth_header = {"HTTP_AUTHORIZATION": f"Bearer {token}"}

    def test_returns_user_agent(self):
        url = reverse('core:user-agent')
        res = self.client.get(url, HTTP_USER_AGENT='Vitest', **self.auth_header)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, {'user_agent': 'Vitest'})

    def test_get_requires_auth(self):
        url = reverse('core:user-agent')
        res = self.client.get(url)
        self.assertIn(res.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})

    def test_post_requires_auth(self):
        url = reverse('core:user-agent')
        res = self.client.post(url)
        self.assertIn(res.status_code, {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN})
