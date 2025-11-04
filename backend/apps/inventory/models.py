from django.db import models
from django.core.validators import MinValueValidator


class Category(models.Model):
    """Categoría de artículos de inventario"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    color = models.CharField(max_length=50, default='bg-gray-500', verbose_name='Color')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def product_count(self):
        return self.products.filter(is_active=True).count()


class Product(models.Model):
    """Artículo de inventario"""
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('discontinued', 'Descontinuado'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products', verbose_name='Categoría')
    unit = models.CharField(max_length=20, default='unidad', verbose_name='Unidad de Medida')
    current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name='Stock Actual')
    min_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name='Stock Mínimo')
    location = models.CharField(max_length=100, blank=True, verbose_name='Ubicación')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Estado')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Artículo'
        verbose_name_plural = 'Artículos'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock


class StockMovement(models.Model):
    """Movimiento de inventario (entrada/salida)"""
    MOVEMENT_TYPE_CHOICES = [
        ('in', 'Entrada'),
        ('out', 'Salida'),
        ('adjustment', 'Ajuste'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements', verbose_name='Producto')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES, verbose_name='Tipo de Movimiento')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='Cantidad')
    reference = models.CharField(max_length=100, blank=True, verbose_name='Referencia')
    user = models.CharField(max_length=100, blank=True, verbose_name='Usuario')
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Movimiento de Stock'
        verbose_name_plural = 'Movimientos de Stock'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.product.name} ({self.quantity} {self.product.unit})"

