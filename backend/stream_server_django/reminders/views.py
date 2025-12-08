from __future__ import annotations

from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Reminder
from .serializers import ReminderIn, ReminderOut


def _broadcast_new_reminder(cid: str, payload: dict[str, Any]) -> None:
    try:
        channel_layer = get_channel_layer()
        if not channel_layer or not cid:
            return
        group = f"channel_{cid.replace(':', '_')}"
        async_to_sync(channel_layer.group_send)(
            group,
            {
                "type": "chat.message",
                "payload": {
                    "type": "reminder.new",
                    "cid": cid,
                    "reminder": payload,
                },
            },
        )
    except Exception:
        # Broadcasting is best-effort; failures should not break the API.
        pass


class ReminderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        reminders = Reminder.objects.filter(user=request.user).order_by("remind_at", "id")
        data = ReminderOut(reminders, many=True).data
        return Response(data)

    def post(self, request):
        serializer = ReminderIn(data=request.data, context={"user": request.user})
        serializer.is_valid(raise_exception=True)
        reminder = serializer.save()
        payload = ReminderOut(reminder).data

        cid = serializer.validated_data.get("cid")
        if cid:
            _broadcast_new_reminder(cid, payload)

        return Response({"reminder": payload}, status=status.HTTP_201_CREATED)


class ReminderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, reminder_id: str):
        reminder = get_object_or_404(Reminder, pk=reminder_id, user=request.user)
        reminder.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
