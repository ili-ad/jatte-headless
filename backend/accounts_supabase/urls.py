#accounts/urls.py
from django.urls import path
from .views import SyncUserView, SessionView, ClientIDView, QueryUsersView, UserAgentView, CurrentUserView
from .views import RefreshTokenView

urlpatterns = [
    path('api/sync-user/', SyncUserView.as_view(), name='sync-user'),
    path('api/session/', SessionView.as_view(), name='session'),
    path('api/client-id/', ClientIDView.as_view(), name='client-id'),
    path('api/users/', QueryUsersView.as_view(), name='query-users'),
    path('api/user-agent/', UserAgentView.as_view(), name='user-agent'),
    path('api/user/', CurrentUserView.as_view(), name='user'),
    path('api/refresh-token/', RefreshTokenView.as_view(), name='refresh-token'),
]
