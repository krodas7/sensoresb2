from rest_framework import serializers
from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'type', 'type_display', 'contact_person', 'notes', 
                  'status', 'status_display', 'rating', 'total_deliveries', 'total_weight', 
                  'is_verified', 'registration_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'rating', 'total_deliveries', 'total_weight', 
                            'is_verified', 'registration_date', 'created_at', 'updated_at']

