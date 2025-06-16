#accounts/urls.py
from django.urls import path
from .views import SyncUserView, SessionView

urlpatterns = [
    path('api/sync-user/', SyncUserView.as_view(), name='sync-user'),
    path('api/session/', SessionView.as_view(), name='session'),
]
