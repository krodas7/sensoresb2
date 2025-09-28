"""
WebSocket consumers for real-time data
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .mqtt_consumer import MQTTConsumer


class TemperatureConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for temperature data"""
    
    async def connect(self):
        self.area_id = self.scope['url_route']['kwargs'].get('area_id')
        self.room_group_name = f'temperature_{self.area_id}' if self.area_id else 'temperature_all'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'temperature_message',
                'message': message
            }
        )
    
    # Receive message from room group
    async def temperature_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))


class OccupationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for occupation data"""
    
    async def connect(self):
        self.area_id = self.scope['url_route']['kwargs'].get('area_id')
        self.room_group_name = f'occupation_{self.area_id}' if self.area_id else 'occupation_all'
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'occupation_message',
                'message': message
            }
        )
    
    # Receive message from room group
    async def occupation_message(self, event):
        message = event['message']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
