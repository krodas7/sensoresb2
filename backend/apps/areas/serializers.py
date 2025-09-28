"""
Serializers for areas
"""

from rest_framework import serializers
from .models import Area


class AreaSerializer(serializers.ModelSerializer):
    """Area serializer"""
    current_occupation = serializers.ReadOnlyField()
    current_lot = serializers.ReadOnlyField()
    
    class Meta:
        model = Area
        fields = [
            'id', 'name', 'area_type', 'capacity', 'description', 
            'is_active', 'current_occupation', 'current_lot', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'current_occupation', 'current_lot']


class AreaListSerializer(serializers.ModelSerializer):
    """Simplified area serializer for lists"""
    
    class Meta:
        model = Area
        fields = ['id', 'name', 'area_type', 'capacity', 'is_active']
