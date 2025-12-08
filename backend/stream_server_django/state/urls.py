"""URL routes for the State & Recovery endpoints."""

from django.urls import path

from . import views

app_name = "stream_server_django.state"

urlpatterns = [
    path("recover-state/", views.recover_state, name="recover-state"),
    path("disconnected/", views.is_disconnected, name="disconnected"),
    path("initialized/", views.is_initialized, name="initialized"),
    path("editing-audit-state/", views.editing_audit_state, name="editing-audit-state"),
]
