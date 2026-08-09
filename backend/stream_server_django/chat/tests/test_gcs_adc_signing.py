from datetime import datetime, timedelta, timezone
from unittest.mock import Mock, patch
from urllib.parse import parse_qs, urlparse

from django.test import SimpleTestCase

from stream_server_django.chat.storage.gcs import (
    IAMSigningIdentity,
    generate_signed_url,
    load_iam_signing_identity,
)


class ADCSignedURLTests(SimpleTestCase):
    signer_email = "jatte-attachment-signer@example.iam.gserviceaccount.com"
    fixed_now = datetime(2026, 8, 9, 12, 0, tzinfo=timezone.utc)

    def _identity(self, signature: bytes = b"iam-signature"):
        signer = Mock()
        signer.sign.return_value = signature
        return IAMSigningIdentity(self.signer_email, signer), signer

    def _assert_v4_contract(self, url, *, method, bucket, blob):
        parsed = urlparse(url)
        query = parse_qs(parsed.query)
        self.assertEqual(parsed.scheme, "https")
        self.assertEqual(parsed.netloc, "storage.googleapis.com")
        self.assertEqual(parsed.path, f"/{bucket}/{blob}")
        self.assertEqual(query["X-Goog-Algorithm"], ["GOOG4-RSA-SHA256"])
        self.assertTrue(query["X-Goog-Credential"][0].startswith(self.signer_email))
        self.assertEqual(query["X-Goog-Signature"], [b"iam-signature".hex()])
        self.assertIn(method, {"PUT", "GET"})

    def test_adc_signer_preserves_put_and_get_v4_contracts(self):
        identity, signer = self._identity()
        put_url = generate_signed_url(
            service_account=identity,
            method="PUT",
            bucket="pending",
            blob_name="attachments/a/file.txt",
            content_type="text/plain",
            expires=timedelta(minutes=10),
            now=self.fixed_now,
        )
        verify_url = generate_signed_url(
            service_account=identity,
            method="GET",
            bucket="pending",
            blob_name="attachments/a/file.txt",
            expires=timedelta(minutes=2),
            now=self.fixed_now,
        )
        download_url = generate_signed_url(
            service_account=identity,
            method="GET",
            bucket="clean",
            blob_name="attachments/a/file.txt",
            expires=timedelta(minutes=2),
            now=self.fixed_now,
            extra_query={
                "generation": "11",
                "response-content-disposition": 'attachment; filename="file.txt"',
            },
        )

        self._assert_v4_contract(
            put_url, method="PUT", bucket="pending", blob="attachments/a/file.txt"
        )
        self._assert_v4_contract(
            verify_url, method="GET", bucket="pending", blob="attachments/a/file.txt"
        )
        self._assert_v4_contract(
            download_url, method="GET", bucket="clean", blob="attachments/a/file.txt"
        )
        self.assertEqual(signer.sign.call_count, 3)
        self.assertEqual(parse_qs(urlparse(download_url).query)["generation"], ["11"])

    @patch("stream_server_django.chat.storage.gcs.iam.Signer")
    @patch("stream_server_django.chat.storage.gcs.google.auth.default")
    def test_loads_adc_and_iam_signer(self, default, signer_class):
        credentials = Mock(valid=True)
        default.return_value = (credentials, "notice-to-owner-01")
        identity = load_iam_signing_identity(self.signer_email)
        self.assertEqual(identity.client_email, self.signer_email)
        default.assert_called_once_with(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        signer_class.assert_called_once()

    @patch("stream_server_django.chat.storage.gcs.google.auth.default")
    def test_missing_adc_fails_closed(self, default):
        default.side_effect = RuntimeError("ADC unavailable")
        with self.assertRaises(RuntimeError):
            load_iam_signing_identity(self.signer_email)

    def test_missing_signer_identity_fails_closed(self):
        with self.assertRaises(ValueError):
            load_iam_signing_identity("")

    def test_iam_signing_failure_does_not_return_url(self):
        identity, signer = self._identity()
        signer.sign.side_effect = RuntimeError("signBlob denied")
        with self.assertRaises(RuntimeError):
            generate_signed_url(
                service_account=identity,
                method="GET",
                bucket="clean",
                blob_name="attachments/a/file.txt",
                expires=timedelta(minutes=2),
                now=self.fixed_now,
            )
