# Auth user usage audit

This audit captures where `stream_server_django` references the Django user model and how those references resolve to `settings.AUTH_USER_MODEL`/`get_user_model()`.

## User model references

- `accounts_supabase/authentication.py` – loads users via `get_user_model()` when validating Supabase JWTs; expects a `supabase_uid` field.
- `accounts_supabase/views.py` – queries `get_user_model()` for user CRUD; serializes profile `display_name`/`image_url` when present.
- `accounts/middleware.py` – uses `get_user_model()` to attach the authenticated user to the request context.
- `chat/models.py` – all user relations use `settings.AUTH_USER_MODEL` (owners, moderators, mutes, reminders, etc.).
- `chat/serializers.py` – resolves `get_user_model()` for serializers; optionally reads profile `display_name`/`image_url` when available.
- `chat/api_views.py` – fetches users via `get_user_model()` for message/user endpoints.
- `chat/views.py` – resolves `get_user_model()` when serving chat view helpers.
- `chat/tests/*` – every chat test now fabricates users via `get_user_model()` instead of a concrete class.
- `chat_addons/admin_console/services/*` – operator lookups use `get_user_model()`.
- `chat_addons/sms_bridge/services/linking.py` – uses `get_user_model()` and expects a `supabase_uid` field when creating SMS-linked users.
- `chat_addons/*/tests/*` – addon tests create users through `get_user_model()`.
- `chat_addons/notifications/views.py` – notification recipients come from `get_user_model()`/`settings.AUTH_USER_MODEL` annotations.
- `chat_addons/agent/services/agent_service.py` – worker helpers resolve `get_user_model()` for supabase-linked users.
- `rooms/views.py` and `rooms/tests/*` – room membership logic constructs users through `get_user_model()`.
- `mutes/views.py` and `mutes/tests/*` – mute APIs/tests rely on `get_user_model()` users.
- `reminders/tests/test_reminders.py` – reminder API tests create users via `get_user_model()`.
- `polls/tests/test_polls.py` and `polls/tests/test_votes.py` – poll tests create users via `get_user_model()`.
- `state/tests/test_state_recovery.py` – recovery tests fabricate users with `get_user_model()`.
- `drafts/tests/test_room_drafts.py`, `rooms/tests/test_room_config_state.py`, `users/views.py`, and `users/tests/test_users_directory.py` – ancillary helpers resolve users via `get_user_model()`.
- All model relations in `accounts_supabase`, `accounts`, `events`, `polls`, `chat`, `chat_addons/notifications`, and migrations point to `settings.AUTH_USER_MODEL`.

## Minimal user model contract for stream_server_django

- `AUTH_USER_MODEL` must point to a valid Django user model.
- The user model must expose a `supabase_uid` string field when Supabase integration is enabled.
- Additional fields such as `display_name`/`image_url` (used via related profiles) are optional. Some serializers/tests read these values if present but gracefully handle `None`.
