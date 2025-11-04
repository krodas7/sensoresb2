"""
Tareas automáticas para el módulo de asistencias
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import AttendanceRecord


@shared_task
def cleanup_old_attendance_records():
    """
    Elimina registros de asistencia mayores a 30 días
    Se ejecuta diariamente a la medianoche
    """
    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count, _ = AttendanceRecord.objects.filter(timestamp__lt=cutoff_date).delete()
    
    return {
        'task': 'cleanup_old_attendance_records',
        'deleted_records': deleted_count,
        'cutoff_date': cutoff_date.isoformat()
    }


@shared_task
def generate_daily_attendance_summary():
    """
    Genera resumen diario de asistencia
    Se ejecuta al final del día
    """
    today = timezone.now().date()
    records = AttendanceRecord.objects.filter(timestamp__date=today)
    
    summary = {
        'date': today.isoformat(),
        'total_records': records.count(),
        'check_ins': records.filter(record_type='IN').count(),
        'check_outs': records.filter(record_type='OUT').count(),
        'unique_employees': records.values('employee').distinct().count(),
    }
    
    return summary

