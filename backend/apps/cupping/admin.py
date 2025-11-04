"""
Admin mejorado para módulo de catación con import/export y acciones personalizadas
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.http import HttpResponse
from import_export.admin import ImportExportModelAdmin
from .models import (
    Cupping, CuppingSample, Cupper, CuppingScore, 
    CuppingDescriptor, CuppingSessionParticipant, CommercialCupping
)
from .resources import (
    CuppingResource, CuppingSampleResource, CupperResource,
    CuppingScoreResource, CommercialCuppingResource
)
import csv
from datetime import datetime


# Inline para muestras en sesión de catación
class CuppingSampleInline(admin.TabularInline):
    model = CuppingSample
    extra = 1
    fields = ('blind_code', 'lot', 'variety', 'process', 'order')
    ordering = ('order',)


# Inline para participantes
class CuppingSessionParticipantInline(admin.TabularInline):
    model = CuppingSessionParticipant
    extra = 1
    fields = ('cupper', 'is_active', 'joined_at')
    readonly_fields = ('joined_at',)


# Acciones personalizadas
def export_to_csv(modeladmin, request, queryset):
    """Exportar a CSV"""
    opts = modeladmin.model._meta
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename={opts.verbose_name_plural}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    writer = csv.writer(response)
    fields = [field for field in opts.get_fields() if not field.many_to_many and not field.one_to_many]
    
    # Write header
    writer.writerow([field.verbose_name for field in fields])
    
    # Write data
    for obj in queryset:
        writer.writerow([str(getattr(obj, field.name)) for field in fields])
    
    return response

export_to_csv.short_description = "📥 Exportar seleccionados a CSV"


def mark_as_approved(modeladmin, request, queryset):
    """Marcar como aprobado"""
    updated = queryset.update(estado='aprobado')
    modeladmin.message_user(request, f'{updated} cataciones marcadas como aprobadas.')

mark_as_approved.short_description = "✅ Marcar como Aprobado"


def mark_as_rejected(modeladmin, request, queryset):
    """Marcar como rechazado"""
    updated = queryset.update(estado='rechazado')
    modeladmin.message_user(request, f'{updated} cataciones marcadas como rechazadas.')

mark_as_rejected.short_description = "❌ Marcar como Rechazado"


def open_cupping_session(modeladmin, request, queryset):
    """Abrir sesión de catación"""
    from django.utils import timezone
    updated = queryset.filter(status='draft').update(status='open', opened_at=timezone.now())
    modeladmin.message_user(request, f'{updated} sesiones abiertas.')

open_cupping_session.short_description = "▶️ Abrir Sesión"


def close_cupping_session(modeladmin, request, queryset):
    """Cerrar sesión de catación"""
    from django.utils import timezone
    updated = queryset.filter(status='open').update(status='closed', closed_at=timezone.now())
    modeladmin.message_user(request, f'{updated} sesiones cerradas.')

close_cupping_session.short_description = "⏹️ Cerrar Sesión"


@admin.register(Cupping)
class CuppingAdmin(ImportExportModelAdmin):
    resource_class = CuppingResource
    
    list_display = ('name', 'protocol_badge', 'status_badge', 'date', 'creator', 
                   'samples_count', 'avg_score', 'is_calibration')
    list_filter = ('protocol', 'status', 'blinding', 'is_calibration', 'date', 'language')
    search_fields = ('name', 'creator__username', 'description')
    readonly_fields = ('created_at', 'updated_at', 'opened_at', 'closed_at')
    date_hierarchy = 'date'
    
    # Inlines
    inlines = [CuppingSampleInline, CuppingSessionParticipantInline]
    
    # Acciones
    actions = [export_to_csv, open_cupping_session, close_cupping_session]
    
    # Fieldsets
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'protocol', 'date', 'status', 'creator')
        }),
        ('Configuración', {
            'fields': ('blinding', 'label_type', 'language', 'is_calibration', 'is_realtime'),
            'classes': ('collapse',)
        }),
        ('Descripción', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at', 'opened_at', 'closed_at'),
            'classes': ('collapse',)
        }),
    )
    
    def protocol_badge(self, obj):
        colors = {
            'sca': 'bg-blue-500',
            'coe': 'bg-green-500',
            'custom': 'bg-purple-500'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.protocol, 'gray'),
            obj.get_protocol_display()
        )
    protocol_badge.short_description = 'Protocolo'
    
    def status_badge(self, obj):
        colors = {
            'draft': '#6c757d',
            'open': '#28a745',
            'closed': '#dc3545'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.status, 'gray'),
            obj.get_status_display()
        )
    status_badge.short_description = 'Estado'
    
    def samples_count(self, obj):
        count = obj.samples.count()
        return format_html(
            '<strong style="color: #007bff;">{}</strong> muestras',
            count
        )
    samples_count.short_description = 'Muestras'
    
    def avg_score(self, obj):
        from django.db.models import Avg
        avg = CuppingScore.objects.filter(sample__cupping=obj).aggregate(Avg('overall'))['overall__avg']
        if avg:
            return format_html(
                '<strong style="color: #28a745;">{:.2f}</strong>',
                avg
            )
        return '-'
    avg_score.short_description = 'Promedio'


@admin.register(CuppingSample)
class CuppingSampleAdmin(ImportExportModelAdmin):
    resource_class = CuppingSampleResource
    
    list_display = ('blind_code', 'cupping_link', 'lot', 'variety', 
                   'process', 'scores_count', 'order')
    list_filter = ('cupping__date', 'process', 'variety')
    search_fields = ('blind_code', 'origin', 'variety', 'cupping__name')
    ordering = ('cupping', 'order', 'blind_code')
    
    actions = [export_to_csv]
    
    def cupping_link(self, obj):
        url = reverse('admin:cupping_cupping_change', args=[obj.cupping.id])
        return format_html('<a href="{}">{}</a>', url, obj.cupping.name)
    cupping_link.short_description = 'Sesión'
    
    def scores_count(self, obj):
        count = obj.scores.count()
        return format_html(
            '<span style="background: #17a2b8; color: white; padding: 2px 6px; border-radius: 3px;">{}</span>',
            count
        )
    scores_count.short_description = 'Evaluaciones'


@admin.register(Cupper)
class CupperAdmin(ImportExportModelAdmin):
    resource_class = CupperResource
    
    list_display = ('name', 'role_badge', 'user', 'is_active', 'scores_count')
    list_filter = ('role', 'is_active')
    search_fields = ('name', 'user__username', 'user__email')
    
    actions = [export_to_csv]
    
    def role_badge(self, obj):
        colors = {
            'admin': '#dc3545',
            'qc_leader': '#ffc107',
            'taster': '#28a745',
            'guest': '#6c757d'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.role, 'gray'),
            obj.get_role_display()
        )
    role_badge.short_description = 'Rol'
    
    def scores_count(self, obj):
        count = obj.scores.count()
        return format_html('<strong>{}</strong> evaluaciones', count)
    scores_count.short_description = 'Evaluaciones'


@admin.register(CuppingScore)
class CuppingScoreAdmin(ImportExportModelAdmin):
    resource_class = CuppingScoreResource
    
    list_display = ('sample', 'cupper', 'total_score_badge', 'fragrance', 'flavor', 
                   'acidity', 'body', 'overall', 'created_at')
    list_filter = ('created_at', 'sample__cupping__date', 'cupper')
    search_fields = ('sample__blind_code', 'cupper__name', 'notes')
    readonly_fields = ('total_score', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    actions = [export_to_csv]
    
    fieldsets = (
        ('Información', {
            'fields': ('sample', 'cupper')
        }),
        ('Atributos Aromáticos', {
            'fields': ('fragrance', 'aroma'),
        }),
        ('Atributos de Sabor', {
            'fields': ('flavor', 'aftertaste', 'acidity', 'body'),
        }),
        ('Atributos de Calidad', {
            'fields': ('uniformity', 'clean_cup', 'sweetness', 'balance'),
        }),
        ('Evaluación Final', {
            'fields': ('overall', 'defects', 'total_score'),
        }),
        ('Descriptores y Notas', {
            'fields': ('descriptive_scores', 'affective_scores', 'notes'),
            'classes': ('collapse',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def total_score_badge(self, obj):
        score = obj.total_score
        if score >= 85:
            color = '#28a745'  # Green
        elif score >= 80:
            color = '#ffc107'  # Yellow
        else:
            color = '#dc3545'  # Red
        
        return format_html(
            '<strong style="color: {}; font-size: 16px;">{:.2f}</strong>',
            color,
            score
        )
    total_score_badge.short_description = 'Score Total'


@admin.register(CuppingDescriptor)
class CuppingDescriptorAdmin(admin.ModelAdmin):
    list_display = ('descriptor', 'intensity_badge', 'polarity_badge', 'sample', 'cupper')
    list_filter = ('polarity', 'intensity', 'created_at')
    search_fields = ('descriptor', 'sample__blind_code', 'cupper__name')
    
    def intensity_badge(self, obj):
        return format_html(
            '<div style="width: 100px; background: #e0e0e0; border-radius: 3px;">'
            '<div style="width: {}%; background: #007bff; padding: 2px; border-radius: 3px; color: white; text-align: center;">{}</div>'
            '</div>',
            obj.intensity * 10,
            obj.intensity
        )
    intensity_badge.short_description = 'Intensidad'
    
    def polarity_badge(self, obj):
        colors = {'positive': '#28a745', 'neutral': '#ffc107', 'negative': '#dc3545'}
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.polarity, 'gray'),
            obj.polarity.capitalize()
        )
    polarity_badge.short_description = 'Polaridad'


@admin.register(CuppingSessionParticipant)
class CuppingSessionParticipantAdmin(admin.ModelAdmin):
    list_display = ('cupper', 'cupping', 'joined_at', 'is_active')
    list_filter = ('is_active', 'joined_at', 'cupping__date')
    search_fields = ('cupper__name', 'cupping__name')


@admin.register(CommercialCupping)
class CommercialCuppingAdmin(ImportExportModelAdmin):
    resource_class = CommercialCuppingResource
    
    list_display = ('numero_ingreso', 'tipo_badge', 'estado_badge', 'humedad_badge', 
                   'rendimiento_badge', 'fecha_catacion')
    list_filter = ('estado', 'tipo', 'apariencia_verde', 'tueste', 'fecha_catacion')
    search_fields = ('numero_ingreso', 'tipo', 'taza', 'observaciones')
    readonly_fields = ('created_at', 'updated_at')
    date_hierarchy = 'fecha_catacion'
    
    actions = [export_to_csv, mark_as_approved, mark_as_rejected]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('numero_ingreso', 'fecha_catacion', 'tipo', 'estado')
        }),
        ('Análisis Físico', {
            'fields': ('humedad', 'rendimiento', 'apariencia_verde', 'tueste', 'quakers')
        }),
        ('Evaluación', {
            'fields': ('taza', 'observaciones')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def tipo_badge(self, obj):
        colors = {
            'Prima Lavado': '#007bff',
            'Extra Prima': '#28a745',
            'Semi Lavado': '#17a2b8',
            'Natural': '#ffc107',
            'Otro': '#6c757d'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px;">{}</span>',
            colors.get(obj.tipo, '#6c757d'),
            obj.tipo
        )
    tipo_badge.short_description = 'Tipo'
    
    def estado_badge(self, obj):
        colors = {
            'pendiente': '#ffc107',
            'aprobado': '#28a745',
            'rechazado': '#dc3545'
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            colors.get(obj.estado, 'gray'),
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def humedad_badge(self, obj):
        color = '#28a745' if 10 <= obj.humedad <= 12 else '#dc3545'
        return format_html(
            '<strong style="color: {};">{:.2f}%</strong>',
            color,
            obj.humedad
        )
    humedad_badge.short_description = 'Humedad'
    
    def rendimiento_badge(self, obj):
        color = '#28a745' if obj.rendimiento >= 80 else '#dc3545'
        return format_html(
            '<strong style="color: {};">{:.2f}%</strong>',
            color,
            obj.rendimiento
        )
    rendimiento_badge.short_description = 'Rendimiento'
