"""
Admin configuration for sensors
"""

from django.contrib import admin
from .models import Sensor


@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    """Sensor admin"""
    
    list_display = ('code', 'sensor_type', 'area', 'is_active', 'status', 'last_reading_time', 'last_reading_value')
    list_filter = ('sensor_type', 'is_active', 'area', 'created_at')
    search_fields = ('code', 'description', 'location')
    readonly_fields = ('last_reading_time', 'last_reading_value', 'created_at', 'updated_at', 'status', 'is_online')
    
    fieldsets = (
        (None, {'fields': ('code', 'sensor_type', 'area', 'location', 'description', 'is_active')}),
        ('Estado', {'fields': ('status', 'is_online', 'last_reading_time', 'last_reading_value')}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )
    
    def status(self, obj):
        return obj.status
    status.short_description = 'Estado'
    
    def is_online(self, obj):
        return obj.is_online
    is_online.short_description = 'En Línea'
    is_online.boolean = True
