from django.urls import path
from rest_framework.routers import DefaultRouter
from .api_views import RoomListCreateView, RoomDetailView, RoomMessageListCreateView, RoomListAPIView

router = DefaultRouter()
# Router is not used here but left for extensibility

urlpatterns = [
    path("api/rooms/", RoomListCreateView.as_view(), name="room-list"),
    path("api/rooms/<str:uuid>/", RoomDetailView.as_view(), name="room-detail"),
    path(
        "api/rooms/<str:room_uuid>/messages/",
        RoomMessageListCreateView.as_view(),
        name="room-messages",
    ),
]
