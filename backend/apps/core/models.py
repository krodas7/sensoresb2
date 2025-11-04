"""
Core models for the Sistema de Beneficio
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Extended User model with additional fields"""
    
    ROLES = [
        ('admin', 'Administrador'),
        ('operador_seco', 'Operador Seco'),
        ('operador_humedo', 'Operador Húmedo'),
        ('catador', 'Catador'),
        ('rrhh', 'Recursos Humanos'),
        ('invitado', 'Invitado'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('suspended', 'Suspendido'),
    ]
    
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLES, default='invitado')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    is_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"


class Parameter(models.Model):
    """System parameters configuration"""
    
    CATEGORIES = [
        ('general', 'General'),
        ('temperature', 'Temperatura'),
        ('fermentation', 'Fermentación'),
        ('cupping', 'Catación'),
        ('attendance', 'Asistencia'),
        ('alerts', 'Alertas'),
    ]
    
    TYPES = [
        ('string', 'Texto'),
        ('number', 'Número'),
        ('boolean', 'Booleano'),
        ('json', 'JSON'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value_json = models.TextField()
    description = models.CharField(max_length=500, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORIES, default='general')
    param_type = models.CharField(max_length=20, choices=TYPES, default='string')
    is_sensitive = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Parámetro'
        verbose_name_plural = 'Parámetros'
    
    def __str__(self):
        return f"{self.key} ({self.category})"


class Event(models.Model):
    """Audit trail events"""
    
    EVENT_TYPES = [
        ('user_login', 'Login de Usuario'),
        ('user_logout', 'Logout de Usuario'),
        ('sensor_reading', 'Lectura de Sensor'),
        ('occupation_change', 'Cambio de Ocupación'),
        ('lot_created', 'Lote Creado'),
        ('lot_updated', 'Lote Actualizado'),
        ('fermentation_started', 'Fermentación Iniciada'),
        ('fermentation_completed', 'Fermentación Completada'),
        ('cupping_created', 'Catación Creada'),
        ('attendance_marked', 'Asistencia Marcada'),
        ('alert_triggered', 'Alerta Disparada'),
        ('system_error', 'Error del Sistema'),
    ]
    
    SEVERITY_LEVELS = [
        ('info', 'Información'),
        ('warning', 'Advertencia'),
        ('error', 'Error'),
        ('critical', 'Crítico'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    payload_json = models.TextField(blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='info')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        verbose_name = 'Evento'
        verbose_name_plural = 'Eventos'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.get_event_type_display()} - {self.timestamp}"


class Alert(models.Model):
    """System alerts configuration"""
    
    ALERT_TYPES = [
        ('temperature', 'Temperatura'),
        ('sensor_offline', 'Sensor Desconectado'),
        ('occupation', 'Ocupación'),
        ('fermentation', 'Fermentación'),
        ('attendance', 'Asistencia'),
        ('system', 'Sistema'),
    ]
    
    SEVERITY_LEVELS = [
        ('low', 'Bajo'),
        ('medium', 'Medio'),
        ('high', 'Alto'),
        ('critical', 'Crítico'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('acknowledged', 'Reconocido'),
        ('resolved', 'Resuelto'),
        ('disabled', 'Deshabilitado'),
    ]
    
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    rule = models.CharField(max_length=200)
    destination = models.CharField(max_length=500)  # Email, phone, etc.
    is_active = models.BooleanField(default=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    description = models.TextField(blank=True)
    conditions = models.TextField(blank=True)  # JSON with alert conditions
    cooldown_minutes = models.IntegerField(default=0)
    last_triggered = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
    
    def __str__(self):
        return f"{self.get_alert_type_display()} - {self.rule}"


class UserRole(models.Model):
    """Roles del sistema de beneficio de café"""
    ROLE_CHOICES = [
        ('superusuario', 'Superusuario'),
        ('administrador', 'Administrador'),
        ('catador', 'Catador'),
        ('pesador', 'Pesador'),
        ('operador', 'Operador'),
        ('supervisor', 'Supervisor'),
        ('invitado', 'Invitado'),
    ]
    
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Rol de Usuario'
        verbose_name_plural = 'Roles de Usuario'
        ordering = ['name']
    
    def __str__(self):
        return self.display_name


class ModulePermission(models.Model):
    """Permisos por módulo del sistema"""
    MODULE_CHOICES = [
        ('dashboard', 'Dashboard'),
        ('usuarios', 'Usuarios'),
        ('empleados', 'Empleados'),
        ('proveedores', 'Proveedores'),
        ('catacion', 'Catación'),
        ('integracion_lotes', 'Integración de Lotes'),
        ('pesos_envio', 'Pesos Envío'),
        ('temperaturas', 'Temperaturas'),
        ('fermentacion', 'Fermentación'),
        ('ocupacion', 'Ocupación'),
        ('reportes', 'Reportes'),
        ('logs', 'Logs'),
        ('configuracion', 'Configuración'),
    ]
    
    PERMISSION_CHOICES = [
        ('view', 'Ver'),
        ('create', 'Crear'),
        ('edit', 'Editar'),
        ('delete', 'Eliminar'),
        ('export', 'Exportar'),
        ('admin', 'Administrar'),
    ]
    
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES)
    role = models.ForeignKey(UserRole, on_delete=models.CASCADE, related_name='permissions')
    is_granted = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Permiso de Módulo'
        verbose_name_plural = 'Permisos de Módulo'
        unique_together = ['module', 'permission', 'role']
        ordering = ['module', 'permission']
    
    def __str__(self):
        return f"{self.role.display_name} - {self.get_module_display()} - {self.get_permission_display()}"


class UserProfile(models.Model):
    """Perfil extendido del usuario con roles y permisos"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.ForeignKey(UserRole, on_delete=models.SET_NULL, null=True, blank=True)
    custom_permissions = models.ManyToManyField(ModulePermission, blank=True, related_name='custom_users')
    is_active = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuario'
    
    def __str__(self):
        return f"{self.user.username} - {self.role.display_name if self.role else 'Sin rol'}"
    
    def has_permission(self, module, permission):
        """Verificar si el usuario tiene un permiso específico"""
        if not self.is_active:
            return False
        
        # Verificar permisos del rol
        if self.role:
            role_permission = ModulePermission.objects.filter(
                role=self.role,
                module=module,
                permission=permission,
                is_granted=True
            ).exists()
            if role_permission:
                return True
        
        # Verificar permisos personalizados
        custom_permission = self.custom_permissions.filter(
            module=module,
            permission=permission,
            is_granted=True
        ).exists()
        
        return custom_permission
    
    def get_accessible_modules(self):
        """Obtener módulos a los que el usuario tiene acceso"""
        if not self.is_active:
            return []
        
        accessible = set()
        
        # Módulos del rol
        if self.role:
            role_modules = ModulePermission.objects.filter(
                role=self.role,
                is_granted=True
            ).values_list('module', flat=True).distinct()
            accessible.update(role_modules)
        
        # Módulos personalizados
        custom_modules = self.custom_permissions.filter(
            is_granted=True
        ).values_list('module', flat=True).distinct()
        accessible.update(custom_modules)
        
        return list(accessible)


# Import backup models to make them available
from .backup_models import BackupRecord, BackupSchedule
