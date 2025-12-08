#accounts/urls.py
from django.urls import re_path
from .views import SyncUserView

urlpatterns = [
    re_path(r'^api/sync-user/?$', SyncUserView.as_view(), name='sync-user'),
]
