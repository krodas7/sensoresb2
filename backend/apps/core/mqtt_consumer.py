"""
MQTT Consumer for Django Channels
"""

import json
import asyncio
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .mqtt_service import mqtt_service

logger = logging.getLogger(__name__)


class MQTTConsumer(AsyncWebsocketConsumer):
    """MQTT Consumer for processing sensor data"""
    
    async def connect(self):
        """Connect to MQTT broker"""
        try:
            import paho.mqtt.client as mqtt
            
            self.mqtt_client = mqtt.Client()
            
            if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
                self.mqtt_client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
            
            self.mqtt_client.on_connect = self.on_connect
            self.mqtt_client.on_message = self.on_message
            self.mqtt_client.on_disconnect = self.on_disconnect
            
            await asyncio.get_event_loop().run_in_executor(
                None, 
                self.mqtt_client.connect, 
                settings.MQTT_BROKER, 
                settings.MQTT_PORT, 
                60
            )
            
            await asyncio.get_event_loop().run_in_executor(
                None, 
                self.mqtt_client.loop_start
            )
            
            logger.info(f"Connected to MQTT broker at {settings.MQTT_BROKER}:{settings.MQTT_PORT}")
            
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
    
    def on_connect(self, client, userdata, flags, rc):
        """Callback for MQTT connection"""
        if rc == 0:
            logger.info("MQTT connection established")
            
            # Subscribe to temperature topics
            client.subscribe("beneficio/+/sensor/+/temp")
            client.subscribe("beneficio/+/sensor/+/humedad")
            client.subscribe("beneficio/+/sensor/+/ph")
            
            logger.info("Subscribed to sensor topics")
        else:
            logger.error(f"MQTT connection failed with code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback for MQTT disconnection"""
        logger.warning("MQTT disconnected")
    
    def on_message(self, client, userdata, msg):
        """Callback for MQTT messages"""
        try:
            topic_parts = msg.topic.split('/')
            if len(topic_parts) < 4:
                return
            
            area_type = topic_parts[1]  # e.g., "guardeola-1"
            sensor_id = int(topic_parts[3])  # sensor ID
            
            # Parse message payload
            payload = json.loads(msg.payload.decode())
            
            # Process the reading asynchronously
            asyncio.create_task(
                mqtt_service.process_sensor_reading(
                    sensor_id, payload, area_type
                )
            )
            
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    async def disconnect(self, close_code):
        """Disconnect from MQTT broker"""
        if hasattr(self, 'mqtt_client'):
            await asyncio.get_event_loop().run_in_executor(
                None, 
                self.mqtt_client.loop_stop
            )
            await asyncio.get_event_loop().run_in_executor(
                None, 
                self.mqtt_client.disconnect
            )
            logger.info("MQTT disconnected")
