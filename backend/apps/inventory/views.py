from rest_framework import generics
from django.db.models import F
from .models import Category, Product, StockMovement
from .serializers import CategorySerializer, ProductSerializer, StockMovementSerializer


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por categoría
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Filtrar por estado
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filtrar por stock bajo
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            queryset = queryset.filter(current_stock__lte=F('min_stock'))
        
        return queryset


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer


class StockMovementListCreateView(generics.ListCreateAPIView):
    queryset = StockMovement.objects.select_related('product').all()
    serializer_class = StockMovementSerializer
    
    def perform_create(self, serializer):
        movement = serializer.save()
        # Actualizar stock del producto
        product = movement.product
        if movement.movement_type == 'in':
            product.current_stock += movement.quantity
        elif movement.movement_type == 'out':
            product.current_stock -= movement.quantity
        elif movement.movement_type == 'adjustment':
            product.current_stock = movement.quantity
        product.save()

