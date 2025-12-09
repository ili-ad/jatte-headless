#accounts/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    supabase_uid = models.CharField(
        max_length=255,
        unique=True,
        blank=True,
        null=True,
        help_text="The unique identifier from Supabase."
    )

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )

    display_name = models.CharField(max_length=255, blank=True, null=True)
    image_url = models.CharField(max_length=500, blank=True, null=True)
    extra = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.display_name or self.user.get_username()
