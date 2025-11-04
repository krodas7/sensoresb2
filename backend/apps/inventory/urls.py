from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    
    # Products
    path('products/', views.ProductListCreateView.as_view(), name='product-list'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    
    # Stock Movements
    path('movements/', views.StockMovementListCreateView.as_view(), name='stock-movement-list'),
]

