# backend/jatte/asgi.py
import os
import django

from django.conf import settings
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import OriginValidator
from django.core.asgi import get_asgi_application

# 1️⃣  Configure settings **first**
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

# 2️⃣  Initialise Django so apps/models are ready
django.setup()

# 3️⃣  Now it’s safe to import anything that touches auth/models
from stream_server_django.chat.routing import websocket_urlpatterns

django_asgi_app = get_asgi_application()

allowed_ws_origins = [
    *settings.DJANGO_WS_ALLOWED_ORIGINS,
]

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": OriginValidator(
            AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
            allowed_ws_origins,
        ),
    }
)
