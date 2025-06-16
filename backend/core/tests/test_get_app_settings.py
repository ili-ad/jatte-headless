from django.urls import reverse
from rest_framework.test import APITestCase

class GetAppSettingsTests(APITestCase):
    def test_returns_settings(self):
        url = reverse('core:app-settings')
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data, {"file_uploads": True})
