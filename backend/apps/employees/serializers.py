from rest_framework import serializers
from .models import Employee, Shift, ShiftAssignment, Supervisor


class SupervisorSerializer(serializers.ModelSerializer):
    shift_type_display = serializers.CharField(source='get_shift_type_display', read_only=True)
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Supervisor
        fields = ['id', 'name', 'shift_type', 'shift_type_display', 'phone', 'email', 'is_active', 'employee_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class EmployeeSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source='supervisor.name', read_only=True)
    supervisor_shift = serializers.CharField(source='supervisor.get_shift_type_display', read_only=True)
    
    class Meta:
        model = Employee
        fields = ['id', 'name', 'dpi', 'position', 'is_active', 'fingerprint_template_id', 
                  'photo_url', 'phone', 'email', 'address', 'birth_date', 'salary', 
                  'supervisor', 'supervisor_name', 'supervisor_shift', 'assigned_area', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ShiftAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftAssignment
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
