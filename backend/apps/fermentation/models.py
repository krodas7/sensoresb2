from django.db import models
from apps.lots.models import Lot


class Fermentation(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
    ]
    
    lot = models.ForeignKey('lots.Lot', on_delete=models.CASCADE, related_name='fermentations')
    start_time = models.DateTimeField(verbose_name='Hora de Inicio')
    target_hours = models.FloatField(verbose_name='Objetivo (horas)')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='Hora de Fin')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    notes = models.TextField(blank=True)
    responsible = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Fermentación'
        verbose_name_plural = 'Fermentaciones'
        ordering = ['-start_time']


class FermentationMeasurement(models.Model):
    fermentation = models.ForeignKey(Fermentation, on_delete=models.CASCADE, related_name='measurements')
    timestamp = models.DateTimeField()
    ph = models.FloatField(null=True, blank=True)
    temperature = models.FloatField(null=True, blank=True)
    observations = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Medición de Fermentación'
        verbose_name_plural = 'Mediciones de Fermentación'
        ordering = ['-timestamp']
