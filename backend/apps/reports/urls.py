"""
Report URLs for the Sistema de Beneficio
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'reports'

urlpatterns = [
    # Report views
    path('', views.ReportListView.as_view(), name='report-list'),
    path('<int:pk>/', views.ReportDetailView.as_view(), name='report-detail'),
    
    # Report actions
    path('generate/', views.generate_report, name='generate-report'),
    path('stats/', views.report_stats, name='report-stats'),
    path('<int:report_id>/download/', views.download_report, name='download-report'),
    path('<int:report_id>/data/', views.get_report_data, name='report-data'),
]