"""
Temperature reading models
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.sensors.models import Sensor


class Reading(models.Model):
    """Sensor reading model"""
    
    QUALITY_CHOICES = [
        ('good', 'Buena'),
        ('warning', 'Advertencia'),
        ('error', 'Error'),
    ]
    
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, related_name='readings', verbose_name='Sensor')
    timestamp = models.DateTimeField(verbose_name='Timestamp')
    value = models.FloatField(verbose_name='Valor')
    unit = models.CharField(max_length=10, default='°C', verbose_name='Unidad')
    quality = models.CharField(max_length=20, choices=QUALITY_CHOICES, default='good', verbose_name='Calidad')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Lectura'
        verbose_name_plural = 'Lecturas'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['sensor', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.sensor.code}: {self.value}{self.unit} @ {self.timestamp}"
    
    def save(self, *args, **kwargs):
        # Update sensor's last reading
        if self.sensor:
            self.sensor.last_reading_time = self.timestamp
            self.sensor.last_reading_value = self.value
            self.sensor.save(update_fields=['last_reading_time', 'last_reading_value'])
        
        super().save(*args, **kwargs)
