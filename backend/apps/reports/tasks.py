"""
Celery tasks for report generation
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta, date
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def generate_daily_reports():
    """Generate daily reports and send via email"""
    try:
        from apps.temperatures.models import Reading
        from apps.occupation.models import Occupation
        from apps.attendance.models import AttendanceRecord
        from apps.lots.models import Lot
        from django.db.models import Count, Avg
        
        today = date.today()
        
        # Temperature summary
        temp_readings = Reading.objects.filter(
            timestamp__date=today,
            sensor__sensor_type='temperature'
        )
        
        # Occupation summary
        occupation_changes = Occupation.objects.filter(timestamp__date=today)
        
        # Attendance summary
        attendance_records = AttendanceRecord.objects.filter(timestamp__date=today)
        
        # Lots summary
        lots_created = Lot.objects.filter(created_at__date=today)
        
        report_data = {
            'date': today.isoformat(),
            'temperature': {
                'total_readings': temp_readings.count(),
                'avg_temperature': temp_readings.aggregate(avg=Avg('value'))['avg'] or 0,
                'sensors_active': temp_readings.values('sensor').distinct().count()
            },
            'occupation': {
                'total_changes': occupation_changes.count(),
                'areas_occupied': occupation_changes.filter(status='ocupado').count()
            },
            'attendance': {
                'total_records': attendance_records.count(),
                'check_ins': attendance_records.filter(record_type='IN').count(),
                'check_outs': attendance_records.filter(record_type='OUT').count()
            },
            'lots': {
                'created_today': lots_created.count(),
                'total_weight': sum(lot.initial_weight for lot in lots_created)
            }
        }
        
        # Generate HTML report
        html_content = render_to_string('reports/daily_report.html', {
            'report_data': report_data,
            'date': today
        })
        
        # Send email (if configured)
        if settings.SMTP_HOST:
            send_mail(
                subject=f'Reporte Diario - {today}',
                message='',
                html_message=html_content,
                from_email=settings.SMTP_FROM_EMAIL,
                recipient_list=['admin@beneficio.com'],
                fail_silently=False,
            )
        
        logger.info(f"Generated daily report for {today}")
        return f"Daily report generated for {today}"
        
    except Exception as e:
        logger.error(f"Error in generate_daily_reports task: {e}")
        return f"Error: {e}"


@shared_task
def generate_temperature_report(area_id=None, start_date=None, end_date=None):
    """Generate temperature report for specific area and date range"""
    try:
        from apps.temperatures.models import Reading
        from apps.areas.models import Area
        from django.db.models import Avg, Max, Min
        
        # Set default date range if not provided
        if not start_date:
            start_date = timezone.now().date() - timedelta(days=7)
        if not end_date:
            end_date = timezone.now().date()
        
        # Build query
        readings = Reading.objects.filter(
            timestamp__date__range=[start_date, end_date],
            sensor__sensor_type='temperature'
        )
        
        if area_id:
            readings = readings.filter(sensor__area_id=area_id)
            area = Area.objects.get(id=area_id)
            area_name = area.name
        else:
            area_name = "Todas las áreas"
        
        # Calculate statistics
        stats = readings.aggregate(
            avg_temp=Avg('value'),
            max_temp=Max('value'),
            min_temp=Min('value'),
            count=Count('id')
        )
        
        # Group by day for chart data
        daily_stats = readings.extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            avg_temp=Avg('value'),
            max_temp=Max('value'),
            min_temp=Min('value')
        ).order_by('day')
        
        report_data = {
            'area_name': area_name,
            'start_date': start_date,
            'end_date': end_date,
            'statistics': stats,
            'daily_data': list(daily_stats)
        }
        
        logger.info(f"Generated temperature report for {area_name} from {start_date} to {end_date}")
        return report_data
        
    except Exception as e:
        logger.error(f"Error in generate_temperature_report task: {e}")
        return f"Error: {e}"
