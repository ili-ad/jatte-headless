# accounts_supabase/apps.py
from django.apps import AppConfig


class AccountsSupabaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts_supabase'

    def ready(self):
        import accounts_supabase.signals  # Correct module path
