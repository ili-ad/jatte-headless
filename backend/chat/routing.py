from django.urls import path

from . import consumers


websocket_urlpatterns = [
    path("ws/<str:channel_uuid>/", consumers.ChatConsumer.as_asgi()),
]