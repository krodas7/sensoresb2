from django.urls import path
from . import views

urlpatterns = [
    # Material Requests
    path('material-requests/', views.MaterialRequestListCreateView.as_view(), name='material-request-list'),
    path('material-requests/<int:pk>/', views.MaterialRequestDetailView.as_view(), name='material-request-detail'),
    
    # Materials
    path('materials/', views.MaterialListCreateView.as_view(), name='material-list'),
    path('materials/<int:pk>/', views.MaterialDetailView.as_view(), name='material-detail'),
    
    # Food Tickets
    path('food-tickets/', views.FoodTicketListCreateView.as_view(), name='food-ticket-list'),
    path('food-tickets/<int:pk>/', views.FoodTicketDetailView.as_view(), name='food-ticket-detail'),
    
    # Payment Tickets
    path('payment-tickets/', views.PaymentTicketListCreateView.as_view(), name='payment-ticket-list'),
    path('payment-tickets/<int:pk>/', views.PaymentTicketDetailView.as_view(), name='payment-ticket-detail'),
]

