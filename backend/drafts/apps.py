"""Application configuration for the Drafts API."""

from django.apps import AppConfig


class DraftsConfig(AppConfig):
    """Expose Django metadata for the Drafts endpoints."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "drafts"
