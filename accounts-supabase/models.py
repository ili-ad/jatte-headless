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

    return_address = models.CharField(max_length=255, blank=True, null=True)
    license_number = models.CharField(max_length=100, blank=True, null=True)
    
    # New field for storing signatures:
    signature_image = models.ImageField(
        upload_to='signatures/', null=True, blank=True,
        help_text="Stored user signature image."
    )

    def __str__(self):
        return f"Profile for {self.user.username}"
