from django.urls import path, re_path

from . import views

app_name = "core"


urlpatterns = [
    path("", views.index, name="index"),
    path("about/", views.about, name="about"),
    path("api/app-settings/", views.get_app_settings, name="app-settings"),
    re_path(r"^api/app-settings/?$", views.get_app_settings),
    path("api/core-user-agent/", views.get_user_agent, name="user-agent"),
    re_path(r"^api/core-user-agent/?$", views.get_user_agent),
    path("api/tag/", views.get_tag, name="tag"),
    re_path(r"^api/tag/?$", views.get_tag),
]
