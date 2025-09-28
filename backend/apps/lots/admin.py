from django.contrib import admin
from .models import Lot


@admin.register(Lot)
class LotAdmin(admin.ModelAdmin):
    list_display = ('code', 'finca', 'variety', 'status', 'current_area', 'created_at')
    list_filter = ('status', 'current_area', 'created_at')
    search_fields = ('code', 'finca', 'variety', 'responsible')
    readonly_fields = ('created_at', 'updated_at')
