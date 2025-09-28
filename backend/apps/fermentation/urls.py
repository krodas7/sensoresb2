from django.urls import path
from . import views

urlpatterns = [
    path('', views.FermentationListCreateView.as_view(), name='fermentation-list'),
    path('<int:pk>/', views.FermentationDetailView.as_view(), name='fermentation-detail'),
    path('measurements/', views.FermentationMeasurementListCreateView.as_view(), name='fermentation-measurement-list'),
]
