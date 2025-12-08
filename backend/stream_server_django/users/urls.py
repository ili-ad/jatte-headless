"""URL configuration for user directory endpoints."""

from django.urls import path, re_path

from .views import CurrentUserView, UsersDirectoryView

app_name = "stream_server_django.users"

urlpatterns = [
    path("users/", UsersDirectoryView.as_view(), name="list-users"),
    re_path(r"^users/?$", UsersDirectoryView.as_view()),
    path("user/", CurrentUserView.as_view(), name="current-user"),
    re_path(r"^user/?$", CurrentUserView.as_view()),
]
