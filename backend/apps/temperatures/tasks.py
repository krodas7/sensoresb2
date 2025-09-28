"""
Celery tasks for temperature management
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Reading
import logging

logger = logging.getLogger(__name__)


@shared_task
def cleanup_old_readings():
    """Clean up old temperature readings to keep database size manageable"""
    try:
        # Keep only readings from last 30 days
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = Reading.objects.filter(timestamp__lt=cutoff_date).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old temperature readings")
        return f"Deleted {deleted_count} old readings"
        
    except Exception as e:
        logger.error(f"Error in cleanup_old_readings task: {e}")
        return f"Error: {e}"


@shared_task
def generate_temperature_summary():
    """Generate daily temperature summary"""
    try:
        from apps.sensors.models import Sensor
        from django.db.models import Avg, Max, Min, Count
        
        today = timezone.now().date()
        readings_today = Reading.objects.filter(
            timestamp__date=today,
            sensor__sensor_type='temperature'
        )
        
        summary = {
            'date': today.isoformat(),
            'total_readings': readings_today.count(),
            'avg_temperature': readings_today.aggregate(avg=Avg('value'))['avg'],
            'max_temperature': readings_today.aggregate(max=Max('value'))['max'],
            'min_temperature': readings_today.aggregate(min=Min('value'))['min'],
            'sensors_active': readings_today.values('sensor').distinct().count()
        }
        
        logger.info(f"Generated temperature summary for {today}: {summary}")
        return summary
        
    except Exception as e:
        logger.error(f"Error in generate_temperature_summary task: {e}")
        return f"Error: {e}"
