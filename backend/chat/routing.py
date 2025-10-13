from django.urls import re_path

from . import consumers


websocket_urlpatterns = [
    # allow colons in room keys (e.g., "messaging:general")
    re_path(r"^ws/(?P<room_key>[^/]+)/$", consumers.ChatConsumer.as_asgi()),
]
