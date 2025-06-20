from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from jatte.auth.supabase import SupabaseJWTAuthentication
import base64
import json

class TokenView(APIView):
    """Return a Stream Chat dev token for the authenticated user."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = str(request.user.id)
        header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        payload = base64.urlsafe_b64encode(
            json.dumps({"user_id": user_id}).encode()
        ).decode().rstrip("=")
        token = f"{header}.{payload}.devtoken"
        return Response({"userID": user_id, "userToken": token})

