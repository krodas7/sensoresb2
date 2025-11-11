from django.contrib import admin
from .models import Employee, Shift, ShiftAssignment, Supervisor


@admin.register(Supervisor)
class SupervisorAdmin(admin.ModelAdmin):
    list_display = ('name', 'shift_type', 'phone', 'is_active', 'get_employee_count')
    list_filter = ('is_active', 'shift_type')
    search_fields = ('name', 'phone')
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()
    get_employee_count.short_description = 'Empleados Activos'


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('name', 'dpi', 'position', 'supervisor', 'is_active', 'assigned_area')
    list_filter = ('is_active', 'position', 'assigned_area', 'supervisor')
    search_fields = ('name', 'dpi', 'email')
    raw_id_fields = ('supervisor',)


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
