"""
Report generation functions for new report types
"""

from django.utils import timezone
from datetime import timedelta
from apps.employees.models import Employee
from apps.attendance.models import AttendanceRecord
from apps.cupping.models import CommercialCupping
from apps.temperatures.models import Reading
from apps.occupation.models import Occupation

try:
    from apps.integrations.models import Integration
except ImportError:
    Integration = None


def generate_attendance_report(report):
    """Generate attendance report data"""
    start_date = report.start_date or timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = report.end_date or timezone.now()
    
    # Get attendance records in date range
    records = AttendanceRecord.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date,
        is_valid=True
    ).select_related('employee').order_by('employee', 'timestamp')
    
    # Group by employee
    employee_data = []
    current_employee = None
    current_records = []
    total_hours = 0
    
    for record in records:
        if current_employee is None or current_employee != record.employee:
            # Process previous employee
            if current_employee and current_records:
                # Calculate hours for all records of this employee
                check_in = None
                employee_total_hours = 0
                
                for rec in current_records:
                    if rec.record_type == 'IN':
                        check_in = rec.timestamp
                    elif rec.record_type == 'OUT' and check_in:
                        delta = rec.timestamp - check_in
                        employee_total_hours += delta.total_seconds() / 3600
                        check_in = None
                
                overtime = AttendanceRecord.calculate_overtime_hours(employee_total_hours)
                
                employee_data.append({
                    'name': current_employee.name,
                    'position': current_employee.position,
                    'entries': sum(1 for r in current_records if r.record_type == 'IN'),
                    'exits': sum(1 for r in current_records if r.record_type == 'OUT'),
                    'hours': round(employee_total_hours, 2),
                    'overtime': overtime,
                    'regular_hours': round(employee_total_hours - overtime, 2)
                })
            
            # Start new employee
            current_employee = record.employee
            current_records = [record]
        else:
            current_records.append(record)
    
    # Process last employee
    if current_employee and current_records:
        check_in = None
        employee_total_hours = 0
        
        for rec in current_records:
            if rec.record_type == 'IN':
                check_in = rec.timestamp
            elif rec.record_type == 'OUT' and check_in:
                delta = rec.timestamp - check_in
                employee_total_hours += delta.total_seconds() / 3600
                check_in = None
        
        overtime = AttendanceRecord.calculate_overtime_hours(employee_total_hours)
        
        employee_data.append({
            'name': current_employee.name,
            'position': current_employee.position,
            'entries': sum(1 for r in current_records if r.record_type == 'IN'),
            'exits': sum(1 for r in current_records if r.record_type == 'OUT'),
            'hours': round(employee_total_hours, 2),
            'overtime': overtime,
            'regular_hours': round(employee_total_hours - overtime, 2)
        })
    
    return {
        'report_type': 'attendance',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'total_records': records.count(),
        'total_employees': len(employee_data),
        'employees': employee_data
    }


def generate_cupping_report(report):
    """Generate cupping report data"""
    start_date = report.start_date or timezone.now() - timedelta(days=30)
    end_date = report.end_date or timezone.now()
    
    # Get cupping records
    cuppings = CommercialCupping.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    cupping_data = []
    for cupping in cuppings:
        cupping_data.append({
            'id': cupping.id,
            'lote': cupping.lote or 'N/A',
            'peso_qq': float(cupping.qq or 0),
            'rendimiento': float(cupping.rendimiento or 0),
            'humedad': float(cupping.humedad or 0),
            'tipo': cupping.tipo,
            'created_at': cupping.created_at.isoformat()
        })
    
    return {
        'report_type': 'cupping',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'total_cuppings': cuppings.count(),
        'cuppings': cupping_data
    }


def generate_shipping_weights_report(report):
    """Generate shipping weights report data"""
    if not Integration:
        return {'report_type': 'shipping_weights', 'error': 'Integration model not available'}
    
    start_date = report.start_date or timezone.now() - timedelta(days=30)
    end_date = report.end_date or timezone.now()
    
    # Get integrations
    integrations = Integration.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    shipping_data = []
    total_weight = 0
    
    for integration in integrations:
        expected_weight = float(integration.total_weight or 0)
        actual_weight = float(integration.actual_weight or 0)
        difference = actual_weight - expected_weight
        difference_pct = (difference / expected_weight * 100) if expected_weight > 0 else 0
        
        shipping_data.append({
            'integration_id': integration.id,
            'destino': integration.destino or 'N/A',
            'cliente': integration.cliente or 'N/A',
            'expected_weight': expected_weight,
            'actual_weight': actual_weight,
            'difference': difference,
            'difference_pct': round(difference_pct, 2),
            'status': 'Good' if abs(difference_pct) < 2 else 'Warning'
        })
        
        total_weight += actual_weight
    
    return {
        'report_type': 'shipping_weights',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'total_integrations': integrations.count(),
        'total_weight': round(total_weight, 2),
        'shipments': shipping_data
    }


def generate_integrations_report(report):
    """Generate integrations report data"""
    if not Integration:
        return {'report_type': 'integrations', 'error': 'Integration model not available'}
    
    start_date = report.start_date or timezone.now() - timedelta(days=30)
    end_date = report.end_date or timezone.now()
    
    integrations = Integration.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    integration_data = []
    for integration in integrations:
        integration_data.append({
            'id': integration.id,
            'destino': integration.destino or 'N/A',
            'cliente': integration.cliente or 'N/A',
            'total_weight': float(integration.total_weight or 0),
            'status': integration.estado or 'N/A',
            'created_at': integration.created_at.isoformat()
        })
    
    return {
        'report_type': 'integrations',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'total_integrations': integrations.count(),
        'integrations': integration_data
    }


def generate_temperature_report(report):
    """Generate temperature report data"""
    start_date = report.start_date or timezone.now() - timedelta(days=7)
    end_date = report.end_date or timezone.now()
    
    # Get temperature readings
    readings = Reading.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date
    ).select_related('sensor')
    
    sensor_data = {}
    for reading in readings:
        sensor_name = reading.sensor.name if reading.sensor else 'Unknown'
        if sensor_name not in sensor_data:
            sensor_data[sensor_name] = {
                'name': sensor_name,
                'area': reading.sensor.area.name if reading.sensor and reading.sensor.area else 'Unknown',
                'readings': [],
                'avg': 0,
                'max': 0,
                'min': 0
            }
        
        sensor_data[sensor_name]['readings'].append(float(reading.value))
    
    # Calculate stats
    for sensor in sensor_data.values():
        if sensor['readings']:
            sensor['avg'] = round(sum(sensor['readings']) / len(sensor['readings']), 2)
            sensor['max'] = round(max(sensor['readings']), 2)
            sensor['min'] = round(min(sensor['readings']), 2)
    
    return {
        'report_type': 'temperature',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'total_readings': readings.count(),
        'sensors': list(sensor_data.values())
    }


def generate_occupation_report(report):
    """Generate occupation report data"""
    start_date = report.start_date or timezone.now() - timedelta(days=7)
    end_date = report.end_date or timezone.now()
    
    # Get occupation data
    occupations = Occupation.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date
    ).select_related('area')
    
    area_data = {}
    for occupation in occupations:
        area_name = occupation.area.name if occupation.area else 'Unknown'
        if area_name not in area_data:
            area_data[area_name] = {
                'name': area_name,
                'status': occupation.status,
                'usage_hours': 0,
                'last_update': occupation.timestamp.isoformat()
            }
        else:
            # Calculate usage hours (simplified)
            if area_data[area_name]['status'] == 'ocupado':
                delta = timezone.now() - occupation.timestamp
                area_data[area_name]['usage_hours'] += delta.total_seconds() / 3600
    
    return {
        'report_type': 'occupation',
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        },
        'total_changes': occupations.count(),
        'areas': list(area_data.values())
    }
