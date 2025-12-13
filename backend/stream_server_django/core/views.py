import logging

from stream_server_django.common.auth_utils import get_chat_authentication_classes
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


logger = logging.getLogger(__name__)


@api_view(["GET"])
def index(request):
    return Response({"message": "Jatte API"})


@api_view(["GET"])
def about(request):
    return Response({"about": "Jatte headless backend"})


class AppSettingsView(APIView):
    """Return application-wide settings for the authenticated user."""

    authentication_classes = get_chat_authentication_classes()
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"file_uploads": True})


class UserAgentSerializer(serializers.Serializer):
    user_agent = serializers.CharField(required=False, allow_blank=True)


class UserAgentView(APIView):
    authentication_classes = get_chat_authentication_classes()
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


@api_view(["GET"])
def get_user_agent(request):
    """Return the User-Agent string sent by the client."""
    return Response({"user_agent": request.META.get("HTTP_USER_AGENT", "")})


@api_view(["GET"])
def get_tag(request):
    """Return a constant tag value for tests."""
    return Response({"tag": "root"})
