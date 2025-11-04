from rest_framework import serializers
from .models import Category, Product, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'color', 'is_active', 'product_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'category', 'category_name', 'unit', 
                  'current_stock', 'min_stock', 'location', 'status', 'is_active', 
                  'is_low_stock', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = ['id', 'product', 'product_name', 'movement_type', 
                  'movement_type_display', 'quantity', 'reference', 'user', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']

