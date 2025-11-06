"""
Admin configuration for sensors
"""

from django.contrib import admin
from .models import Sensor, RaspberryPi, Recipiente, Medicion, SensorTemperatura, MedicionTemperatura


@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    """Sensor admin"""
    
    list_display = ('code', 'sensor_type', 'area', 'is_active', 'status', 'last_reading_time', 'last_reading_value')
    list_filter = ('sensor_type', 'is_active', 'area', 'created_at')
    search_fields = ('code', 'description', 'location')
    readonly_fields = ('last_reading_time', 'last_reading_value', 'created_at', 'updated_at', 'status', 'is_online')
    
    fieldsets = (
        (None, {'fields': ('code', 'sensor_type', 'area', 'location', 'description', 'is_active')}),
        ('Estado', {'fields': ('status', 'is_online', 'last_reading_time', 'last_reading_value')}),
        ('Fechas', {'fields': ('created_at', 'updated_at')}),
    )
    
    def status(self, obj):
        return obj.status
    status.short_description = 'Estado'
    
    def is_online(self, obj):
        return obj.is_online
    is_online.short_description = 'En Línea'
    is_online.boolean = True


@admin.register(RaspberryPi)
class RaspberryPiAdmin(admin.ModelAdmin):
    """Raspberry Pi admin"""
    
    list_display = ('nombre', 'ip_address', 'ubicacion', 'activa', 'ultima_conexion', 'fecha_creacion')
    list_filter = ('activa', 'fecha_creacion')
    search_fields = ('nombre', 'ip_address', 'ubicacion')
    readonly_fields = ('fecha_creacion', 'ultima_conexion')


@admin.register(Recipiente)
class RecipienteAdmin(admin.ModelAdmin):
    """Recipiente admin"""
    
    list_display = ('nombre', 'tipo', 'raspberry', 'activo', 'pin_trig', 'pin_echo', 'pin_cs')
    list_filter = ('tipo', 'activo', 'raspberry')
    search_fields = ('nombre', 'raspberry__nombre')
    readonly_fields = ('fecha_creacion',)
    
    fieldsets = (
        (None, {'fields': ('raspberry', 'nombre', 'tipo', 'activo')}),
        ('Sensores de Distancia (HC-SR04)', {
            'fields': ('pin_trig', 'pin_echo', 'distancia_sensor', 'profundidad', 'distancia_vacia', 'distancia_llena')
        }),
        ('Sensores de Temperatura (MAX6675)', {
            'fields': ('pin_cs', 'spi_bus', 'spi_device', 'temp_min', 'temp_max', 'temp_warning')
        }),
        ('Fechas', {'fields': ('fecha_creacion',)}),
    )


@admin.register(Medicion)
class MedicionAdmin(admin.ModelAdmin):
    """Medicion admin"""
    
    list_display = ('recipiente', 'distancia_cm', 'porcentaje_llenado', 'estado', 'raspberry_ip', 'timestamp')
    list_filter = ('estado', 'recipiente__tipo', 'timestamp')
    search_fields = ('recipiente__nombre', 'raspberry_ip')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'


@admin.register(SensorTemperatura)
class SensorTemperaturaAdmin(admin.ModelAdmin):
    """Sensor Temperatura admin"""
    
    list_display = ('nombre', 'raspberry', 'pin_cs', 'ubicacion', 'activo', 'fecha_creacion')
    list_filter = ('activo', 'raspberry')
    search_fields = ('nombre', 'ubicacion', 'raspberry__nombre')
    readonly_fields = ('fecha_creacion',)


@admin.register(MedicionTemperatura)
class MedicionTemperaturaAdmin(admin.ModelAdmin):
    """Medicion Temperatura admin"""
    
    list_display = ('sensor', 'temperatura', 'estado', 'raspberry_ip', 'timestamp')
    list_filter = ('estado', 'timestamp')
    search_fields = ('sensor__nombre', 'raspberry_ip')
    readonly_fields = ('timestamp',)
    date_hierarchy = 'timestamp'
