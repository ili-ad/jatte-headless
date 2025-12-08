# accounts_supabase/apps.py
from django.apps import AppConfig


class AccountsSupabaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stream_server_django.accounts_supabase'

    def ready(self):
        import stream_server_django.accounts_supabase.signals  # Correct module path
