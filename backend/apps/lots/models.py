"""
Lot models for coffee lots
"""

from django.db import models
from django.core.validators import MinValueValidator
from apps.areas.models import Area


class Lot(models.Model):
    """Lot model for coffee lots"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('in_progress', 'En Proceso'),
        ('completed', 'Completado'),
        ('cancelled', 'Cancelado'),
    ]
    
    code = models.CharField(max_length=50, unique=True, verbose_name='Código')
    finca = models.CharField(max_length=100, verbose_name='Finca')
    variety = models.CharField(max_length=100, verbose_name='Variedad')
    sublot = models.CharField(max_length=50, blank=True, verbose_name='Sublote')
    initial_weight = models.FloatField(
        validators=[MinValueValidator(0)],
        verbose_name='Peso Inicial (kg)'
    )
    initial_humidity = models.FloatField(
        validators=[MinValueValidator(0), MinValueValidator(100)],
        verbose_name='Humedad Inicial (%)'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Estado')
    current_area = models.ForeignKey(
        Area, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='lots',
        verbose_name='Área Actual'
    )
    notes = models.TextField(blank=True, verbose_name='Notas')
    responsible = models.CharField(max_length=100, blank=True, verbose_name='Responsable')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.finca} ({self.variety})"
    
    @property
    def current_occupation(self):
        """Get current occupation if lot is in an area"""
        if self.current_area:
            from apps.occupation.models import Occupation
            return Occupation.objects.filter(
                area=self.current_area,
                lot=self
            ).order_by('-timestamp').first()
        return None
