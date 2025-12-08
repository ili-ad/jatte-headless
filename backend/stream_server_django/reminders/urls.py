from django.urls import path, re_path

from .views import ReminderDetailView, ReminderListCreateView

app_name = "stream_server_django.reminders"

urlpatterns = [
    path("reminders/", ReminderListCreateView.as_view(), name="reminder-list"),
    re_path(r"^reminders/?$", ReminderListCreateView.as_view()),
    path(
        "reminders/<uuid:reminder_id>/",
        ReminderDetailView.as_view(),
        name="reminder-detail",
    ),
    re_path(
        r"^reminders/(?P<reminder_id>[0-9a-fA-F-]+)/?$",
        ReminderDetailView.as_view(),
    ),
]
