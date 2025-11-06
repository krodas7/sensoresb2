"""
Serializers for sensors
"""

from rest_framework import serializers
from .models import (
    Sensor, RaspberryPi, Recipiente, Medicion, 
    SensorTemperatura, MedicionTemperatura
)
from apps.areas.serializers import AreaListSerializer


class SensorSerializer(serializers.ModelSerializer):
    """Sensor serializer"""
    area_name = serializers.CharField(source='area.name', read_only=True)
    area_type = serializers.CharField(source='area.area_type', read_only=True)
    status = serializers.ReadOnlyField()
    is_online = serializers.ReadOnlyField()
    
    class Meta:
        model = Sensor
        fields = [
            'id', 'code', 'sensor_type', 'area', 'area_name', 'area_type',
            'is_active', 'last_reading_time', 'last_reading_value', 'location',
            'description', 'status', 'is_online', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'last_reading_time', 'last_reading_value', 
            'created_at', 'updated_at', 'status', 'is_online'
        ]


class SensorListSerializer(serializers.ModelSerializer):
    """Simplified sensor serializer for lists"""
    area_name = serializers.CharField(source='area.name', read_only=True)
    status = serializers.ReadOnlyField()
    
    class Meta:
        model = Sensor
        fields = ['id', 'code', 'sensor_type', 'area', 'area_name', 'is_active', 'status']


# === Serializers para el sistema de monitoreo IoT (Raspberry Pi) ===

class RaspberryPiSerializer(serializers.ModelSerializer):
    """Serializer para Raspberry Pi"""
    
    class Meta:
        model = RaspberryPi
        fields = ['id', 'nombre', 'ip_address', 'ubicacion', 'activa', 'fecha_creacion', 'ultima_conexion']
        read_only_fields = ['fecha_creacion', 'ultima_conexion']


class RecipienteSerializer(serializers.ModelSerializer):
    """Serializer para Recipientes (Pilas de Fermentación/Secado)"""
    raspberry_nombre = serializers.CharField(source='raspberry.nombre', read_only=True)
    raspberry_ip = serializers.CharField(source='raspberry.ip_address', read_only=True)
    max_distancia = serializers.ReadOnlyField()
    
    class Meta:
        model = Recipiente
        fields = [
            'id', 'raspberry', 'raspberry_nombre', 'raspberry_ip', 'nombre', 'tipo',
            'pin_trig', 'pin_echo', 'distancia_sensor', 'profundidad', 
            'distancia_vacia', 'distancia_llena',
            'pin_cs', 'spi_bus', 'spi_device', 'temp_min', 'temp_max', 'temp_warning',
            'activo', 'fecha_creacion', 'max_distancia'
        ]
        read_only_fields = ['fecha_creacion', 'max_distancia']


class MedicionSerializer(serializers.ModelSerializer):
    """Serializer para Mediciones de distancia/llenado"""
    recipiente_nombre = serializers.CharField(source='recipiente.nombre', read_only=True)
    raspberry_nombre = serializers.CharField(source='recipiente.raspberry.nombre', read_only=True)
    tipo_recipiente = serializers.CharField(source='recipiente.tipo', read_only=True)
    
    class Meta:
        model = Medicion
        fields = [
            'id', 'recipiente', 'recipiente_nombre', 'raspberry_nombre', 'tipo_recipiente',
            'distancia_cm', 'porcentaje_llenado', 'estado', 'timestamp', 'raspberry_ip'
        ]
        read_only_fields = ['timestamp']


class MedicionCreateSerializer(serializers.Serializer):
    """Serializer para recibir datos de mediciones desde Raspberry Pi"""
    raspberry_ip = serializers.IPAddressField()
    mediciones = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    
    def validate_mediciones(self, value):
        """Valida que cada medición tenga los campos requeridos"""
        for medicion in value:
            required_fields = ['recipiente', 'distancia']
            for field in required_fields:
                if field not in medicion:
                    raise serializers.ValidationError(f"Campo '{field}' requerido en medición")
        return value


class SensorTemperaturaSerializer(serializers.ModelSerializer):
    """Serializer para Sensores de Temperatura (Guardiolas)"""
    raspberry_nombre = serializers.CharField(source='raspberry.nombre', read_only=True)
    raspberry_ip = serializers.CharField(source='raspberry.ip_address', read_only=True)
    
    class Meta:
        model = SensorTemperatura
        fields = [
            'id', 'raspberry', 'raspberry_nombre', 'raspberry_ip', 'nombre',
            'pin_cs', 'ubicacion', 'activo', 'fecha_creacion'
        ]
        read_only_fields = ['fecha_creacion']


class MedicionTemperaturaSerializer(serializers.ModelSerializer):
    """Serializer para Mediciones de Temperatura"""
    sensor_nombre = serializers.CharField(source='sensor.nombre', read_only=True)
    raspberry_nombre = serializers.CharField(source='sensor.raspberry.nombre', read_only=True)
    
    class Meta:
        model = MedicionTemperatura
        fields = [
            'id', 'sensor', 'sensor_nombre', 'raspberry_nombre',
            'temperatura', 'estado', 'timestamp', 'raspberry_ip'
        ]
        read_only_fields = ['timestamp']


class TemperaturaCreateSerializer(serializers.Serializer):
    """Serializer para recibir datos de temperatura desde Raspberry Pi"""
    raspberry_ip = serializers.IPAddressField()
    mediciones = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )
    tipo = serializers.CharField(default='temperatura')
    
    def validate_mediciones(self, value):
        """Valida que cada medición tenga los campos requeridos"""
        for medicion in value:
            required_fields = ['sensor', 'temperatura', 'estado']
            for field in required_fields:
                if field not in medicion:
                    raise serializers.ValidationError(f"Campo '{field}' requerido en medición de temperatura")
        return value
