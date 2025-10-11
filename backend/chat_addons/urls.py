from django.urls import include, path

urlpatterns = [
    path("api/chat/admin/", include("backend.chat_addons.admin_console.urls")),
    path("api/chat/agent/", include("backend.chat_addons.agent.urls")),
]
