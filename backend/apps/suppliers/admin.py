from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'contact_person', 'status', 'rating', 'total_deliveries', 'total_weight')
    list_filter = ('status', 'type', 'is_verified')
    search_fields = ('name', 'contact_person')
    readonly_fields = ('registration_date', 'created_at', 'updated_at', 'rating', 'total_deliveries', 'total_weight')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'type', 'contact_person', 'notes')
        }),
        ('Estado y Métricas', {
            'fields': ('status', 'is_verified', 'rating', 'total_deliveries', 'total_weight')
        }),
        ('Fechas', {
            'fields': ('registration_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
