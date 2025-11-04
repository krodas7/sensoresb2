from django.db import models


class Supervisor(models.Model):
    """Encargado de turno de 24 horas - Lunes 8AM a Martes 8AM y así sucesivamente"""
    SHIFT_CHOICES = [
        ('turno_a', 'Turno A (Lunes 8AM - Martes 8AM)'),
        ('turno_b', 'Turno B (Martes 8AM - Miércoles 8AM)'),
    ]
    
    name = models.CharField(max_length=200, verbose_name='Nombre del Encargado')
    shift_type = models.CharField(max_length=10, choices=SHIFT_CHOICES, verbose_name='Turno')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    email = models.EmailField(blank=True, verbose_name='Email')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Encargado de Turno'
        verbose_name_plural = 'Encargados de Turno'
        ordering = ['shift_type', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.get_shift_type_display()}"


class Employee(models.Model):
    name = models.CharField(max_length=200, verbose_name='Nombre')
    dpi = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name='DPI')
    position = models.CharField(max_length=100, verbose_name='Puesto')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    fingerprint_template_id = models.CharField(max_length=100, blank=True, verbose_name='ID Plantilla Huella')
    photo_url = models.URLField(blank=True, verbose_name='URL Foto')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Teléfono')
    email = models.EmailField(blank=True, verbose_name='Email')
    address = models.TextField(blank=True, verbose_name='Dirección')
    birth_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Nacimiento')
    # hire_date removido según requerimiento
    salary = models.CharField(max_length=50, blank=True, verbose_name='Salario')
    # Cambiado de supervisor self-referencing a Supervisor model
    supervisor = models.ForeignKey(Supervisor, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees', verbose_name='Encargado de Turno')
    assigned_area = models.CharField(max_length=100, blank=True, verbose_name='Área Asignada')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Empleado'
        verbose_name_plural = 'Empleados'
        ordering = ['name']
    
    def __str__(self):
        return self.name


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
