from django.contrib import admin
from .models import Category, Product, StockMovement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'is_active', 'product_count', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'current_stock', 'min_stock', 'unit', 'status', 'is_active')
    list_filter = ('category', 'status', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    list_select_related = ('category',)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'reference', 'user', 'created_at')
    list_filter = ('movement_type', 'created_at')
    search_fields = ('product__name', 'reference', 'user')
    readonly_fields = ('created_at',)
    list_select_related = ('product',)

