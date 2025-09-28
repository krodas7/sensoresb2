"""
Admin configuration for temperatures
"""

from django.contrib import admin
from .models import Reading


@admin.register(Reading)
class ReadingAdmin(admin.ModelAdmin):
    """Reading admin"""
    
    list_display = ('sensor', 'timestamp', 'value', 'unit', 'quality', 'created_at')
    list_filter = ('quality', 'unit', 'sensor__sensor_type', 'sensor__area', 'timestamp')
    search_fields = ('sensor__code', 'sensor__area__name')
    readonly_fields = ('created_at',)
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        (None, {'fields': ('sensor', 'timestamp', 'value', 'unit', 'quality')}),
        ('Fechas', {'fields': ('created_at',)}),
    )
