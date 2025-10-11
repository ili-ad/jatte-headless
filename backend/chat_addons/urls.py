from django.urls import include, path

urlpatterns = [
    path("api/chat/agent/", include("backend.chat_addons.agent.urls")),
    path("chat/admin/", include("backend.chat_addons.admin_console.urls")),
    path("chat/notifications/", include("backend.chat_addons.notifications.urls")),
    path("chat/integrations/sms/", include("backend.chat_addons.sms_bridge.urls")),
]
