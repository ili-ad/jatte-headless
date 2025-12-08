"""URL routes for the drafts REST endpoints."""

from django.urls import path, re_path

from .views import RoomDraftView

app_name = "stream_server_django.drafts"

urlpatterns = [
    path("api/rooms/<str:room_uuid>/draft/", RoomDraftView.as_view(), name="room-draft"),
    re_path(r"^api/rooms/(?P<room_uuid>[^/]+)/draft/?$", RoomDraftView.as_view()),
]
