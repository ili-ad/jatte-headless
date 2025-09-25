from django.urls import path, re_path

from accounts_supabase.views import UserAgentView
from .views import AppSettingsView, about, get_tag, index

app_name = "core"


urlpatterns = [
    path("", index, name="index"),
    path("about/", about, name="about"),
    path("api/app-settings/", AppSettingsView.as_view(), name="app-settings"),
    re_path(r"^api/app-settings/?$", AppSettingsView.as_view()),
    path("api/core-user-agent/", UserAgentView.as_view(), name="core-user-agent"),
    re_path(r"^api/core-user-agent/?$", UserAgentView.as_view()),
    path("api/tag/", get_tag, name="tag"),
    re_path(r"^api/tag/?$", get_tag),
]
