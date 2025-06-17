from django.urls import reverse
from rest_framework.test import APITestCase

class GetTagTests(APITestCase):
    def test_returns_tag(self):
        url = reverse('core:tag')
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"tag": "root"})

    def test_wrong_method(self):
        url = reverse('core:tag')
        res = self.client.post(url)
        self.assertEqual(res.status_code, 405)
