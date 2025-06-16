#accounts/urls.py
from django.urls import path
from .views import SyncUserView, SessionView, QueryUsersView, UserAgentView

urlpatterns = [
    path('api/sync-user/', SyncUserView.as_view(), name='sync-user'),
    path('api/session/', SessionView.as_view(), name='session'),
    path('api/users/', QueryUsersView.as_view(), name='query-users'),
    path('api/user-agent/', UserAgentView.as_view(), name='user-agent'),
]
