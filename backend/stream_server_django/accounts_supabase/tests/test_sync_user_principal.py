from django.contrib.sessions.middleware import SessionMiddleware
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from stream_server_django.accounts_supabase.views import SyncUserView


class DummyPrincipal:
    is_authenticated = True
    id = "principal-user"


def _add_session(request):
    middleware = SessionMiddleware(lambda req: None)
    middleware.process_request(request)
    request.session.save()


class SyncUserPrincipalTests(TestCase):
    def test_sync_user_principal_no_refresh_from_db_crash(self):
        factory = APIRequestFactory()
        request = factory.post("/api/sync-user/", {}, format="json")
        _add_session(request)
        force_authenticate(request, user=DummyPrincipal())

        response = SyncUserView.as_view()(request)

        self.assertIn(response.status_code, (200, 201))
