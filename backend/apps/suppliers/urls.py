from django.urls import path
from . import views

urlpatterns = [
    path('', views.SupplierListCreateView.as_view(), name='supplier-list'),
    path('<int:pk>/', views.SupplierDetailView.as_view(), name='supplier-detail'),
]

