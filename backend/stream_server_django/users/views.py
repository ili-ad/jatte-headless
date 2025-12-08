"""Users directory endpoints exposed to the shim."""

from django.contrib.auth import get_user_model
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.accounts_supabase.authentication import SupabaseJWTAuthentication


class UsersDirectoryView(APIView):
    """Return the list of users with the minimal shape required."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        UserModel = get_user_model()
        users = (
            UserModel.objects.all()
            .order_by("id")
            .values("id", "username")
        )
        return Response(list(users))


class CurrentUserView(APIView):
    """Return the authenticated user with the minimal payload."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({"id": user.id, "username": user.username})
