from django.urls import reverse
from rest_framework.test import APITestCase

class GetUserAgentTests(APITestCase):
    def test_returns_user_agent(self):
        url = reverse('core:user-agent')
        res = self.client.get(url, HTTP_USER_AGENT='Vitest')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {'user_agent': 'Vitest'})

    def test_wrong_method(self):
        url = reverse('core:user-agent')
        res = self.client.post(url)
        self.assertEqual(res.status_code, 405)
