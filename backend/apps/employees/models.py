from django.db import models


class Employee(models.Model):
    name = models.CharField(max_length=200, verbose_name='Nombre')
    dpi = models.CharField(max_length=20, unique=True, verbose_name='DPI')
    position = models.CharField(max_length=100, verbose_name='Puesto')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    fingerprint_template_id = models.CharField(max_length=100, blank=True, verbose_name='ID Plantilla Huella')
    photo_url = models.URLField(blank=True, verbose_name='URL Foto')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    email = models.EmailField(blank=True, verbose_name='Email')
    address = models.TextField(blank=True, verbose_name='Dirección')
    birth_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Nacimiento')
    hire_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Ingreso')
    salary = models.CharField(max_length=50, blank=True, verbose_name='Salario')
    supervisor = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Supervisor')
    assigned_area = models.CharField(max_length=100, blank=True, verbose_name='Área Asignada')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        ordering = ['name']


class Shift(models.Model):
    name = models.CharField(max_length=100, verbose_name='Nombre')
    start_time = models.TimeField(verbose_name='Hora de Inicio')
    end_time = models.TimeField(verbose_name='Hora de Fin')
    weekdays = models.JSONField(default=list, verbose_name='Días de la Semana')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    description = models.CharField(max_length=500, blank=True, verbose_name='Descripción')
    color = models.CharField(max_length=7, blank=True, verbose_name='Color')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Turno'
        verbose_name_plural = 'Turnos'
        ordering = ['name']


class ShiftAssignment(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shift_assignments')
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='assignments')
    start_date = models.DateTimeField(verbose_name='Fecha de Inicio')
    end_date = models.DateTimeField(null=True, blank=True, verbose_name='Fecha de Fin')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Asignación de Turno'
        verbose_name_plural = 'Asignaciones de Turno'
        ordering = ['-start_date']
