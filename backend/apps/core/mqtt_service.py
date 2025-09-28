"""
MQTT service for Django Channels integration
"""

import json
import asyncio
import logging
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from django.utils import timezone
from apps.temperatures.models import Reading
from apps.sensors.models import Sensor
from apps.occupation.models import Occupation
from apps.core.models import Event

logger = logging.getLogger(__name__)


class MQTTService:
    """MQTT service for handling sensor data with Django Channels"""
    
    def __init__(self):
        self.channel_layer = get_channel_layer()
        self.is_connected = False
        
    async def process_sensor_reading(self, sensor_id: int, payload: dict, area_type: str):
        """Process sensor reading from MQTT"""
        try:
            # Get sensor info
            try:
                sensor = await Sensor.objects.aget(id=sensor_id)
            except Sensor.DoesNotExist:
                logger.warning(f"Sensor {sensor_id} not found")
                return
            
            # Create reading record
            reading = Reading.objects.create(
                sensor=sensor,
                timestamp=timezone.now(),
                value=payload.get('v', 0.0),
                unit=payload.get('u', '°C'),
                quality='good'
            )
            
            # Update sensor's last reading
            sensor.last_reading_time = reading.timestamp
            sensor.last_reading_value = reading.value
            await sensor.asave(update_fields=['last_reading_time', 'last_reading_value'])
            
            # Check temperature threshold for occupation
            if (sensor.sensor_type == 'temperature' and 
                reading.value > settings.TEMP_OCCUPIED_THRESHOLD):
                await self.update_area_occupation(sensor.area, True, "Temperatura alta")
            elif (sensor.sensor_type == 'temperature' and 
                  reading.value <= settings.TEMP_OCCUPIED_THRESHOLD):
                await self.update_area_occupation(sensor.area, False, "Temperatura normal")
            
            # Broadcast to WebSocket clients
            reading_data = {
                "sensor_id": sensor_id,
                "area_id": sensor.area.id,
                "value": reading.value,
                "unit": reading.unit,
                "timestamp": reading.timestamp.isoformat()
            }
            
            await self.broadcast_temperature_update(sensor.area.id, reading_data)
            
            # Log event
            Event.objects.create(
                event_type='sensor_reading',
                payload_json=json.dumps(reading_data),
                severity='info'
            )
            
            logger.debug(f"Processed reading for sensor {sensor_id}: {reading.value}{reading.unit}")
            
        except Exception as e:
            logger.error(f"Error processing sensor reading: {e}")
    
    async def update_area_occupation(self, area, is_occupied: bool, reason: str):
        """Update area occupation based on temperature"""
        try:
            # Get current occupation
            current_occupation = await Occupation.objects.filter(
                area=area
            ).order_by('-timestamp').afirst()
            
            # Check if status needs to change
            new_status = 'ocupado' if is_occupied else 'libre'
            if not current_occupation or current_occupation.status != new_status:
                # Create new occupation record
                new_occupation = Occupation.objects.create(
                    area=area,
                    status=new_status,
                    reason=reason,
                    timestamp=timezone.now(),
                    is_automatic=True
                )
                
                # Broadcast occupation update
                occupation_data = {
                    "area_id": area.id,
                    "status": new_occupation.status,
                    "reason": reason,
                    "is_automatic": True,
                    "timestamp": new_occupation.timestamp.isoformat()
                }
                
                await self.broadcast_occupation_update(area.id, occupation_data)
                
                logger.info(f"Area {area.id} occupation updated: {new_occupation.status} - {reason}")
                
        except Exception as e:
            logger.error(f"Error updating area occupation: {e}")
    
    async def broadcast_temperature_update(self, area_id: int, reading_data: dict):
        """Broadcast temperature update to WebSocket clients"""
        message = {
            "type": "temperature_update",
            "area_id": area_id,
            "data": reading_data,
            "timestamp": timezone.now().isoformat()
        }
        
        await self.channel_layer.group_send(
            f"temperature_{area_id}",
            {
                "type": "temperature_message",
                "message": message
            }
        )
        
        # Also broadcast to general temperature group
        await self.channel_layer.group_send(
            "temperature_all",
            {
                "type": "temperature_message",
                "message": message
            }
        )
    
    async def broadcast_occupation_update(self, area_id: int, occupation_data: dict):
        """Broadcast occupation update to WebSocket clients"""
        message = {
            "type": "occupation_update",
            "area_id": area_id,
            "data": occupation_data,
            "timestamp": timezone.now().isoformat()
        }
        
        await self.channel_layer.group_send(
            f"occupation_{area_id}",
            {
                "type": "occupation_message",
                "message": message
            }
        )
        
        # Also broadcast to general occupation group
        await self.channel_layer.group_send(
            "occupation_all",
            {
                "type": "occupation_message",
                "message": message
            }
        )


# Global MQTT service instance
mqtt_service = MQTTService()
