"""
Report models for the Sistema de Beneficio
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import User
from apps.lots.models import Lot
from apps.areas.models import Area
from apps.employees.models import Employee
from apps.attendance.models import AttendanceRecord
from apps.temperatures.models import Reading
from apps.occupation.models import Occupation


class Report(models.Model):
    """Report model for generating various system reports"""
    
    REPORT_TYPES = [
        ('daily_production', 'Producción Diaria'),
        ('temperature_summary', 'Resumen de Temperaturas'),
        ('attendance_summary', 'Resumen de Asistencia'),
        ('occupation_summary', 'Resumen de Ocupación'),
        ('lot_progress', 'Progreso de Lotes'),
        ('fermentation_report', 'Reporte de Fermentación'),
        ('cupping_report', 'Reporte de Catación'),
        ('employee_performance', 'Rendimiento de Empleados'),
        ('quality_control', 'Control de Calidad'),
        ('custom', 'Personalizado'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Borrador'),
        ('generating', 'Generando'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV'),
        ('json', 'JSON'),
    ]
    
    # Basic info
    name = models.CharField(max_length=200, verbose_name='Nombre del Reporte')
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES, verbose_name='Tipo de Reporte')
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default='pdf', verbose_name='Formato')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='Estado')
    
    # Parameters
    parameters = models.JSONField(default=dict, verbose_name='Parámetros')
    filters = models.JSONField(default=dict, verbose_name='Filtros')
    
    # Date range
    start_date = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Inicio')
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Fin')
    
    # Generated file info
    file_path = models.CharField(max_length=500, blank=True, verbose_name='Ruta del Archivo')
    file_size = models.BigIntegerField(null=True, blank=True, verbose_name='Tamaño del Archivo')
    download_count = models.PositiveIntegerField(default=0, verbose_name='Descargas')
    
    # Metadata
    description = models.TextField(blank=True, verbose_name='Descripción')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Reporte'
        verbose_name_plural = 'Reportes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_report_type_display()})"
    
    @property
    def is_ready(self):
        return self.status == 'completed' and self.file_path
    
    @property
    def file_url(self):
        if self.file_path:
            from django.conf import settings
            return f"{settings.MEDIA_URL}{self.file_path}"
        return None


class ReportTemplate(models.Model):
    """Template model for report generation"""
    
    TEMPLATE_TYPES = [
        ('html', 'HTML'),
        ('latex', 'LaTeX'),
        ('jinja2', 'Jinja2'),
        ('custom', 'Personalizado'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='Nombre de la Plantilla')
    report_type = models.CharField(max_length=50, verbose_name='Tipo de Reporte')
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, verbose_name='Tipo de Plantilla')
    
    # Template content
    template_content = models.TextField(verbose_name='Contenido de la Plantilla')
    css_content = models.TextField(blank=True, verbose_name='Estilos CSS')
    
    # Configuration
    is_default = models.BooleanField(default=False, verbose_name='Plantilla por Defecto')
    is_active = models.BooleanField(default=True, verbose_name='Activa')
    
    # Metadata
    description = models.TextField(blank=True, verbose_name='Descripción')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Plantilla de Reporte'
        verbose_name_plural = 'Plantillas de Reportes'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"


class ReportSchedule(models.Model):
    """Scheduled report generation"""
    
    FREQUENCY_CHOICES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('quarterly', 'Trimestral'),
        ('yearly', 'Anual'),
        ('custom', 'Personalizado'),
    ]
    
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='schedules')
    name = models.CharField(max_length=200, verbose_name='Nombre de la Programación')
    
    # Schedule settings
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, verbose_name='Frecuencia')
    cron_expression = models.CharField(max_length=100, blank=True, verbose_name='Expresión Cron')
    
    # Recipients
    email_recipients = models.JSONField(default=list, verbose_name='Destinatarios Email')
    
    # Status
    is_active = models.BooleanField(default=True, verbose_name='Activa')
    last_run = models.DateTimeField(null=True, blank=True, verbose_name='Última Ejecución')
    next_run = models.DateTimeField(null=True, blank=True, verbose_name='Próxima Ejecución')
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Programación de Reporte'
        verbose_name_plural = 'Programaciones de Reportes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.get_frequency_display()}"


class ReportLog(models.Model):
    """Log entries for report generation"""
    
    LOG_LEVELS = [
        ('info', 'Información'),
        ('warning', 'Advertencia'),
        ('error', 'Error'),
        ('debug', 'Debug'),
    ]
    
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='logs')
    level = models.CharField(max_length=20, choices=LOG_LEVELS, verbose_name='Nivel')
    message = models.TextField(verbose_name='Mensaje')
    details = models.JSONField(default=dict, verbose_name='Detalles')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Log de Reporte'
        verbose_name_plural = 'Logs de Reportes'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.report.name} - {self.get_level_display()} - {self.timestamp}"


class ReportData(models.Model):
    """Cached report data for performance"""
    
    report = models.OneToOneField(Report, on_delete=models.CASCADE, related_name='cached_data')
    data = models.JSONField(verbose_name='Datos en Cache')
    cache_key = models.CharField(max_length=200, unique=True, verbose_name='Clave de Cache')
    expires_at = models.DateTimeField(verbose_name='Expira en')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Datos de Reporte en Cache'
        verbose_name_plural = 'Datos de Reportes en Cache'
    
    def __str__(self):
        return f"Cache para {self.report.name}"
    
    @property
    def is_expired(self):
        from django.utils import timezone
        return timezone.now() > self.expires_at
