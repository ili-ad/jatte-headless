from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable, List

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts_supabase.authentication import DevTokenOrJWTAuthentication

from backend.chat_addons.admin_console.models import MessageIntake

from .models import AdminPresence, EscalationRecord, OnCallConfig
from .serializers import EscalationRequestSerializer, OnCallConfigSerializer
from .services.notify import NotificationService, SmsProviderError

ACTIVE_WINDOW_SEC = getattr(settings, "ACTIVE_WINDOW_SEC", 120)
ESCALATION_COOLDOWN_SEC = getattr(settings, "ESCALATION_COOLDOWN_SEC", 300)


class NotificationsBaseView(APIView):
    authentication_classes: List[type[BaseAuthentication]] = [DevTokenOrJWTAuthentication]
    permission_classes = [IsAuthenticated]


class IntakeSummaryView(NotificationsBaseView):
    def get(self, request: Request) -> Response:
        pending = MessageIntake.objects.filter(status=MessageIntake.STATUS_PENDING).count()
        rejected = MessageIntake.objects.filter(status=MessageIntake.STATUS_REJECTED).count()
        return Response({"intake": {"pending": pending, "rejected": rejected}})


class OnCallConfigView(NotificationsBaseView):
    def get(self, request: Request) -> Response:
        config = OnCallConfig.objects.order_by("-updated_at", "id").first()
        payload = config.as_payload() if config else {"phone_e164": None, "email": None}
        return Response(payload)

    def put(self, request: Request) -> Response:
        serializer = OnCallConfigSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data.get("phone_e164") or ""
        email = serializer.validated_data.get("email") or ""

        config = OnCallConfig.objects.order_by("-updated_at", "id").first()
        if not config:
            config = OnCallConfig.objects.create(
                phone_e164=phone,
                email=email,
                updated_by=request.user,
            )
        else:
            config.phone_e164 = phone
            config.email = email
            config.updated_by = request.user
            config.save(update_fields=["phone_e164", "email", "updated_by", "updated_at"])
        return Response(config.as_payload())


class AdminHeartbeatView(NotificationsBaseView):
    def post(self, request: Request) -> Response:
        presence, _ = AdminPresence.objects.get_or_create(user=request.user)
        presence.touch()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _active_admin_exists(now: datetime) -> bool:
    cutoff = now - timedelta(seconds=ACTIVE_WINDOW_SEC)
    return AdminPresence.objects.filter(last_seen_at__gte=cutoff).exists()


def _notification_recipients(request_user) -> Iterable[settings.AUTH_USER_MODEL]:
    UserModel = get_user_model()
    staff = list(
        UserModel.objects.filter(
            models.Q(is_staff=True) | models.Q(is_superuser=True)
        ).distinct()
    )
    if request_user.is_authenticated and request_user not in staff:
        staff.append(request_user)
    return staff


class EscalateRoomView(NotificationsBaseView):
    service_class = NotificationService

    def post(self, request: Request) -> Response:
        serializer = EscalationRequestSerializer(data=request.data or {})
        serializer.is_valid(raise_exception=True)
        cid = serializer.validated_data["cid"]
        reason = serializer.validated_data["reason"]
        now = timezone.now()

        cooldown_cutoff = now - timedelta(seconds=ESCALATION_COOLDOWN_SEC)
        recent = (
            EscalationRecord.objects.filter(cid=cid, created_at__gte=cooldown_cutoff)
            .order_by("-created_at", "-id")
            .first()
        )
        if recent:
            notified_flag = bool(recent.notification_id) or recent.delivered_via != EscalationRecord.DELIVERED_NONE
            return Response({"cid": cid, "notified": notified_flag, "via": recent.delivered_via})

        config = OnCallConfig.objects.order_by("-updated_at", "id").first()
        phone = (config.phone_e164.strip() if config and config.phone_e164 else None)
        email = (config.email.strip() if config and config.email else None)
        service = self.service_class()

        note_text = f"[Escalation] {cid} – {reason}"
        recipients = _notification_recipients(request.user)
        notifications = service.create_notification_item(text=note_text, users=recipients)
        notification = notifications[0] if notifications else None

        via = EscalationRecord.DELIVERED_NONE
        delivered_at = None
        notified = bool(notifications)

        if not _active_admin_exists(now):
            via, delivered_at, notified = self._dispatch_out_of_band(
                service, cid, reason, phone, email, now
            )

        record = EscalationRecord.objects.create(
            cid=cid,
            reason=reason,
            created_by=request.user if request.user.is_authenticated else None,
            delivered_via=via,
            delivered_at=delivered_at,
            notification=notification,
        )

        return Response({"cid": cid, "notified": notified, "via": record.delivered_via})

    def _dispatch_out_of_band(
        self,
        service: NotificationService,
        cid: str,
        reason: str,
        phone: str | None,
        email: str | None,
        now: datetime,
    ) -> tuple[str, datetime | None, bool]:
        message = f"Room {cid} escalated: {reason}"
        if phone:
            try:
                service.send_sms(phone, message)
                return EscalationRecord.DELIVERED_SMS, now, True
            except SmsProviderError:
                if email:
                    try:
                        service.send_email(email, f"Escalation for {cid}", message)
                        return EscalationRecord.DELIVERED_EMAIL, now, True
                    except Exception:
                        return EscalationRecord.DELIVERED_NONE, None, False
                return EscalationRecord.DELIVERED_NONE, None, False
        if email:
            try:
                service.send_email(email, f"Escalation for {cid}", message)
                return EscalationRecord.DELIVERED_EMAIL, now, True
            except Exception:
                return EscalationRecord.DELIVERED_NONE, None, False
        return EscalationRecord.DELIVERED_NONE, None, False
