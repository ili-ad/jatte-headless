#accounts/urls.py
from django.urls import path
from .views import SyncUserView, DisconnectUserView

urlpatterns = [
    path('api/sync-user/', SyncUserView.as_view(), name='sync-user'),
    path('api/disconnect-user/', DisconnectUserView.as_view(), name='disconnect-user'),
]
