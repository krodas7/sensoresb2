"""
URLs for areas app
"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.AreaListCreateView.as_view(), name='area-list'),
    path('<int:pk>/', views.AreaDetailView.as_view(), name='area-detail'),
]
