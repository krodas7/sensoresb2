"""
Serializers for occupation
"""

from rest_framework import serializers
from .models import Occupation
from apps.areas.serializers import AreaListSerializer


class OccupationSerializer(serializers.ModelSerializer):
    """Occupation serializer"""
    area_info = AreaListSerializer(source='area', read_only=True)
    lot_code = serializers.CharField(source='lot.codigo', read_only=True)
    duration = serializers.ReadOnlyField()
    
    class Meta:
        model = Occupation
        fields = [
            'id', 'area', 'area_info', 'lot', 'lot_code', 'status', 
            'reason', 'timestamp', 'is_automatic', 'duration', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'duration']


class OccupationCreateSerializer(serializers.ModelSerializer):
    """Occupation creation serializer"""
    
    class Meta:
        model = Occupation
        fields = ['area', 'lot', 'status', 'reason', 'timestamp', 'is_automatic']


class OccupationSummarySerializer(serializers.Serializer):
    """Occupation summary serializer"""
    area_id = serializers.IntegerField()
    area_name = serializers.CharField()
    area_type = serializers.CharField()
    status = serializers.CharField()
    lot_code = serializers.CharField(allow_null=True)
    lot_finca = serializers.CharField(allow_null=True)
    timestamp = serializers.DateTimeField()
    duration = serializers.DurationField(allow_null=True)
    is_automatic = serializers.BooleanField()
