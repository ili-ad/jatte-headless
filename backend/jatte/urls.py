# backend/jatte/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from chat.views import TokenView          # <- your real view
# from chat.views import dev_token        # <- if you still need the dev stub

urlpatterns = [
    path('', include('accounts_supabase.urls')),
    path('', include('core.urls')),
    path('admin/', admin.site.urls),

    # canonical + alias (avoids 301 loop from the SPA)
    path('api/token/', TokenView.as_view(), name='token'),
    re_path(r'^api/token$', TokenView.as_view()),
]

# If you want the DEV stub only in DEBUG:
"""
from django.conf import settings
if settings.DEBUG:
    urlpatterns.append(
        re_path(r'^api/token/?$', dev_token, name='token-obtain-dev')
    )
"""
