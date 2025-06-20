# backend/jatte/asgi.py
import os
import django

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack

# 1️⃣  Configure settings **first**
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "jatte.settings")

# 2️⃣  Initialise Django so apps/models are ready
django.setup()

# 3️⃣  Now it’s safe to import anything that touches auth/models
from chat import routing

django_asgi_application = get_asgi_application()

# backend/jatte/asgi.py (dev only)

application = ProtocolTypeRouter(
    {
        "http": django_asgi_application,
        "websocket": AuthMiddlewareStack(           # 👈 add this wrapper
            URLRouter(routing.websocket_urlpatterns)
        ),
    }
)

