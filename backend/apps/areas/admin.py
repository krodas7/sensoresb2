"""
Admin configuration for areas
"""

from django.contrib import admin
from .models import Area


@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    """Area admin"""
    
    list_display = ('name', 'area_type', 'capacity', 'is_active', 'current_occupation', 'created_at')
    list_filter = ('area_type', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at', 'current_occupation', 'current_lot')
    
    fieldsets = (
        (None, {'fields': ('name', 'area_type', 'capacity', 'description', 'is_active')}),
        ('Estado Actual', {'fields': ('current_occupation', 'current_lot')}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )
    
    def current_occupation(self, obj):
        return obj.current_occupation
    current_occupation.short_description = 'Ocupación Actual'
    
    def current_lot(self, obj):
        lot = obj.current_lot
        return lot.codigo if lot else 'N/A'
    current_lot.short_description = 'Lote Actual'
