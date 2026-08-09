# backend/jatte/auth/supabase.py
from stream_server_django.accounts_supabase.authentication import (
    SupabaseJWTAuthentication,
)


class Old_Maybe_Delete_SupabaseJWTAuthentication(SupabaseJWTAuthentication):
    """Deprecated alias retaining the shared strict Supabase validation path."""
