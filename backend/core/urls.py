from django.urls import path

from . import views

app_name = 'core'


urlpatterns = [
    path('', views.index, name='index'),
    path('about/', views.about, name='about'),
    path('api/app-settings/', views.get_app_settings, name='app-settings'),
]
