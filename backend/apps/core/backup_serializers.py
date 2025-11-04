"""
Serializers para el sistema de backup
"""
from rest_framework import serializers
from .backup_models import BackupRecord, BackupSchedule


class BackupRecordSerializer(serializers.ModelSerializer):
    """Serializer para BackupRecord"""
    
    initiated_by_name = serializers.CharField(source='initiated_by.get_full_name', read_only=True)
    file_size_mb = serializers.ReadOnlyField()
    is_successful = serializers.ReadOnlyField()
    backup_type_display = serializers.CharField(source='get_backup_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BackupRecord
        fields = [
            'id', 'backup_type', 'backup_type_display', 'status', 'status_display',
            'file_path', 'file_size', 'file_size_mb', 's3_url',
            'started_at', 'completed_at', 'duration',
            'task_id', 'error_message', 'initiated_by', 'initiated_by_name',
            'created_at', 'updated_at', 'is_successful'
        ]
        read_only_fields = [
            'file_path', 'file_size', 's3_url', 'started_at', 'completed_at',
            'duration', 'task_id', 'error_message', 'created_at', 'updated_at'
        ]


class BackupScheduleSerializer(serializers.ModelSerializer):
    """Serializer para BackupSchedule"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    backup_type_display = serializers.CharField(source='get_backup_type_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    class Meta:
        model = BackupSchedule
        fields = [
            'id', 'name', 'backup_type', 'backup_type_display',
            'frequency', 'frequency_display', 'hour', 'minute',
            'is_active', 'upload_to_s3', 'retention_days',
            'last_run', 'next_run', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'last_run', 'next_run', 'created_at', 'updated_at']
    
    def validate_hour(self, value):
        """Validar hora"""
        if not (0 <= value <= 23):
            raise serializers.ValidationError("La hora debe estar entre 0 y 23")
        return value
    
    def validate_minute(self, value):
        """Validar minuto"""
        if not (0 <= value <= 59):
            raise serializers.ValidationError("El minuto debe estar entre 0 y 59")
        return value
    
    def validate_retention_days(self, value):
        """Validar días de retención"""
        if value < 1:
            raise serializers.ValidationError("Los días de retención deben ser al menos 1")
        return value


class BackupStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de backup"""
    
    total_backups = serializers.IntegerField()
    successful_backups = serializers.IntegerField()
    failed_backups = serializers.IntegerField()
    total_size = serializers.IntegerField()
    total_size_mb = serializers.SerializerMethodField()
    success_rate = serializers.SerializerMethodField()
    
    def get_total_size_mb(self, obj):
        """Tamaño total en MB"""
        if obj.get('total_size'):
            return round(obj['total_size'] / (1024 * 1024), 2)
        return 0
    
    def get_success_rate(self, obj):
        """Tasa de éxito"""
        total = obj.get('total_backups', 0)
        successful = obj.get('successful_backups', 0)
        if total > 0:
            return round((successful / total) * 100, 2)
        return 0


class BackupTaskSerializer(serializers.Serializer):
    """Serializer para tareas de backup"""
    
    task_id = serializers.CharField()
    status = serializers.CharField()
    backup_type = serializers.CharField()
    started_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)
    duration = serializers.DurationField(allow_null=True)
    file_size = serializers.IntegerField(allow_null=True)
    error_message = serializers.CharField(allow_null=True)

