from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import AttendanceRecord
from .serializers import AttendanceRecordSerializer


class AttendanceRecordListCreateView(generics.ListCreateAPIView):
    queryset = AttendanceRecord.objects.select_related('employee').all()
    serializer_class = AttendanceRecordSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por fecha si se proporciona
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(timestamp__date=date)
        
        # Filtrar por empleado
        employee_id = self.request.query_params.get('employee')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        
        # Filtrar por tipo
        record_type = self.request.query_params.get('type')
        if record_type:
            queryset = queryset.filter(record_type=record_type)
        
        return queryset.order_by('-timestamp')


@api_view(['GET'])
def DepartmentAttendanceView(request):
    """Get attendance summary by department"""
    try:
        department = request.query_params.get('department')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Build query
        query = Q()
        if department:
            query &= Q(employee__department=department)
        if start_date:
            query &= Q(timestamp__date__gte=start_date)
        if end_date:
            query &= Q(timestamp__date__lte=end_date)
        
        # Get records
        records = AttendanceRecord.objects.filter(query)
        
        # Calculate summary
        total_records = records.count()
        check_ins = records.filter(record_type='IN').count()
        check_outs = records.filter(record_type='OUT').count()
        unique_employees = records.values('employee').distinct().count()
        
        return Response({
            'department': department or 'All',
            'total_records': total_records,
            'check_ins': check_ins,
            'check_outs': check_outs,
            'unique_employees': unique_employees,
            'attendance_rate': (check_ins / unique_employees * 100) if unique_employees > 0 else 0
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def employee_worked_hours(request, employee_id):
    """Obtiene las horas trabajadas de un empleado en una fecha específica"""
    try:
        date_str = request.query_params.get('date', timezone.now().date().isoformat())
        date = datetime.fromisoformat(date_str).date()
        
        worked_hours = AttendanceRecord.calculate_worked_hours(employee_id, date)
        overtime_hours = AttendanceRecord.calculate_overtime_hours(worked_hours or 0)
        
        return Response({
            'employee_id': employee_id,
            'date': date.isoformat(),
            'worked_hours': worked_hours,
            'overtime_hours': overtime_hours,
            'regular_hours': (worked_hours or 0) - overtime_hours
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def employee_attendance_summary(request, employee_id):
    """Obtiene resumen de asistencia de un empleado en un rango de fechas"""
    try:
        start_date_str = request.query_params.get('start_date', (timezone.now().date() - timedelta(days=30)).isoformat())
        end_date_str = request.query_params.get('end_date', timezone.now().date().isoformat())
        
        start_date = datetime.fromisoformat(start_date_str).date()
        end_date = datetime.fromisoformat(end_date_str).date()
        
        summary = AttendanceRecord.get_employee_attendance_summary(employee_id, start_date, end_date)
        
        return Response({
            'employee_id': employee_id,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            **summary
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def daily_attendance_summary(request):
    """Obtiene resumen de asistencia de todos los empleados en una fecha"""
    try:
        date_str = request.query_params.get('date', timezone.now().date().isoformat())
        date = datetime.fromisoformat(date_str).date()
        
        # Obtener todos los empleados activos
        from apps.employees.models import Employee
        employees = Employee.objects.filter(is_active=True)
        
        summary = []
        for employee in employees:
            worked_hours = AttendanceRecord.calculate_worked_hours(employee.id, date)
            if worked_hours is not None:
                overtime_hours = AttendanceRecord.calculate_overtime_hours(worked_hours)
                summary.append({
                    'employee_id': employee.id,
                    'employee_name': employee.name,
                    'position': employee.position,
                    'worked_hours': worked_hours,
                    'overtime_hours': overtime_hours,
                    'regular_hours': worked_hours - overtime_hours
                })
            else:
                summary.append({
                    'employee_id': employee.id,
                    'employee_name': employee.name,
                    'position': employee.position,
                    'worked_hours': 0,
                    'overtime_hours': 0,
                    'regular_hours': 0
                })
        
        return Response({
            'date': date.isoformat(),
            'summary': summary
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
