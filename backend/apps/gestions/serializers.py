from rest_framework import serializers
from .models import MaterialRequest, Material, FoodTicket, FoodTicketEmployee, PaymentTicket


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'name', 'description', 'quantity', 'unit', 'estimated_price', 'actual_price', 'supplier']


class MaterialRequestSerializer(serializers.ModelSerializer):
    materials = MaterialSerializer(many=True, read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = MaterialRequest
        fields = ['id', 'type', 'type_display', 'title', 'description', 'materials',
                  'requested_by', 'requested_date', 'priority', 'priority_display',
                  'status', 'status_display', 'approved_by', 'approved_date',
                  'completed_date', 'estimated_cost', 'actual_cost', 'notes',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FoodTicketEmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodTicketEmployee
        fields = ['id', 'employee_name', 'employee_id']


class FoodTicketSerializer(serializers.ModelSerializer):
    employees = FoodTicketEmployeeSerializer(many=True, read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = FoodTicket
        fields = ['id', 'shift', 'shift_display', 'date', 'employees', 'meal_type',
                  'meal_type_display', 'unit_cost', 'total_amount', 'employee_count',
                  'description', 'status', 'status_display', 'approved_by', 'approved_date',
                  'paid_date', 'payment_reference', 'payment_method', 'payment_method_display',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentTicketSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = PaymentTicket
        fields = ['id', 'type', 'type_display', 'worker_name', 'worker_id',
                  'work_description', 'hours', 'days', 'rate_per_hour', 'rate_per_day',
                  'total_amount', 'work_date', 'status', 'status_display',
                  'approved_by', 'approved_date', 'paid_date', 'payment_reference',
                  'payment_method', 'payment_method_display', 'notes',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

