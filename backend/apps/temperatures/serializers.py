"""
Serializers for temperatures
"""

from rest_framework import serializers
from .models import Reading
from apps.sensors.serializers import SensorListSerializer


class ReadingSerializer(serializers.ModelSerializer):
    """Reading serializer"""
    sensor_info = SensorListSerializer(source='sensor', read_only=True)
    
    class Meta:
        model = Reading
        fields = [
            'id', 'sensor', 'sensor_info', 'timestamp', 'value', 
            'unit', 'quality', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReadingCreateSerializer(serializers.ModelSerializer):
    """Reading creation serializer"""
    
    class Meta:
        model = Reading
        fields = ['sensor', 'timestamp', 'value', 'unit', 'quality']


class ReadingBatchCreateSerializer(serializers.Serializer):
    """Batch reading creation serializer"""
    readings = ReadingCreateSerializer(many=True)
    
    def create(self, validated_data):
        readings_data = validated_data['readings']
        readings = []
        
        for reading_data in readings_data:
            reading = Reading.objects.create(**reading_data)
            readings.append(reading)
        
        return {'readings': readings}


class TemperatureSummarySerializer(serializers.Serializer):
    """Temperature summary serializer"""
    sensor_id = serializers.IntegerField()
    sensor_code = serializers.CharField()
    area_name = serializers.CharField()
    current_value = serializers.FloatField()
    unit = serializers.CharField()
    timestamp = serializers.DateTimeField()
    status = serializers.CharField()
    trend = serializers.CharField()  # 'up', 'down', 'stable'
