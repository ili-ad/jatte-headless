from django.urls import path

from . import consumers


websocket_urlpatterns = [
    path("ws/<str:room_uuid>/", consumers.ChatConsumer.as_asgi()),
]