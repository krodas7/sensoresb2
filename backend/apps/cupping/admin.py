from django.contrib import admin
from .models import (
    Cupping, CuppingSample, Cupper, CuppingScore, 
    CuppingDescriptor, CuppingSessionParticipant
)


@admin.register(Cupping)
class CuppingAdmin(admin.ModelAdmin):
    list_display = ('name', 'protocol', 'status', 'date', 'creator', 'is_calibration')
    list_filter = ('protocol', 'status', 'blinding', 'is_calibration', 'date')
    search_fields = ('name', 'creator__email', 'description')
    readonly_fields = ('created_at', 'updated_at', 'opened_at', 'closed_at')


@admin.register(CuppingSample)
class CuppingSampleAdmin(admin.ModelAdmin):
    list_display = ('blind_code', 'origin', 'variety', 'cupping', 'order')
    list_filter = ('cupping__date', 'process', 'harvest')
    search_fields = ('blind_code', 'origin', 'variety', 'cupping__name')
    ordering = ('cupping', 'order', 'blind_code')


@admin.register(Cupper)
class CupperAdmin(admin.ModelAdmin):
    list_display = ('name', 'role', 'user', 'is_active')
    list_filter = ('role', 'is_active')
    search_fields = ('name', 'user__email')


@admin.register(CuppingScore)
class CuppingScoreAdmin(admin.ModelAdmin):
    list_display = ('sample', 'cupper', 'total_score', 'overall', 'created_at')
    list_filter = ('created_at', 'sample__cupping__date')
    search_fields = ('sample__blind_code', 'cupper__name')
    readonly_fields = ('total_score', 'created_at', 'updated_at')


@admin.register(CuppingDescriptor)
class CuppingDescriptorAdmin(admin.ModelAdmin):
    list_display = ('descriptor', 'intensity', 'polarity', 'sample', 'cupper')
    list_filter = ('polarity', 'intensity', 'created_at')
    search_fields = ('descriptor', 'sample__blind_code', 'cupper__name')


@admin.register(CuppingSessionParticipant)
class CuppingSessionParticipantAdmin(admin.ModelAdmin):
    list_display = ('cupper', 'cupping', 'joined_at', 'is_active')
    list_filter = ('is_active', 'joined_at', 'cupping__date')
    search_fields = ('cupper__name', 'cupping__name')
