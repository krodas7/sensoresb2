from django.contrib import admin
from .models import Fermentation, FermentationMeasurement


@admin.register(Fermentation)
class FermentationAdmin(admin.ModelAdmin):
    list_display = ('lot', 'start_time', 'target_hours', 'status', 'responsible')
    list_filter = ('status', 'start_time')
    search_fields = ('lot__code', 'responsible')


@admin.register(FermentationMeasurement)
class FermentationMeasurementAdmin(admin.ModelAdmin):
    list_display = ('fermentation', 'timestamp', 'ph', 'temperature')
    list_filter = ('timestamp',)
    search_fields = ('fermentation__lot__code',)
