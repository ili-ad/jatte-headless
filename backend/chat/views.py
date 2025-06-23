# chat/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
#from accounts_supabase.authentication import SupabaseJWTAuthentication
from accounts_supabase.authentication import SupabaseJWTAuthentication # ← change import
#from accounts_supabase.authentication import SupabaseJWTAuthentication


from rest_framework.response import Response


class TokenView(APIView):
    """Return a signed chat token for the authenticated Supabase user."""
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes     = [IsAuthenticated]          # or AllowAny while debugging

    def get(self, request):
        """Return the current user's ID and their Supabase access token."""
        return Response({
            "userID": request.user.id,
            "userToken": request.auth,
        })
