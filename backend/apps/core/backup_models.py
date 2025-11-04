"""
Modelos para el sistema de backup
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class BackupRecord(models.Model):
    """Registro de backups realizados"""
    
    BACKUP_TYPES = [
        ('database', 'Base de Datos'),
        ('media', 'Archivos Media'),
        ('full', 'Backup Completo'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('running', 'En Progreso'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES, verbose_name='Tipo de Backup')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Estado')
    
    # Información del archivo
    file_path = models.CharField(max_length=500, blank=True, verbose_name='Ruta del Archivo')
    file_size = models.BigIntegerField(null=True, blank=True, verbose_name='Tamaño (bytes)')
    s3_url = models.CharField(max_length=500, blank=True, verbose_name='URL S3')
    
    # Metadatos
    started_at = models.DateTimeField(default=timezone.now, verbose_name='Iniciado')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='Completado')
    duration = models.DurationField(null=True, blank=True, verbose_name='Duración')
    
    # Información de la tarea
    task_id = models.CharField(max_length=100, blank=True, verbose_name='ID de Tarea')
    error_message = models.TextField(blank=True, verbose_name='Mensaje de Error')
    
    # Usuario que inició el backup
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Iniciado por')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Registro de Backup'
        verbose_name_plural = 'Registros de Backup'
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.get_backup_type_display()} - {self.status} - {self.started_at.strftime('%Y-%m-%d %H:%M')}"
    
    def save(self, *args, **kwargs):
        # Calcular duración si está completado
        if self.completed_at and self.started_at:
            self.duration = self.completed_at - self.started_at
        super().save(*args, **kwargs)
    
    @property
    def file_size_mb(self):
        """Tamaño del archivo en MB"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return None
    
    @property
    def is_successful(self):
        """Verificar si el backup fue exitoso"""
        return self.status == 'completed' and not self.error_message


class BackupSchedule(models.Model):
    """Programación de backups automáticos"""
    
    FREQUENCY_CHOICES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
    ]
    
    BACKUP_TYPES = [
        ('database', 'Base de Datos'),
        ('media', 'Archivos Media'),
        ('full', 'Backup Completo'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='Nombre')
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPES, verbose_name='Tipo de Backup')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, verbose_name='Frecuencia')
    
    # Horario
    hour = models.IntegerField(default=2, verbose_name='Hora (0-23)')
    minute = models.IntegerField(default=0, verbose_name='Minuto (0-59)')
    
    # Configuración
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    upload_to_s3 = models.BooleanField(default=False, verbose_name='Subir a S3')
    retention_days = models.IntegerField(default=30, verbose_name='Días de Retención')
    
    # Metadatos
    last_run = models.DateTimeField(null=True, blank=True, verbose_name='Última Ejecución')
    next_run = models.DateTimeField(null=True, blank=True, verbose_name='Próxima Ejecución')
    
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='Creado por')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Programación de Backup'
        verbose_name_plural = 'Programaciones de Backup'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - {self.get_frequency_display()} - {self.get_backup_type_display()}"
    
    def calculate_next_run(self):
        """Calcular próxima ejecución"""
        from datetime import timedelta
        
        now = timezone.now()
        
        if self.frequency == 'daily':
            next_run = now.replace(hour=self.hour, minute=self.minute, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
        
        elif self.frequency == 'weekly':
            # Ejecutar cada lunes
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0 and now.hour < self.hour:
                days_until_monday = 0
            else:
                days_until_monday = days_until_monday if days_until_monday > 0 else 7
            
            next_run = now.replace(hour=self.hour, minute=self.minute, second=0, microsecond=0) + timedelta(days=days_until_monday)
        
        elif self.frequency == 'monthly':
            # Ejecutar el primer día del mes
            if now.day == 1 and now.hour < self.hour:
                next_run = now.replace(day=1, hour=self.hour, minute=self.minute, second=0, microsecond=0)
            else:
                # Próximo mes
                if now.month == 12:
                    next_run = now.replace(year=now.year + 1, month=1, day=1, hour=self.hour, minute=self.minute, second=0, microsecond=0)
                else:
                    next_run = now.replace(month=now.month + 1, day=1, hour=self.hour, minute=self.minute, second=0, microsecond=0)
        
        self.next_run = next_run
        return next_run
