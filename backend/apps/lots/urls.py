from django.urls import path
from . import views

urlpatterns = [
    path('', views.LotListCreateView.as_view(), name='lot-list'),
    path('<int:pk>/', views.LotDetailView.as_view(), name='lot-detail'),
]
