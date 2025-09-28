"""
Sensor models for IoT devices
"""

from django.db import models
from apps.areas.models import Area


class Sensor(models.Model):
    """Sensor model for IoT devices"""
    
    SENSOR_TYPES = [
        ('temperature', 'Temperatura'),
        ('humidity', 'Humedad'),
        ('ph', 'pH'),
        ('pressure', 'Presión'),
        ('other', 'Otro'),
    ]
    
    code = models.CharField(max_length=50, unique=True, verbose_name='Código')
    sensor_type = models.CharField(max_length=20, choices=SENSOR_TYPES, verbose_name='Tipo')
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='sensors', verbose_name='Área')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    last_reading_time = models.DateTimeField(null=True, blank=True, verbose_name='Última Lectura')
    last_reading_value = models.FloatField(null=True, blank=True, verbose_name='Último Valor')
    location = models.CharField(max_length=200, blank=True, verbose_name='Ubicación')
    description = models.TextField(blank=True, verbose_name='Descripción')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Sensor'
        verbose_name_plural = 'Sensores'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} ({self.get_sensor_type_display()}) - {self.area.name}"
    
    @property
    def is_online(self):
        """Check if sensor is online (has recent readings)"""
        if not self.last_reading_time:
            return False
        
        from django.utils import timezone
        from datetime import timedelta
        
        # Consider sensor offline if no reading in last 5 minutes
        threshold = timezone.now() - timedelta(minutes=5)
        return self.last_reading_time > threshold
    
    @property
    def status(self):
        """Get sensor status"""
        if not self.is_active:
            return 'inactive'
        elif not self.is_online:
            return 'offline'
        else:
            return 'online'
