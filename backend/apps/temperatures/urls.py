"""
URLs for temperatures app
"""

from django.urls import path
from . import views

urlpatterns = [
    path('readings/', views.ReadingListCreateView.as_view(), name='reading-list'),
    path('readings/<int:pk>/', views.ReadingDetailView.as_view(), name='reading-detail'),
    path('readings/batch/', views.create_batch_readings, name='reading-batch'),
    path('latest/', views.latest_readings, name='latest-readings'),
    path('summary/', views.temperature_summary, name='temperature-summary'),
    path('history/', views.temperature_history, name='temperature-history'),
]
