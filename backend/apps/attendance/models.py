from django.db import models
from django.db.models import Q, Sum, F
from django.utils import timezone
from datetime import timedelta, datetime
from apps.employees.models import Employee
from apps.core.models import User


class AttendanceRecord(models.Model):
    TYPE_CHOICES = [
        ('IN', 'Entrada'),
        ('OUT', 'Salida'),
    ]
    
    ORIGIN_CHOICES = [
        ('fingerprint', 'Huella'),
        ('manual', 'Manual'),
    ]
    
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attendance_records')
    timestamp = models.DateTimeField(verbose_name='Timestamp')
    record_type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='Tipo')
    origin = models.CharField(max_length=20, choices=ORIGIN_CHOICES, verbose_name='Origen')
    is_valid = models.BooleanField(default=True, verbose_name='Válido')
    observations = models.CharField(max_length=500, blank=True, verbose_name='Observaciones')
    device_id = models.CharField(max_length=100, blank=True, verbose_name='ID Dispositivo')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Registro de Asistencia'
        verbose_name_plural = 'Registros de Asistencia'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['employee', '-timestamp']),
            models.Index(fields=['employee', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.employee.name} - {self.get_record_type_display()} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    @staticmethod
    def calculate_worked_hours(employee_id, date):
        """Calcula las horas trabajadas de un empleado en una fecha"""
        start_of_day = datetime.combine(date, datetime.min.time())
        end_of_day = datetime.combine(date, datetime.max.time())
        
        records = AttendanceRecord.objects.filter(
            employee_id=employee_id,
            timestamp__gte=start_of_day,
            timestamp__lte=end_of_day,
            is_valid=True
        ).order_by('timestamp')
        
        if not records.exists():
            return None
        
        total_hours = 0
        check_in = None
        
        for record in records:
            if record.record_type == 'IN':
                check_in = record.timestamp
            elif record.record_type == 'OUT' and check_in:
                delta = record.timestamp - check_in
                total_hours += delta.total_seconds() / 3600
                check_in = None
        
        return round(total_hours, 2)
    
    @staticmethod
    def calculate_overtime_hours(worked_hours, regular_hours=8):
        """Calcula horas extras (más de 8 horas)"""
        return max(0, round(worked_hours - regular_hours, 2))
    
    @staticmethod
    def get_employee_attendance_summary(employee_id, start_date, end_date):
        """Obtiene resumen de asistencia de un empleado en un rango de fechas"""
        records = AttendanceRecord.objects.filter(
            employee_id=employee_id,
            timestamp__date__gte=start_date,
            timestamp__date__lte=end_date,
            is_valid=True
        ).order_by('timestamp')
        
        summary = {
            'days_worked': 0,
            'total_hours': 0,
            'total_overtime': 0,
            'attendance_rate': 0,
            'details': []
        }
        
        current_date = None
        current_day_records = []
        
        for record in records:
            record_date = record.timestamp.date()
            
            if current_date != record_date:
                if current_date and current_day_records:
                    worked_hours = AttendanceRecord._calculate_day_hours(current_day_records)
                    overtime_hours = AttendanceRecord.calculate_overtime_hours(worked_hours)
                    
                    summary['days_worked'] += 1
                    summary['total_hours'] += worked_hours
                    summary['total_overtime'] += overtime_hours
                    
                    summary['details'].append({
                        'date': current_date,
                        'hours': worked_hours,
                        'overtime': overtime_hours
                    })
                
                current_date = record_date
                current_day_records = [record]
            else:
                current_day_records.append(record)
        
        # Procesar último día
        if current_date and current_day_records:
            worked_hours = AttendanceRecord._calculate_day_hours(current_day_records)
            overtime_hours = AttendanceRecord.calculate_overtime_hours(worked_hours)
            
            summary['days_worked'] += 1
            summary['total_hours'] += worked_hours
            summary['total_overtime'] += overtime_hours
            
            summary['details'].append({
                'date': current_date,
                'hours': worked_hours,
                'overtime': overtime_hours
            })
        
        # Calcular tasa de asistencia
        total_days = (end_date - start_date).days + 1
        summary['attendance_rate'] = round((summary['days_worked'] / total_days * 100) if total_days > 0 else 0, 2)
        
        # Redondear totales
        summary['total_hours'] = round(summary['total_hours'], 2)
        summary['total_overtime'] = round(summary['total_overtime'], 2)
        
        return summary
    
    @staticmethod
    def _calculate_day_hours(records):
        """Calcula horas de un día específico basándose en los registros"""
        total_hours = 0
        check_in = None
        
        for record in records:
            if record.record_type == 'IN':
                check_in = record.timestamp
            elif record.record_type == 'OUT' and check_in:
                delta = record.timestamp - check_in
                total_hours += delta.total_seconds() / 3600
                check_in = None
        
        return round(total_hours, 2)
