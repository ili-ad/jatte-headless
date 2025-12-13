# backend/accounts_supabase/views.py
from typing import Any, Mapping

import logging
import uuid

import jwt
from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.common.auth_utils import get_chat_authentication_classes
from stream_server_django.core.views import UserAgentView  # noqa: F401 (re-export)


logger = logging.getLogger(__name__)

PROFILE_SESSION_KEY = "user_profile"

class SyncUserRequestSerializer(serializers.Serializer):
    display_name = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    image_url = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    extra = serializers.DictField(
        child=serializers.JSONField(), required=False, allow_empty=True
    )


def _get_profile_model():
    try:
        return apps.get_model("accounts_supabase", "UserProfile")
    except (LookupError, ValueError):
        return None
    except Exception:
        logger.exception("accounts_supabase.UserProfile lookup failed")
        return None


def _get_profile(user):
    profile_model = _get_profile_model()
    if not profile_model:
        return None

    try:
        return profile_model.objects.filter(user=user).first()
    except Exception:
        logger.exception("UserProfile lookup failed", extra={"user_id": getattr(user, "id", None)})
        return None


def _ensure_profile(user):
    profile_model = _get_profile_model()
    if not profile_model:
        return None
    try:
        profile, _ = profile_model.objects.get_or_create(user=user)
        return profile
    except Exception:
        logger.exception("UserProfile get_or_create failed", extra={"user_id": getattr(user, "id", None)})
        return None


def _get_session_profile(session):
    if session is None:
        return {}
    profile_data = session.get(PROFILE_SESSION_KEY) or {}
    if not isinstance(profile_data, Mapping):
        return {}
    return dict(profile_data)


def _persist_session_profile(session, profile_data):
    if session is None:
        return
    session[PROFILE_SESSION_KEY] = profile_data


def _apply_user_field_updates(user, profile_updates):
    update_fields = []
    for key in ("display_name", "image_url", "extra"):
        if key in profile_updates and hasattr(user, key):
            setattr(user, key, profile_updates[key])
            update_fields.append(key)
    if update_fields and hasattr(user, "save"):
        try:
            user.save(update_fields=update_fields)
        except Exception:
            logger.exception("Saving user profile fields failed", extra={"user_id": getattr(user, "id", None)})


def _normalize_profile_mapping(data):
    normalized = {
        "display_name": data.get("display_name") or None,
        "image_url": data.get("image_url") or None,
        "extra": data.get("extra") or {},
    }
    if not isinstance(normalized["extra"], Mapping):
        normalized["extra"] = {}
    return normalized


def serialize_current_user(user, *, session=None):
    payload = {
        "id": getattr(user, "id", None),
        "username": getattr(user, "username", None),
    }

    profile_data: dict[str, Any] = {
        "display_name": None,
        "image_url": None,
        "extra": {},
    }

    profile = _get_profile(user)
    if profile:
        profile_data = {
            "display_name": getattr(profile, "display_name", None) or None,
            "image_url": getattr(profile, "image_url", None) or None,
            "extra": getattr(profile, "extra", {}) or {},
        }

    if profile_data["display_name"] is None or profile_data["image_url"] is None or not profile_data["extra"]:
        session_profile = _get_session_profile(session)
        profile_data = {
            **profile_data,
            **_normalize_profile_mapping(session_profile),
        }

    for field in ("display_name", "image_url", "extra"):
        candidate = getattr(user, field, None)
        if candidate and (field != "extra" or isinstance(candidate, Mapping)):
            profile_data[field] = candidate

    profile_data = _normalize_profile_mapping(profile_data)
    payload.update(profile_data)
    return payload


class SyncUserView(APIView):
    # explicitly setting here again as sanity check
    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile = _ensure_profile(user)

        incoming_data: Mapping[str, Any]
        if isinstance(request.data, Mapping):
            incoming_data = request.data
        else:
            incoming_data = {}

        serializer = SyncUserRequestSerializer(
            data={
                key: incoming_data[key]
                for key in ("display_name", "image_url", "extra")
                if key in incoming_data
            },
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        validated = dict(serializer.validated_data)

        additional = {
            key: value
            for key, value in incoming_data.items()
            if key not in {"display_name", "image_url", "extra"}
        }
        if additional:
            existing_extra = validated.get("extra") or {}
            if not isinstance(existing_extra, dict):
                existing_extra = {}
            existing_extra.update(additional)
            validated["extra"] = existing_extra

        profile_updates = _normalize_profile_mapping(validated)
        profile_updates = {key: value for key, value in profile_updates.items() if key in validated}
        if profile:
            update_fields = []
            if "display_name" in validated:
                profile.display_name = profile_updates["display_name"] or ""
                update_fields.append("display_name")
            if "image_url" in validated:
                profile.image_url = profile_updates["image_url"] or ""
                update_fields.append("image_url")
            if "extra" in validated:
                profile.extra = profile_updates["extra"]
                update_fields.append("extra")

            if update_fields:
                profile.save(update_fields=update_fields)
        else:
            session_profile = _get_session_profile(request.session)
            session_profile.update(profile_updates)
            _persist_session_profile(request.session, session_profile)
            _apply_user_field_updates(user, session_profile)

        request.session['disconnected'] = False
        request.session['initialized'] = True

        user.refresh_from_db()

        payload = serialize_current_user(user, session=request.session)
        return Response(payload, status=status.HTTP_201_CREATED)


class SessionView(APIView):
    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.session['disconnected'] = True
        request.session['initialized'] = False
        return Response(status=204)


class ClientIDView(APIView):
    """Return a random client identifier."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"client_id": uuid.uuid4().hex})


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "username"]


class QueryUsersView(generics.ListAPIView):
    """List users."""
    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return get_user_model().objects.all()


class CurrentUserView(APIView):
    """Return details for the current authenticated user."""
    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(serialize_current_user(request.user, session=request.session))


class RefreshTokenView(APIView):
    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = jwt.encode(
            {"sub": request.user.username, "email": request.user.email},
            settings.SUPABASE_JWT_SECRET,
            algorithm="HS256",
        )
        return Response({"token": token})


class DisconnectedView(APIView):
    """Return whether the current user is marked as disconnected."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def get(self, request):
        val = request.session.get("disconnected", True)
        return Response({"disconnected": bool(val)})


class InitializedView(APIView):
    """Return whether the current user is marked as initialized."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def get(self, request):
        val = request.session.get("initialized", False)
        return Response({"initialized": bool(val)})

