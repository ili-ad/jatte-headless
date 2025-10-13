from django.urls import include, path

urlpatterns = [
    path("chat/agent/", include("chat_addons.agent.urls")),
    path("chat/admin/", include("chat_addons.admin_console.urls")),
    path("chat/notifications/", include("chat_addons.notifications.urls")),
    path("chat/integrations/sms/", include("chat_addons.sms_bridge.urls")),
]
