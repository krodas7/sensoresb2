"""
Admin configuration for core models
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import User, Parameter, Event, Alert


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
