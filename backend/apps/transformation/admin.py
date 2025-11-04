from django.contrib import admin
from .models import Transformation, TransformationImage


class TransformationImageInline(admin.TabularInline):
    model = TransformationImage
    extra = 1
    fields = ['image', 'image_type', 'description']


@admin.register(Transformation)
class TransformationAdmin(admin.ModelAdmin):
    list_display = [
        'transformation_code', 'lot', 'weight_qq', 'yield_percentage',
        'status', 'ocr_processed', 'transformation_date'
    ]
    list_filter = ['status', 'ocr_processed', 'transformation_date', 'lot']
    search_fields = ['transformation_code', 'lot__code', 'observations']
    readonly_fields = [
        'transformation_code', 'weight_lbs', 'ocr_raw_text',
        'ocr_weight_confidence', 'ocr_yield_confidence',
        'ocr_processed', 'transformation_date'
    ]
    inlines = [TransformationImageInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('transformation_code', 'lot', 'processed_by', 'status')
        }),
        ('Datos de Transformación', {
            'fields': (
                'voucher_image', 'weight_qq', 'weight_lbs',
                'yield_percentage', 'manual_correction'
            )
        }),
        ('Datos OCR', {
            'fields': (
                'ocr_processed', 'ocr_weight_confidence',
                'ocr_yield_confidence', 'ocr_raw_text'
            ),
            'classes': ('collapse',)
        }),
        ('Observaciones', {
            'fields': ('observations',)
        }),
        ('Fechas', {
            'fields': ('transformation_date', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ['created_at', 'updated_at']
        return self.readonly_fields


@admin.register(TransformationImage)
class TransformationImageAdmin(admin.ModelAdmin):
    list_display = ['transformation', 'image_type', 'description', 'uploaded_at']
    list_filter = ['image_type', 'uploaded_at']
    search_fields = ['transformation__transformation_code', 'description']

