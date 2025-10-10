"""Django application configuration for the Rooms endpoints."""

from django.apps import AppConfig


class RoomsConfig(AppConfig):
    """Configure the lightweight rooms REST API app."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "rooms"
