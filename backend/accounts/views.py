# accounts/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts_supabase.authentication import SupabaseJWTAuthentication
from accounts.models import UserProfile

class SyncUserView(APIView):
    # explicitly setting here again as sanity check
    authentication_classes = [SupabaseJWTAuthentication]  
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        UserProfile.objects.get_or_create(user=user)
        return Response({"status": "ok"})


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
