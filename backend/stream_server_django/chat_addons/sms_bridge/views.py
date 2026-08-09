from __future__ import annotations

import logging
import uuid

from django.db import IntegrityError, transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import APIException, NotFound
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from stream_server_django.accounts_supabase.authentication import DevTokenOrJWTAuthentication
from stream_server_django.chat.broadcast import _broadcast_to_cid
from stream_server_django.chat.models import Message
from stream_server_django.chat.serializers import MessageSerializer
from stream_server_django.chat.consumers import broadcast_message_update
from stream_server_django.chat_addons.permissions import IsStaffOrService
from stream_server_django.chat_addons.service_auth import (
    InternalServiceAuthentication,
    is_internal_service_request,
)

from ..common_audit.decorators import audit_action
from ..common_audit.models import AuditTrail
from ..common_audit.throttling import SmsSendRateThrottle
from .models import SmsRelay
from .auth import (
    SmsWebhookReplay,
    verify_sms_provider_signature,
)
from .serializers import SmsReceiptSerializer, SmsSendSerializer, SmsWebhookSerializer
from .services.autoreply import maybe_enqueue_sms_autoreply
from .services.consent import (
    mark_opt_in,
    mark_opt_out,
    parse_control_word,
    start_confirmation_text,
    stop_confirmation_text,
)
from .services.linking import (
    ensure_link,
    get_or_create_phone_user,
    record_inbound_message,
    record_outbound_message,
)
from .services.provider import SmsProviderClient, SmsProviderError

logger = logging.getLogger(__name__)


class SmsProviderUnavailable(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_detail = "SMS provider error"


class SmsWebhookView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = []
    permission_classes: list = []

    def post(self, request: Request) -> Response:
        verify_sms_provider_signature(request)

        inbound_data = request.data or {}
        serializer = SmsWebhookSerializer(
            data={
                "from_phone": inbound_data.get("from"),
                "to_phone": inbound_data.get("to"),
                "text": inbound_data.get("text"),
                "external_id": inbound_data.get("external_id"),
                "event": inbound_data.get("event"),
            }
        )
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        external_id = payload["external_id"]
        from_phone = payload["from_phone"]
        text = payload["text"]

        try:
            with transaction.atomic():
                if SmsRelay.objects.filter(
                    direction=SmsRelay.DIRECTION_INBOUND,
                    external_id=external_id,
                ).exists():
                    raise SmsWebhookReplay()

                user = get_or_create_phone_user(from_phone)
                sender_identifier = (
                    getattr(user, "supabase_uid", None) or user.username
                )
                link = ensure_link(
                    phone_e164=from_phone,
                    client_identifier=sender_identifier,
                )
                message = record_inbound_message(
                    cid=link.cid,
                    text=text,
                    sender_identifier=sender_identifier,
                    relay_external_id=external_id,
                )
        except IntegrityError as exc:
            raise SmsWebhookReplay() from exc

        control_word = parse_control_word(text)
        room = message.rooms.order_by("pk").first()
        if room and control_word not in {"stop", "start"}:
            maybe_enqueue_sms_autoreply(
                room=room,
                triggering_message=message,
                sender_e164=from_phone,
            )

        serialized = MessageSerializer(message).data
        _broadcast_to_cid(
            link.cid,
            {"type": "message.new", "cid": link.cid, "message": serialized},
        )

        if control_word == "stop":
            mark_opt_out(from_phone)
            confirmation_text = stop_confirmation_text()
            client = SmsProviderClient()
            try:
                provider_response = client.send(from_phone, confirmation_text)
            except SmsProviderError:
                logger.exception(
                    "sms.consent.send_failed",
                    extra={"event": "stop", "cid": link.cid, "sender_e164": from_phone},
                )
            else:
                confirmation = record_outbound_message(
                    cid=link.cid,
                    text=confirmation_text,
                    sender_identifier="sms_system",
                    relay_external_id=provider_response.external_id,
                    custom_data={"source": "sms_system", "sms_consent_event": "stop"},
                )
                serialized_confirmation = MessageSerializer(confirmation).data
                _broadcast_to_cid(
                    link.cid,
                    {
                        "type": "message.new",
                        "cid": link.cid,
                        "message": serialized_confirmation,
                    },
                )
            return Response({"ok": True, "handled": "stop"})

        if control_word == "start":
            mark_opt_in(from_phone)
            confirmation_text = start_confirmation_text()
            client = SmsProviderClient()
            try:
                provider_response = client.send(from_phone, confirmation_text)
            except SmsProviderError:
                logger.exception(
                    "sms.consent.send_failed",
                    extra={"event": "start", "cid": link.cid, "sender_e164": from_phone},
                )
            else:
                confirmation = record_outbound_message(
                    cid=link.cid,
                    text=confirmation_text,
                    sender_identifier="sms_system",
                    relay_external_id=provider_response.external_id,
                    custom_data={"source": "sms_system", "sms_consent_event": "start"},
                )
                serialized_confirmation = MessageSerializer(confirmation).data
                _broadcast_to_cid(
                    link.cid,
                    {
                        "type": "message.new",
                        "cid": link.cid,
                        "message": serialized_confirmation,
                    },
                )
            return Response({"ok": True, "handled": "start"})

        return Response({"ok": True}, status=status.HTTP_200_OK)


class SmsSendView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        InternalServiceAuthentication,
        DevTokenOrJWTAuthentication,
    ]
    permission_classes = [IsStaffOrService]
    throttle_classes = [SmsSendRateThrottle]

    @audit_action(action=AuditTrail.Action.SMS_SEND)
    def post(self, request: Request) -> Response:
        serializer = SmsSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        to_phone = payload["to"]
        text = payload["text"]

        link = ensure_link(phone_e164=to_phone, cid=payload["cid"])
        canonical = link.cid
        sender_identifier = (
            getattr(request.user, "supabase_uid", None)
            or getattr(request.user, "username", None)
            or str(request.user.pk)
        )

        request._audit_context = {"cid": canonical}

        client = SmsProviderClient()
        try:
            provider_response = client.send(to_phone, text)
        except SmsProviderError as exc:  # pragma: no cover - exercised via APIException path
            raise SmsProviderUnavailable(str(exc))

        message = record_outbound_message(
            cid=canonical,
            text=text,
            sender_identifier=sender_identifier,
            relay_external_id=provider_response.external_id,
        )

        serialized = MessageSerializer(message).data
        _broadcast_to_cid(
            canonical,
            {"type": "message.new", "cid": canonical, "message": serialized},
        )

        run_id = str(uuid.uuid4())
        request._audit_context = {
            "cid": canonical,
            "target_id": provider_response.external_id,
            "meta": {"run_id": run_id},
        }
        return Response(
            {"run_id": run_id, "status": "queued"},
            status=status.HTTP_202_ACCEPTED,
        )


class SmsReceiptView(APIView):
    authentication_classes: list[type[BaseAuthentication]] = [
        InternalServiceAuthentication
    ]
    permission_classes: list = []

    def post(self, request: Request) -> Response:
        if not is_internal_service_request(request):
            verify_sms_provider_signature(request)

        serializer = SmsReceiptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        message: Message | None = None
        with transaction.atomic():
            try:
                relay = SmsRelay.objects.select_for_update().get(
                    direction=SmsRelay.DIRECTION_OUTBOUND,
                    external_id=payload["external_id"],
                )
            except SmsRelay.DoesNotExist as exc:
                raise NotFound("Relay not found") from exc

            if relay.status != SmsRelay.STATUS_PENDING:
                raise SmsWebhookReplay()

            relay.status = payload["status"]
            relay.save(update_fields=["status"])

            if relay.message_id:
                message = Message.objects.filter(id=relay.message_id).first()
                if message:
                    custom_data = dict(message.custom_data or {})
                    custom_data["delivery_status"] = payload["status"]
                    error_code = payload.get("error_code")
                    if error_code:
                        custom_data["delivery_error_code"] = error_code
                    else:
                        custom_data.pop("delivery_error_code", None)
                    message.custom_data = custom_data
                    message.updated_at = timezone.now()
                    message.save(update_fields=["custom_data", "updated_at"])

        if message:
            broadcast_message_update(message)

        if not message:
            custom_data = {"delivery_status": payload["status"]}
            error_code = payload.get("error_code")
            if error_code:
                custom_data["delivery_error_code"] = error_code
            _broadcast_to_cid(
                relay.cid,
                {
                    "type": "message.updated",
                    "cid": relay.cid,
                    "message": {"id": relay.message_id, "custom_data": custom_data},
                },
            )

        return Response({"ok": True}, status=status.HTTP_200_OK)
