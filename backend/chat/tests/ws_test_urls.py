from django.urls import include, path

urlpatterns = [
    path("", include("jatte.urls")),
    path("", include("chat.urls")),
]
