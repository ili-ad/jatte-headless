import os

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from accounts.middleware import SupabaseJWTAuthMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jatte.settings')

from chat import routing

django_asgi_application = get_asgi_application()

application = ProtocolTypeRouter(
    {
        'http': django_asgi_application,
        'websocket': AllowedHostsOriginValidator(
            SupabaseJWTAuthMiddleware(
                URLRouter(routing.websocket_urlpatterns)
            )
        )
    }
)
