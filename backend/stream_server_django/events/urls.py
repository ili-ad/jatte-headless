"""URL configuration for the events domain."""

from django.urls import path

from .views import (
    DispatchEventView,
    ListenersView,
    NotificationListView,
    RegisterSubscriptionsView,
)

app_name = "stream_server_django.events"

urlpatterns = [
    path("register-subscriptions/", RegisterSubscriptionsView.as_view(), name="register-subscriptions"),
    path("listeners/", ListenersView.as_view(), name="listeners"),
    path("dispatch-event/", DispatchEventView.as_view(), name="dispatch-event"),
    path("notifications/", NotificationListView.as_view(), name="notifications"),
]
