from django.urls import include, path

urlpatterns = [
    path("api/chat/admin/", include("backend.chat_addons.admin_console.urls")),
]
