"""
Celery tasks for core functionality
"""

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Event, Alert
from apps.sensors.models import Sensor
from apps.temperatures.models import Reading
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_sensor_status():
    """Check sensor status and create alerts for offline sensors"""
    try:
        offline_sensors = []
        
        for sensor in Sensor.objects.filter(is_active=True):
            if not sensor.is_online:
                offline_sensors.append(sensor)
                
                # Create alert if sensor has been offline for more than 10 minutes
                if sensor.last_reading_time:
                    time_since_last = timezone.now() - sensor.last_reading_time
                    if time_since_last > timedelta(minutes=10):
                        # Create alert
                        alert = Alert.objects.create(
                            alert_type='sensor_offline',
                            rule=f'Sensor {sensor.code} offline for {time_since_last}',
                            destination='admin@beneficio.com',
                            severity='high',
                            description=f'Sensor {sensor.code} in area {sensor.area.name} has been offline for {time_since_last}'
                        )
                        
                        # Log event
                        Event.objects.create(
                            event_type='alert_triggered',
                            payload_json=f'{{"alert_id": {alert.id}, "sensor_id": {sensor.id}}}',
                            severity='warning'
                        )
                        
                        logger.warning(f"Alert created for offline sensor: {sensor.code}")
        
        return f"Checked {Sensor.objects.filter(is_active=True).count()} sensors, {len(offline_sensors)} offline"
        
    except Exception as e:
        logger.error(f"Error in check_sensor_status task: {e}")
        return f"Error: {e}"


@shared_task
def process_temperature_alerts():
    """Process temperature alerts based on thresholds"""
    try:
        from apps.temperatures.models import Reading
        from apps.occupation.models import Occupation
        from django.conf import settings
        
        # Get latest temperature readings
        latest_readings = Reading.objects.filter(
            sensor__sensor_type='temperature',
            timestamp__gte=timezone.now() - timedelta(minutes=5)
        ).select_related('sensor', 'sensor__area')
        
        alerts_created = 0
        
        for reading in latest_readings:
            # Check if temperature exceeds threshold
            if reading.value > settings.TEMP_OCCUPIED_THRESHOLD:
                # Check if area is not already occupied
                latest_occupation = Occupation.objects.filter(
                    area=reading.sensor.area
                ).order_by('-timestamp').first()
                
                if not latest_occupation or latest_occupation.status != 'ocupado':
                    # Create alert
                    alert = Alert.objects.create(
                        alert_type='temperature',
                        rule=f'Temperature {reading.value}°C exceeds threshold {settings.TEMP_OCCUPIED_THRESHOLD}°C',
                        destination='operators@beneficio.com',
                        severity='medium',
                        description=f'High temperature detected in {reading.sensor.area.name}: {reading.value}°C'
                    )
                    
                    alerts_created += 1
                    
                    # Log event
                    Event.objects.create(
                        event_type='alert_triggered',
                        payload_json=f'{{"alert_id": {alert.id}, "reading_id": {reading.id}, "temperature": {reading.value}}}',
                        severity='warning'
                    )
        
        return f"Processed {latest_readings.count()} readings, created {alerts_created} alerts"
        
    except Exception as e:
        logger.error(f"Error in process_temperature_alerts task: {e}")
        return f"Error: {e}"


@shared_task
def cleanup_old_events():
    """Clean up old events to keep database size manageable"""
    try:
        # Delete events older than 30 days
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = Event.objects.filter(timestamp__lt=cutoff_date).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old events")
        return f"Deleted {deleted_count} old events"
        
    except Exception as e:
        logger.error(f"Error in cleanup_old_events task: {e}")
        return f"Error: {e}"
