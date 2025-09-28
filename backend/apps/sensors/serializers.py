"""
Serializers for sensors
"""

from rest_framework import serializers
from .models import Sensor
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
