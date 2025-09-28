"""
URLs for sensors app
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.SensorListCreateView.as_view(), name='sensor-list'),
    path('<int:pk>/', views.SensorDetailView.as_view(), name='sensor-detail'),
    path('status/', views.sensor_status, name='sensor-status'),
    path('data/', views.receive_sensor_data, name='sensor-data'),
    path('latest/', views.get_sensor_data, name='sensor-latest'),
]
