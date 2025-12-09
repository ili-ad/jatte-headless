from django.conf import settings
from django.utils.module_loading import import_string

DEFAULT_CHAT_AUTH = (
    "stream_server_django.accounts_supabase.authentication.SupabaseJWTAuthentication"
)


def get_chat_authentication_classes():
    path = getattr(
        settings,
        "STREAM_SERVER_CHAT_AUTHENTICATION_CLASS",
        DEFAULT_CHAT_AUTH,
    )
    cls = import_string(path)
    return [cls]
