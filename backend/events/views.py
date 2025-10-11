"""Views backing the Events & Subscriptions API surface."""

from __future__ import annotations

from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication

from .models import EventNotification, EventSubscription
from .serializers import (
    DispatchEventSerializer,
    EventNotificationSerializer,
    RegisterSubscriptionsSerializer,
)


LISTENERS = ["polls", "threads", "reminders"]


class AuthenticatedAPIView(APIView):
    """Base view applying the common authentication policy."""

    authentication_classes = [DevTokenOrJWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


class RegisterSubscriptionsView(AuthenticatedAPIView):
    """Persist subscription state for the current user."""

    def post(self, request):
        serializer = RegisterSubscriptionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscriptions = serializer.validated_data["subscriptions"]

        with transaction.atomic():
            EventSubscription.objects.update_or_create(
                user=request.user,
                defaults={"subscriptions": subscriptions},
            )

        return Response({"subscriptions": subscriptions}, status=status.HTTP_200_OK)


class ListenersView(AuthenticatedAPIView):
    """Return the set of event listeners the server has activated."""

    def get(self, request):
        return Response({"listeners": LISTENERS})


class DispatchEventView(AuthenticatedAPIView):
    """Store an incoming event and echo it back to the caller."""

    def post(self, request):
        serializer = DispatchEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.validated_data["event"]
        payload = event.get("payload", {}) or {}
        cid = payload.get("cid") or ""

        EventNotification.objects.create(
            user=request.user,
            event_type=event["type"],
            payload=payload,
            cid=cid,
        )

        return Response({"event": event}, status=status.HTTP_200_OK)


class NotificationListView(AuthenticatedAPIView):
    """Return the notification feed for the current user."""

    def get(self, request):
        cid = request.query_params.get("cid")
        notifications = EventNotification.objects.filter(user=request.user)
        if cid:
            notifications = notifications.filter(cid=cid)
        notifications = notifications.order_by("-created_at", "-id")

        serializer = EventNotificationSerializer(notifications, many=True)
        return Response(serializer.data)
