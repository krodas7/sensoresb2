from django.contrib import admin
from .models import Employee, Shift, ShiftAssignment


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'dpi', 'position', 'is_active', 'assigned_area')
    list_filter = ('is_active', 'position', 'assigned_area')
    search_fields = ('name', 'dpi', 'email')


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')


@admin.register(ShiftAssignment)
class ShiftAssignmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'shift', 'start_date', 'is_active')
    list_filter = ('is_active', 'shift')
    search_fields = ('employee__name', 'shift__name')
