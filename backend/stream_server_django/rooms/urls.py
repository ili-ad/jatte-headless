"""URL routes for the lightweight rooms API."""

from django.urls import path, re_path

from . import views
from .views_config import RoomConfigStateView

app_name = "stream_server_django.rooms"

urlpatterns = [
    path("rooms/", views.list_rooms, name="list"),
    path("rooms/active/", views.list_active_rooms, name="list-active"),
    path(
        "api/rooms/<path:cid>/members/",
        views.list_room_members_cid,
        name="members-by-cid",
    ),
    re_path(r"^api/rooms/(?P<cid>.+)/members/?$", views.list_room_members_cid),
    path(
        "api/rooms/<str:room_uuid>/config-state/",
        RoomConfigStateView.as_view(),
        name="config-state",
    ),
    re_path(
        r"^api/rooms/(?P<room_uuid>[^/]+)/config-state/?$",
        RoomConfigStateView.as_view(),
    ),
]
