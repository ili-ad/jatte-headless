# backend/accounts_supabase/views.py
from typing import Any, Mapping

import logging
import uuid

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import generics, serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import SupabaseJWTAuthentication
from accounts_supabase.models import UserProfile


logger = logging.getLogger(__name__)

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


class CurrentUserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(
        source="profile.display_name", allow_null=True, required=False
    )
    image_url = serializers.CharField(
        source="profile.image_url", allow_null=True, required=False
    )
    extra = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "display_name", "image_url", "extra"]

    def get_extra(self, obj):
        profile = getattr(obj, "profile", None)
        if not profile:
            return {}
        extra = getattr(profile, "extra", {})
        if isinstance(extra, Mapping):
            return extra
        return {}


def serialize_current_user(user):
    data = CurrentUserSerializer(user).data
    profile = getattr(user, "profile", None)
    if profile:
        data["display_name"] = profile.display_name or None
        data["image_url"] = profile.image_url or None
        extra = getattr(profile, "extra", {})
        if isinstance(extra, Mapping):
            data["extra"] = extra
        else:
            data["extra"] = {}
    else:
        data.setdefault("display_name", None)
        data.setdefault("image_url", None)
        data.setdefault("extra", {})
    return data


class SyncUserView(APIView):
    # explicitly setting here again as sanity check
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)

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

        update_fields = []
        if "display_name" in validated:
            profile.display_name = validated["display_name"] or ""
            update_fields.append("display_name")
        if "image_url" in validated:
            profile.image_url = validated["image_url"] or ""
            update_fields.append("image_url")
        if "extra" in validated:
            profile.extra = validated["extra"]
            update_fields.append("extra")

        if update_fields:
            profile.save(update_fields=update_fields)

        request.session['disconnected'] = False
        request.session['initialized'] = True

        user.refresh_from_db()

        payload = serialize_current_user(user)
        return Response(payload, status=status.HTTP_201_CREATED)


class SessionView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.session['disconnected'] = True
        request.session['initialized'] = False
        return Response(status=204)


class ClientIDView(APIView):
    """Return a random client identifier."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"client_id": uuid.uuid4().hex})


class UserAgentSerializer(serializers.Serializer):
    user_agent = serializers.CharField(required=False, allow_blank=True)


class UserAgentView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserAgentSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        user_agent = serializer.validated_data.get(
            "user_agent",
            request.META.get("HTTP_USER_AGENT", ""),
        )
        if user_agent is None:
            user_agent = request.META.get("HTTP_USER_AGENT", "")

        request.session['user_agent'] = user_agent
        return Response({"user_agent": user_agent}, status=status.HTTP_201_CREATED)

    def get(self, request):
        user_agent = request.session.get("user_agent")
        if user_agent is None:
            user_agent = request.META.get("HTTP_USER_AGENT", "")

        request_id = getattr(request, "request_id", None) or request.headers.get(
            "X-Request-ID"
        ) or request.META.get("HTTP_X_REQUEST_ID")
        user_id = getattr(getattr(request, "user", None), "id", None)
        logger.info(
            "user-agent.get request_id=%s user_id=%s",
            request_id,
            user_id,
        )
        return Response({"user_agent": user_agent})


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "username"]


class QueryUsersView(generics.ListAPIView):
    """List users."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        return get_user_model().objects.all()


class CurrentUserView(APIView):
    """Return details for the current authenticated user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(serialize_current_user(request.user))


class RefreshTokenView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
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

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        val = request.session.get("disconnected", True)
        return Response({"disconnected": bool(val)})


class InitializedView(APIView):
    """Return whether the current user is marked as initialized."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        val = request.session.get("initialized", False)
        return Response({"initialized": bool(val)})


#---
# # accounts/views.py
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from accounts.authentication import SupabaseJWTAuthentication
# from accounts.models import UserProfile
# from rest_framework import serializers

# class UserProfileSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = UserProfile
#         fields = ['return_address', 'license_number', 'signature_image']

# class SyncUserView(APIView):
#     authentication_classes = [SupabaseJWTAuthentication]  
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         user = request.user
#         profile, created = UserProfile.objects.get_or_create(user=user)

#         serializer = UserProfileSerializer(profile, data=request.data, partial=True)
#         if serializer.is_valid():
#             serializer.save()
#             return Response({"status": "ok", "updated_fields": serializer.validated_data})
#         else:
#             return Response({"status": "error", "errors": serializer.errors}, status=400)
