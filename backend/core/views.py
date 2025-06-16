from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def index(request):
    return Response({"message": "Jatte API"})


@api_view(["GET"])
def about(request):
    return Response({"about": "Jatte headless backend"})


@api_view(["GET"])
def get_app_settings(request):
    return Response({"file_uploads": True})


@api_view(["GET"])
def get_user_agent(request):
    """Return the User-Agent string sent by the client."""
    return Response({"user_agent": request.META.get("HTTP_USER_AGENT", "")})
