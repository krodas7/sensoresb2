from django.db import models


class Supplier(models.Model):
    """Proveedor de café cereza o pergamino"""
    
    TYPE_CHOICES = [
        ('cc1', 'Café Cereza CC1'),
        ('parchment', 'Café Pergamino'),
        ('both', 'Ambos Tipos'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('suspended', 'Suspendido'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='Nombre del Proveedor')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Tipo de Café')
    contact_person = models.CharField(max_length=200, verbose_name='Persona de Contacto')
    notes = models.TextField(blank=True, verbose_name='Notas Adicionales')
    
    # Campos calculados/automáticos
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Estado')
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0, verbose_name='Calificación')
    total_deliveries = models.IntegerField(default=0, verbose_name='Total de Entregas')
    total_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, verbose_name='Peso Total (qq)')
    is_verified = models.BooleanField(default=False, verbose_name='Verificado')
    
    # Timestamps
    registration_date = models.DateField(auto_now_add=True, verbose_name='Fecha de Registro')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Proveedor'
        verbose_name_plural = 'Proveedores'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
