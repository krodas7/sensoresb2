"""
Occupation models for area occupancy tracking
"""

from django.db import models
from apps.areas.models import Area


class Occupation(models.Model):
    """Occupation model for area occupancy tracking"""
    
    OCCUPATION_STATUS = [
        ('ocupado', 'Ocupado'),
        ('libre', 'Libre'),
        ('mantenimiento', 'Mantenimiento'),
        ('forzado', 'Forzado'),
    ]
    
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='occupations', verbose_name='Área')
    lot = models.ForeignKey('lots.Lot', on_delete=models.SET_NULL, null=True, blank=True, related_name='occupations', verbose_name='Lote')
    status = models.CharField(max_length=20, choices=OCCUPATION_STATUS, verbose_name='Estado')
    reason = models.CharField(max_length=500, blank=True, verbose_name='Motivo')
    timestamp = models.DateTimeField(verbose_name='Timestamp')
    is_automatic = models.BooleanField(default=True, verbose_name='Automático')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Ocupación'
        verbose_name_plural = 'Ocupaciones'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['area', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.area.name}: {self.get_status_display()} - {self.timestamp}"
    
    @property
    def duration(self):
        """Calculate occupation duration"""
        if self.status == 'ocupado':
            # Find when this occupation started
            previous = Occupation.objects.filter(
                area=self.area,
                timestamp__lt=self.timestamp
            ).order_by('-timestamp').first()
            
            if previous and previous.status != 'ocupado':
                return self.timestamp - previous.timestamp
        return None
