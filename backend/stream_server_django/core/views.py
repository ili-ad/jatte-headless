from stream_server_django.common.auth_utils import get_chat_authentication_classes
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


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


@api_view(["GET"])
def get_user_agent(request):
    """Return the User-Agent string sent by the client."""
    return Response({"user_agent": request.META.get("HTTP_USER_AGENT", "")})


@api_view(["GET"])
def get_tag(request):
    """Return a constant tag value for tests."""
    return Response({"tag": "root"})
