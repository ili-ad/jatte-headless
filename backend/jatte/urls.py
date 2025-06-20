from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path('', include('accounts_supabase.urls')),
    path('', include('core.urls')),
    path('', include('chat.urls')),
    path('admin/', admin.site.urls),
]

#for dev credentials delete in prod:
urlpatterns += [
    path("api/token/", TokenObtainPairView.as_view(), name="token-obtain"),
]