"""
Report serializers for the Sistema de Beneficio
"""

from rest_framework import serializers
from .models import Report, ReportTemplate, ReportSchedule, ReportLog, ReportData


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for Report model"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    file_url = serializers.CharField(source='file_url', read_only=True)
    is_ready = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'name', 'report_type', 'format', 'status',
            'parameters', 'filters', 'start_date', 'end_date',
            'file_path', 'file_size', 'download_count',
            'description', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'generated_at',
            'file_url', 'is_ready'
        ]
        read_only_fields = [
            'created_by', 'file_path', 'file_size', 'download_count',
            'created_at', 'updated_at', 'generated_at'
        ]
    
    def validate_parameters(self, value):
        """Validate parameters based on report type"""
        report_type = self.initial_data.get('report_type')
        
        if report_type == 'daily_production':
            required_fields = ['include_lots', 'include_temperatures']
            for field in required_fields:
                if field not in value:
                    raise serializers.ValidationError(f"Campo requerido para reporte diario: {field}")
        
        elif report_type == 'attendance_summary':
            required_fields = ['employee_ids', 'include_overtime']
            for field in required_fields:
                if field not in value:
                    raise serializers.ValidationError(f"Campo requerido para reporte de asistencia: {field}")
        
        return value
    
    def validate(self, data):
        """Validate report data"""
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError("La fecha de fin debe ser posterior a la fecha de inicio")
        
        return data


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for ReportTemplate model"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'report_type', 'template_type',
            'template_content', 'css_content', 'is_default',
            'is_active', 'description', 'created_by',
            'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class ReportScheduleSerializer(serializers.ModelSerializer):
    """Serializer for ReportSchedule model"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    report_name = serializers.CharField(source='report.name', read_only=True)
    
    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'report', 'report_name', 'name', 'frequency',
            'cron_expression', 'email_recipients', 'is_active',
            'last_run', 'next_run', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate_email_recipients(self, value):
        """Validate email recipients"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Los destinatarios deben ser una lista")
        
        for email in value:
            if '@' not in email:
                raise serializers.ValidationError(f"Email inválido: {email}")
        
        return value


class ReportLogSerializer(serializers.ModelSerializer):
    """Serializer for ReportLog model"""
    
    class Meta:
        model = ReportLog
        fields = [
            'id', 'report', 'level', 'message', 'details', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class ReportDataSerializer(serializers.ModelSerializer):
    """Serializer for ReportData model"""
    
    class Meta:
        model = ReportData
        fields = [
            'id', 'report', 'data', 'cache_key', 'expires_at', 'created_at'
        ]
        read_only_fields = ['cache_key', 'created_at']


class ReportGenerationSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    
    report_type = serializers.ChoiceField(choices=Report.REPORT_TYPES)
    format = serializers.ChoiceField(choices=Report.FORMAT_CHOICES, default='pdf')
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    parameters = serializers.JSONField(default=dict)
    filters = serializers.JSONField(default=dict)
    template_id = serializers.IntegerField(required=False)
    
    def validate(self, data):
        """Validate generation parameters"""
        if data.get('end_date') and data.get('start_date'):
            if data['end_date'] <= data['start_date']:
                raise serializers.ValidationError("La fecha de fin debe ser posterior a la fecha de inicio")
        
        return data


class ReportStatsSerializer(serializers.Serializer):
    """Serializer for report statistics"""
    
    total_reports = serializers.IntegerField()
    completed_reports = serializers.IntegerField()
    failed_reports = serializers.IntegerField()
    total_downloads = serializers.IntegerField()
    most_popular_type = serializers.CharField()
    avg_generation_time = serializers.FloatField()
