from django.urls import path

from .views import IntakeSummaryView


urlpatterns = [
    path("intake/", IntakeSummaryView.as_view(), name="intake-summary"),
]
