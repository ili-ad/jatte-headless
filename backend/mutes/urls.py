from django.urls import path

from .views import (
    MuteStatusView,
    MuteUserView,
    MutedChannelsView,
    MutedUsersView,
    UnmuteUserView,
)

app_name = "mutes"

urlpatterns = [
    path("mute-status/<str:username>/", MuteStatusView.as_view(), name="mute-status"),
    path("muted-users/", MutedUsersView.as_view(), name="muted-users"),
    path("muted-channels/", MutedChannelsView.as_view(), name="muted-channels"),
    path("mute/<str:username>/", MuteUserView.as_view(), name="mute-user"),
    path("unmute/<str:username>/", UnmuteUserView.as_view(), name="unmute-user"),
]
