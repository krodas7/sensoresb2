from django.contrib import admin
from .models import AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('employee', 'timestamp', 'record_type', 'origin', 'is_valid')
    list_filter = ('record_type', 'origin', 'is_valid', 'timestamp')
    search_fields = ('employee__name', 'observations')
    date_hierarchy = 'timestamp'
