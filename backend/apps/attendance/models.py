from django.db import models
from apps.employees.models import Employee
from apps.core.models import User


class AttendanceRecord(models.Model):
    TYPE_CHOICES = [
        ('IN', 'Entrada'),
        ('OUT', 'Salida'),
    ]
    
    ORIGIN_CHOICES = [
        ('fingerprint', 'Huella'),
        ('manual', 'Manual'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_records')
    timestamp = models.DateTimeField(verbose_name='Timestamp')
    record_type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='Tipo')
    origin = models.CharField(max_length=20, choices=ORIGIN_CHOICES, verbose_name='Origen')
    is_valid = models.BooleanField(default=True, verbose_name='Válido')
    observations = models.CharField(max_length=500, blank=True, verbose_name='Observaciones')
    device_id = models.CharField(max_length=100, blank=True, verbose_name='ID Dispositivo')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Registro de Asistencia'
        verbose_name_plural = 'Registros de Asistencia'
        ordering = ['-timestamp']
