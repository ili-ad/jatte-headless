from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class UsersDirectoryTests(APITestCase):
    def setUp(self):
        user_model = get_user_model()
        self.alice = user_model.objects.create_user(
            username="alice", email="alice@example.com", password="password"
        )
        self.bob = user_model.objects.create_user(
            username="bob", email="bob@example.com", password="password"
        )

    def test_users_directory_requires_auth(self):
        url = reverse("users:list-users")
        response = self.client.get(url)
        self.assertIn(
            response.status_code,
            {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN},
        )

    def test_returns_user_directory(self):
        url = reverse("users:list-users")
        self.client.force_authenticate(self.alice)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected = [
            {"id": self.alice.id, "username": self.alice.username},
            {"id": self.bob.id, "username": self.bob.username},
        ]
        sorted_response = sorted(response.data, key=lambda item: item["id"])
        sorted_expected = sorted(expected, key=lambda item: item["id"])
        self.assertEqual(sorted_response, sorted_expected)

    def test_current_user_requires_auth(self):
        url = reverse("users:current-user")
        response = self.client.get(url)
        self.assertIn(
            response.status_code,
            {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN},
        )

    def test_returns_current_user(self):
        url = reverse("users:current-user")
        self.client.force_authenticate(self.alice)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data,
            {"id": self.alice.id, "username": self.alice.username},
        )
