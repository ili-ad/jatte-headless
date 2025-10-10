"""URL routes for the lightweight rooms API."""

from django.urls import path, re_path

from . import views

app_name = "rooms"

urlpatterns = [
    path("rooms/", views.list_rooms, name="list"),
    path("rooms/active/", views.list_active_rooms, name="list-active"),
    path(
        "api/rooms/<path:cid>/members/",
        views.list_room_members_cid,
        name="members-by-cid",
    ),
    re_path(r"^api/rooms/(?P<cid>.+)/members/?$", views.list_room_members_cid),
]
