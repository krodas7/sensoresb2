from django.contrib import admin
from .models import MaterialRequest, Material, FoodTicket, FoodTicketEmployee, PaymentTicket


class MaterialInline(admin.TabularInline):
    model = Material
    extra = 1


@admin.register(MaterialRequest)
class MaterialRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'requested_by', 'requested_date', 'priority', 'status', 'estimated_cost')
    list_filter = ('type', 'priority', 'status', 'requested_date')
    search_fields = ('title', 'description', 'requested_by')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [MaterialInline]
    fieldsets = (
        ('Información Básica', {
            'fields': ('type', 'title', 'description', 'requested_by', 'requested_date', 'priority')
        }),
        ('Estado', {
            'fields': ('status', 'approved_by', 'approved_date', 'completed_date')
        }),
        ('Costos', {
            'fields': ('estimated_cost', 'actual_cost')
        }),
        ('Adicional', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class FoodTicketEmployeeInline(admin.TabularInline):
    model = FoodTicketEmployee
    extra = 1


@admin.register(FoodTicket)
class FoodTicketAdmin(admin.ModelAdmin):
    list_display = ('date', 'shift', 'meal_type', 'employee_count', 'total_amount', 'status')
    list_filter = ('shift', 'meal_type', 'status', 'date')
    search_fields = ('description', 'approved_by')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [FoodTicketEmployeeInline]
    fieldsets = (
        ('Información Básica', {
            'fields': ('shift', 'date', 'meal_type', 'unit_cost', 'employee_count', 'total_amount', 'description')
        }),
        ('Estado', {
            'fields': ('status', 'approved_by', 'approved_date', 'paid_date')
        }),
        ('Pago', {
            'fields': ('payment_method', 'payment_reference'),
            'classes': ('collapse',)
        }),
        ('Adicional', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(PaymentTicket)
class PaymentTicketAdmin(admin.ModelAdmin):
    list_display = ('worker_name', 'type', 'work_date', 'total_amount', 'status')
    list_filter = ('type', 'status', 'work_date')
    search_fields = ('worker_name', 'worker_id', 'work_description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Información del Trabajador', {
            'fields': ('worker_name', 'worker_id', 'work_description', 'work_date')
        }),
        ('Tipo y Tarifa', {
            'fields': ('type', 'hours', 'rate_per_hour', 'days', 'rate_per_day', 'total_amount')
        }),
        ('Estado', {
            'fields': ('status', 'approved_by', 'approved_date', 'paid_date')
        }),
        ('Pago', {
            'fields': ('payment_method', 'payment_reference'),
            'classes': ('collapse',)
        }),
        ('Adicional', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

