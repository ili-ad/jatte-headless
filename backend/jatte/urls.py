from django.contrib import admin
from django.urls import path, include
from chat.views import TokenView

urlpatterns = [
    path('', include('accounts_supabase.urls')),
    path('', include('core.urls')),
    path('admin/', admin.site.urls),
]

#for dev credentials delete in prod:
urlpatterns += [
    path("api/token/", TokenView.as_view(), name="token-obtain"),
]

