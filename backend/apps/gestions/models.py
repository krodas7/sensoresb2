from django.db import models
from django.core.validators import MinValueValidator
from apps.core.models import User


class MaterialRequest(models.Model):
    """Solicitud de materiales (herrería/electricidad)"""
    TYPE_CHOICES = [
        ('herreria', 'Herrería'),
        ('electricidad', 'Electricidad'),
    ]
    
    PRIORITY_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('en_proceso', 'En Proceso'),
        ('completado', 'Completado'),
        ('rechazado', 'Rechazado'),
    ]
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Tipo')
    title = models.CharField(max_length=200, verbose_name='Título')
    description = models.TextField(verbose_name='Descripción')
    requested_by = models.CharField(max_length=200, verbose_name='Solicitado Por')
    requested_date = models.DateField(verbose_name='Fecha de Solicitud')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='media', verbose_name='Prioridad')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente', verbose_name='Estado')
    approved_by = models.CharField(max_length=200, blank=True, verbose_name='Aprobado Por')
    approved_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Aprobación')
    completed_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Completado')
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name='Costo Estimado')
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='Costo Real')
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Solicitud de Material'
        verbose_name_plural = 'Solicitudes de Materiales'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.title}"


class Material(models.Model):
    """Materiales de una solicitud"""
    request = models.ForeignKey(MaterialRequest, on_delete=models.CASCADE, related_name='materials', verbose_name='Solicitud')
    name = models.CharField(max_length=200, verbose_name='Nombre')
    description = models.TextField(blank=True, verbose_name='Descripción')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='Cantidad')
    unit = models.CharField(max_length=50, verbose_name='Unidad')
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)], verbose_name='Precio Estimado')
    actual_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='Precio Real')
    supplier = models.CharField(max_length=200, blank=True, verbose_name='Proveedor')
    
    class Meta:
        verbose_name = 'Material'
        verbose_name_plural = 'Materiales'
    
    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"


class FoodTicket(models.Model):
    """Vale de comida"""
    SHIFT_CHOICES = [
        ('dia', 'Día'),
        ('noche', 'Noche'),
    ]
    
    MEAL_TYPE_CHOICES = [
        ('desayuno', 'Desayuno'),
        ('almuerzo', 'Almuerzo'),
        ('cena', 'Cena'),
    ]
    
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('pagado', 'Pagado'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('cheque', 'Cheque'),
    ]
    
    shift = models.CharField(max_length=10, choices=SHIFT_CHOICES, verbose_name='Turno')
    date = models.DateField(verbose_name='Fecha')
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPE_CHOICES, verbose_name='Tipo de Comida')
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='Costo Unitario')
    employee_count = models.IntegerField(validators=[MinValueValidator(0)], verbose_name='Cantidad de Empleados')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='Monto Total')
    description = models.TextField(blank=True, verbose_name='Descripción')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente', verbose_name='Estado')
    approved_by = models.CharField(max_length=200, blank=True, verbose_name='Aprobado Por')
    approved_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Aprobación')
    paid_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Pago')
    payment_reference = models.CharField(max_length=100, blank=True, verbose_name='Referencia de Pago')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, verbose_name='Método de Pago')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Vale de Comida'
        verbose_name_plural = 'Vales de Comida'
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.get_meal_type_display()} - {self.date} ({self.get_shift_display()})"


class FoodTicketEmployee(models.Model):
    """Empleados en un vale de comida"""
    ticket = models.ForeignKey(FoodTicket, on_delete=models.CASCADE, related_name='employees', verbose_name='Vale')
    employee_name = models.CharField(max_length=200, verbose_name='Nombre del Empleado')
    employee_id = models.CharField(max_length=100, blank=True, verbose_name='ID Empleado')
    
    class Meta:
        verbose_name = 'Empleado en Vale'
        verbose_name_plural = 'Empleados en Vale'
    
    def __str__(self):
        return self.employee_name


class PaymentTicket(models.Model):
    """Vale de pago (por hora o día)"""
    TYPE_CHOICES = [
        ('hora', 'Por Hora'),
        ('dia', 'Por Día'),
    ]
    
    STATUS_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobado', 'Aprobado'),
        ('pagado', 'Pagado'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('cheque', 'Cheque'),
    ]
    
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='Tipo de Pago')
    worker_name = models.CharField(max_length=200, verbose_name='Nombre del Trabajador')
    worker_id = models.CharField(max_length=100, blank=True, verbose_name='ID Trabajador')
    work_description = models.TextField(verbose_name='Descripción del Trabajo')
    hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='Horas')
    days = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='Días')
    rate_per_hour = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='Tarifa por Hora')
    rate_per_day = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)], verbose_name='Tarifa por Día')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='Monto Total')
    work_date = models.DateField(verbose_name='Fecha de Trabajo')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente', verbose_name='Estado')
    approved_by = models.CharField(max_length=200, blank=True, verbose_name='Aprobado Por')
    approved_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Aprobación')
    paid_date = models.DateField(null=True, blank=True, verbose_name='Fecha de Pago')
    payment_reference = models.CharField(max_length=100, blank=True, verbose_name='Referencia de Pago')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True, verbose_name='Método de Pago')
    notes = models.TextField(blank=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Vale de Pago'
        verbose_name_plural = 'Vales de Pago'
        ordering = ['-work_date', '-created_at']
    
    def __str__(self):
        return f"{self.worker_name} - {self.work_date} ({self.get_type_display()})"

