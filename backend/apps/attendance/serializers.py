from rest_framework import serializers
from .models import AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    employee_position = serializers.CharField(source='employee.position', read_only=True)
    
    class Meta:
        model = AttendanceRecord
        fields = ['id', 'employee', 'employee_name', 'employee_position', 'timestamp', 
                  'record_type', 'origin', 'is_valid', 'observations', 'device_id', 'created_at']
        read_only_fields = ['id', 'created_at']
