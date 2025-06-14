from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from accounts.authentication import SupabaseJWTAuthentication
from .models import Room, Message
from .serializers import RoomSerializer, MessageSerializer


class RoomListCreateView(generics.ListCreateAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "uuid"


class RoomMessageListCreateView(APIView):
    authentication_classes = [SupabaseJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        serializer = MessageSerializer(room.messages.all(), many=True)
        return Response(serializer.data)

    def post(self, request, room_uuid):
        room = get_object_or_404(Room, uuid=room_uuid)
        serializer = MessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.save(created_by=request.user)
        room.messages.add(message)
        return Response(MessageSerializer(message).data, status=201)
