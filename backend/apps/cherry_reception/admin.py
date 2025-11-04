from django.contrib import admin
from .models import CherryReception, CherryReceptionImage


class CherryReceptionImageInline(admin.TabularInline):
    model = CherryReceptionImage
    extra = 1
    fields = ['image', 'image_type', 'description']


@admin.register(CherryReception)
class CherryReceptionAdmin(admin.ModelAdmin):
    list_display = [
        'reception_code', 'supplier', 'weight_qq', 'quality',
        'status', 'ocr_processed', 'reception_date'
    ]
    list_filter = ['status', 'quality', 'ocr_processed', 'reception_date', 'supplier']
    search_fields = ['reception_code', 'supplier__name', 'observations']
    readonly_fields = [
        'reception_code', 'weight_lbs', 'ocr_raw_text', 
        'ocr_confidence', 'ocr_processed', 'reception_date'
    ]
    inlines = [CherryReceptionImageInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('reception_code', 'supplier', 'received_by', 'status')
        }),
        ('Peso', {
            'fields': ('scale_image', 'weight_qq', 'weight_lbs', 'manual_correction')
        }),
        ('Calidad', {
            'fields': ('quality', 'observations')
        }),
        ('Datos OCR', {
            'fields': ('ocr_processed', 'ocr_confidence', 'ocr_raw_text'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('reception_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing
            return self.readonly_fields + ['created_at', 'updated_at']
        return self.readonly_fields


@admin.register(CherryReceptionImage)
class CherryReceptionImageAdmin(admin.ModelAdmin):
    list_display = ['reception', 'image_type', 'description', 'uploaded_at']
    list_filter = ['image_type', 'uploaded_at']
    search_fields = ['reception__reception_code', 'description']

