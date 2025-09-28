"""
WebSocket routing for core app
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/temperatures/$', consumers.TemperatureConsumer.as_asgi()),
    re_path(r'ws/temperatures/(?P<area_id>\w+)/$', consumers.TemperatureConsumer.as_asgi()),
    re_path(r'ws/occupation/$', consumers.OccupationConsumer.as_asgi()),
    re_path(r'ws/occupation/(?P<area_id>\w+)/$', consumers.OccupationConsumer.as_asgi()),
    re_path(r'ws/mqtt/$', consumers.MQTTConsumer.as_asgi()),
]
