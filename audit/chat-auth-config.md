# Chat authentication configuration

Chat-related DRF views resolve their authentication classes via the
`get_chat_authentication_classes` helper in
`stream_server_django.common.auth_utils`. By default it imports
`stream_server_django.accounts_supabase.authentication.SupabaseJWTAuthentication`,
but host projects can override the class by setting
`STREAM_SERVER_CHAT_AUTHENTICATION_CLASS` in their Django settings.

Example override in a host project:

```python
# settings.py
STREAM_SERVER_CHAT_AUTHENTICATION_CLASS = (
    "general.auth.authentication.SupabaseJWTAuthentication"
)
```
