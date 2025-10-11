from __future__ import annotations

from django.urls import path

from .views import SmsReceiptView, SmsSendView, SmsWebhookView

urlpatterns = [
    path("webhook/", SmsWebhookView.as_view(), name="sms-inbound-webhook"),
    path("send/", SmsSendView.as_view(), name="sms-send"),
    path("receipt/", SmsReceiptView.as_view(), name="sms-delivery-receipt"),
]
