from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stream_server_django.accounts'

    def ready(self):
        import stream_server_django.accounts.signals  # This line ensures signals.py is loaded
