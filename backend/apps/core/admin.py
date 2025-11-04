"""
Admin configuration for core models
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import User, Parameter, Event, Alert
from .backup_models import BackupRecord, BackupSchedule


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin"""
    
    list_display = ('email', 'get_full_name', 'role', 'status', 'is_active', 'last_login')
    list_filter = ('role', 'status', 'is_active', 'is_verified', 'date_joined')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name')}),
        ('Permisos', {'fields': ('role', 'status', 'is_active', 'is_verified', 'is_staff', 'is_superuser')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
        ('Grupos', {'fields': ('groups', 'user_permissions')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role'),
        }),
    )
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    get_full_name.short_description = 'Nombre Completo'


@admin.register(Parameter)
class ParameterAdmin(admin.ModelAdmin):
    """Parameter admin"""
    
    list_display = ('key', 'category', 'param_type', 'is_active', 'is_sensitive')
    list_filter = ('category', 'param_type', 'is_active', 'is_sensitive')
    search_fields = ('key', 'description')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('key', 'value_json', 'description')}),
        ('Configuración', {'fields': ('category', 'param_type', 'is_sensitive', 'is_active')}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Event admin"""
    
    list_display = ('timestamp', 'event_type', 'severity', 'user', 'ip_address')
    list_filter = ('event_type', 'severity', 'timestamp')
    search_fields = ('user__email', 'ip_address', 'payload_json')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
    
    def has_add_permission(self, request):
        return False  # Events are created programmatically


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    """Alert admin"""
    
    list_display = ('alert_type', 'rule', 'severity', 'status', 'is_active', 'last_triggered')
    list_filter = ('alert_type', 'severity', 'status', 'is_active')
    search_fields = ('rule', 'description', 'destination')
    readonly_fields = ('created_at', 'updated_at', 'last_triggered')
    
    fieldsets = (
        (None, {'fields': ('alert_type', 'rule', 'description')}),
        ('Configuración', {'fields': ('destination', 'severity', 'status', 'is_active')}),
        ('Condiciones', {'fields': ('conditions', 'cooldown_minutes')}),
        ('Fechas', {'fields': ('created_at', 'updated_at', 'last_triggered')}),
    )


@admin.register(BackupRecord)
class BackupRecordAdmin(admin.ModelAdmin):
    """Admin para registros de backup"""
    
    list_display = ('backup_type', 'status_badge', 'file_size_mb', 'started_at', 'duration', 'initiated_by_name')
    list_filter = ('backup_type', 'status', 'started_at')
    search_fields = ('task_id', 'initiated_by__username', 'error_message')
    readonly_fields = ('task_id', 'file_path', 'file_size', 's3_url', 'started_at', 'completed_at', 'duration')
    date_hierarchy = 'started_at'
    
    def status_badge(self, obj):
        """Mostrar estado con badge de color"""
        colors = {
            'pending': 'orange',
            'running': 'blue',
            'completed': 'green',
            'failed': 'red'
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Estado'
    
    def initiated_by_name(self, obj):
        """Nombre del usuario que inició el backup"""
        return obj.initiated_by.get_full_name() if obj.initiated_by else 'Configured'
    initiated_by_name.short_description = 'Iniciado por'


@admin.register(BackupSchedule)
class BackupScheduleAdmin(admin.ModelAdmin):
    """Admin para programaciones de backup"""
    
    list_display = ('name', 'backup_type', 'frequency', 'is_active_badge', 'next_run', 'created_by_name')
    list_filter = ('backup_type', 'frequency', 'is_active', 'created_at')
    search_fields = ('name', 'created_by__username')
    readonly_fields = ('created_at', 'updated_at', 'last_run', 'next_run')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'backup_type', 'frequency', 'is_active')
        }),
        ('Horario', {
            'fields': ('hour', 'minute')
        }),
        ('Configuración', {
            'fields': ('upload_to_s3', 'retention_days')
        }),
        ('Ejecución', {
            'fields': ('last_run', 'next_run')
        }),
        ('Metadatos', {
            'fields': ('created_by', 'created_at', 'updated_at')
        }),
    )
    
    def is_active_badge(self, obj):
        """Mostrar estado activo con badge"""
        if obj.is_active:
            return format_html(
                '<span style="background-color: green; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">Activo</span>'
            )
        else:
            return format_html(
                '<span style="background-color: red; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px;">Inactivo</span>'
            )
    is_active_badge.short_description = 'Estado'
    
    def created_by_name(self, obj):
        """Nombre del usuario que creó la programación"""
        return obj.created_by.get_full_name()
    created_by_name.short_description = 'Creado por'
