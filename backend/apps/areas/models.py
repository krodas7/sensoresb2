"""
Area models for processing areas
"""

from django.db import models
from django.core.validators import MinValueValidator


class Area(models.Model):
    """Area model for processing areas"""
    
    AREA_TYPES = [
        ('guardeola', 'Guardeola'),
        ('pila', 'Pila'),
        ('horno', 'Horno'),
        ('humedo', 'Húmedo'),
        ('otra', 'Otra'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='Nombre')
    area_type = models.CharField(max_length=20, choices=AREA_TYPES, verbose_name='Tipo')
    capacity = models.FloatField(
        validators=[MinValueValidator(0)],
        default=0.0,
        verbose_name='Capacidad'
    )
    description = models.TextField(blank=True, verbose_name='Descripción')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Área'
        verbose_name_plural = 'Áreas'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_area_type_display()})"
    
    @property
    def current_occupation(self):
        """Get current occupation status"""
        from apps.occupation.models import Occupation
        latest = Occupation.objects.filter(area=self).order_by('-timestamp').first()
        return latest.estado if latest else 'libre'
    
    @property
    def current_lot(self):
        """Get current lot if occupied"""
        from apps.occupation.models import Occupation
        latest = Occupation.objects.filter(area=self).order_by('-timestamp').first()
        return latest.lot if latest and latest.estado == 'ocupado' else None
