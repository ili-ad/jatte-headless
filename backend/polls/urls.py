from django.urls import path

from .views import (
    PollAnswerCreateView,
    PollListCreateView,
    PollOptionCreateView,
    PollVoteView,
)

app_name = "polls"

urlpatterns = [
    path("polls/", PollListCreateView.as_view(), name="poll-list"),
    path(
        "polls/<uuid:poll_id>/options/",
        PollOptionCreateView.as_view(),
        name="poll-option-create",
    ),
    path(
        "polls/<uuid:poll_id>/options/<uuid:option_id>/votes/",
        PollVoteView.as_view(),
        name="poll-vote",
    ),
    path(
        "polls/<uuid:poll_id>/answers/",
        PollAnswerCreateView.as_view(),
        name="poll-answer-create",
    ),
]
