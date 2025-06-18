# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, serializers
from django.contrib.auth import get_user_model
from accounts.authentication import SupabaseJWTAuthentication
from accounts_supabase.models import UserProfile
from django.utils import timezone
from django.conf import settings
import jwt
import uuid

class SyncUserView(APIView):
    # explicitly setting here again as sanity check
    authentication_classes = [SupabaseJWTAuthentication]  
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        UserProfile.objects.get_or_create(user=user)
        request.session['disconnected'] = False
        request.session['initialized'] = True
        return Response({"id": user.id, "username": user.username})


class SessionView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        # Log timestamp for debugging stale tokens
        print(f"disconnect at {timezone.now()} for {request.user}")
        request.session['disconnected'] = True
        request.session['initialized'] = False
        return Response(status=204)


class ClientIDView(APIView):
    """Return a random client identifier."""

    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"client_id": uuid.uuid4().hex})


class UserAgentView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.session['user_agent'] = request.data.get('user_agent', '')
        return Response({"status": "ok"})

    def get(self, request):
        ua = request.session.get('user_agent')
        return Response({"user_agent": ua})


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ["id", "username"]


class QueryUsersView(generics.ListAPIView):
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
        user = request.user
        return Response({"id": user.id, "username": user.username})


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
