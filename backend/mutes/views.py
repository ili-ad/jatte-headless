from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import RoomMute, UserMute

from .serializers import (
    MuteActionOut,
    MuteStatusOut,
    MutedChannelOut,
    MutedUserOut,
)


User = get_user_model()


def _canonical_cid(room) -> str:
    uuid = room.uuid
    return uuid if ":" in uuid else f"messaging:{uuid}"


class MuteStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username: str):
        target = get_object_or_404(User, username=username)
        muted = UserMute.objects.filter(user=request.user, target=target).exists()
        serializer = MuteStatusOut({"muted": muted})
        return Response(serializer.data)


class MutedUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mutes = (
            UserMute.objects.filter(user=request.user)
            .select_related("target")
            .order_by("target__username")
        )
        payload = [{"username": mute.target.username} for mute in mutes]
        serializer = MutedUserOut(payload, many=True)
        return Response(serializer.data)


class MutedChannelsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        mutes = (
            RoomMute.objects.filter(user=request.user)
            .select_related("room")
            .order_by("room__uuid")
        )
        payload = [{"cid": _canonical_cid(mute.room)} for mute in mutes]
        serializer = MutedChannelOut(payload, many=True)
        return Response(serializer.data)


class MuteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username: str):
        target = get_object_or_404(User, username=username)
        UserMute.objects.get_or_create(user=request.user, target=target)
        serializer = MuteActionOut({"status": "ok"})
        return Response(serializer.data)


class UnmuteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, username: str):
        target = get_object_or_404(User, username=username)
        UserMute.objects.filter(user=request.user, target=target).delete()
        serializer = MuteActionOut({"status": "ok"})
        return Response(serializer.data)
