from django.urls import resolve
from chat import api


def test_ws_auth_aliases():
    assert resolve("/api/ws-auth/").func is api.ws_auth
    assert resolve("/api/ws-auth").func is api.ws_auth
