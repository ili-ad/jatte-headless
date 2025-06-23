# chat/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
#from accounts_supabase.authentication import SupabaseJWTAuthentication
from accounts_supabase.authentication import SupabaseJWTAuthentication # ← change import
#from accounts_supabase.authentication import SupabaseJWTAuthentication


from rest_framework.response import Response
from django.conf import settings
import jwt


class TokenView(APIView):
    """Return a signed chat token for the authenticated Supabase user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes     = [IsAuthenticated]          # or AllowAny while debugging

    def get(self, request):
        uid = request.user.id
        token = jwt.encode({"user_id": uid}, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
        return Response({"userID": uid, "userToken": token})
