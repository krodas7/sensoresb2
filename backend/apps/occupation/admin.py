"""
Admin configuration for occupation
"""

from django.contrib import admin
from .models import Occupation


@admin.register(Occupation)
class OccupationAdmin(admin.ModelAdmin):
    """Occupation admin"""
    
    list_display = ('area', 'status', 'lot', 'timestamp', 'is_automatic', 'reason')
    list_filter = ('status', 'is_automatic', 'area', 'timestamp')
    search_fields = ('area__name', 'lot__codigo', 'reason')
    readonly_fields = ('created_at', 'duration')
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    fieldsets = (
        (None, {'fields': ('area', 'lot', 'status', 'reason', 'timestamp', 'is_automatic')}),
        ('Información', {'fields': ('duration', 'created_at')}),
    )
    
    def duration(self, obj):
        duration = obj.duration
        if duration:
            hours, remainder = divmod(duration.total_seconds(), 3600)
            minutes, _ = divmod(remainder, 60)
            return f"{int(hours)}h {int(minutes)}m"
        return "N/A"
    duration.short_description = 'Duración'
