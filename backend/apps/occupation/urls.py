"""
URLs for occupation app
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.OccupationListCreateView.as_view(), name='occupation-list'),
    path('<int:pk>/', views.OccupationDetailView.as_view(), name='occupation-detail'),
    path('summary/', views.occupation_summary, name='occupation-summary'),
    path('force/', views.force_occupation, name='force-occupation'),
]
