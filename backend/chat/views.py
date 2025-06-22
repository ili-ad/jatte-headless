# chat/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
#from accounts_supabase.authentication import SupabaseJWTAuthentication
from accounts_supabase.authentication import SupabaseJWTAuthentication # ← change import
#from accounts_supabase.authentication import SupabaseJWTAuthentication


from rest_framework.response import Response
import base64, json


class TokenView(APIView):
    """Return a Stream Chat dev token for the authenticated Supabase user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes     = [IsAuthenticated]          # or AllowAny while debugging

    def get(self, request):
        uid = request.user.id
        header   = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        payload  = base64.urlsafe_b64encode(
                     json.dumps({"user_id": uid}).encode()
                   ).decode().rstrip("=")
        devtoken = f"{header}.{payload}.devtoken"
        return Response({"userID": uid, "userToken": devtoken})
