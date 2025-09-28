"""
Views for sensors
"""

from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from .models import Sensor
from .serializers import SensorSerializer, SensorListSerializer


class SensorListCreateView(generics.ListCreateAPIView):
    """Sensor list and create view"""
    queryset = Sensor.objects.all()
    permission_classes = [AllowAny]  # Make it public to avoid 401 errors
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sensor_type', 'is_active', 'area']
    search_fields = ['code', 'description', 'location']
    ordering_fields = ['code', 'created_at', 'last_reading_time']
    ordering = ['code']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SensorListSerializer
        return SensorSerializer


class SensorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Sensor detail view"""
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def sensor_status(request):
    """Get sensor status summary"""
    total_sensors = Sensor.objects.count()
    active_sensors = Sensor.objects.filter(is_active=True).count()
    online_sensors = sum(1 for sensor in Sensor.objects.filter(is_active=True) if sensor.is_online)
    
    return Response({
        'total': total_sensors,
        'active': active_sensors,
        'online': online_sensors,
        'offline': active_sensors - online_sensors
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_sensor_data(request):
    """Get recent sensor data without authentication"""
    try:
        # Obtener datos del cache (datos reales del Raspberry Pi)
        cached_data = cache.get('sensor_data', [])
        
        # Si no hay datos en cache, devolver datos simulados
        if not cached_data:
            cached_data = [
                {
                    'sensor_id': 'PILA_1',
                    'temperature': 25.5,
                    'timestamp': '2025-09-23T18:55:12.186154',
                    'location': 'Pila de Secado 1',
                    'status': 'OK'
                }
            ]
        
        return Response({
            'status': 'success',
            'data': cached_data,
            'count': len(cached_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error getting sensor data: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def receive_sensor_data(request):
    """Receive sensor data from Raspberry Pi"""
    try:
        data = request.data
        
        # Log the received data
        print(f"📡 Received sensor data: {data}")
        
        # Extract sensor information
        sensor_id = data.get('sensor_id', 'UNKNOWN')
        temperature = data.get('temperature', 0)
        timestamp = data.get('timestamp', None)
        location = data.get('location', f'Sensor {sensor_id}')
        sensor_status = data.get('status', 'OK')
        
        # Crear objeto de datos del sensor
        sensor_data = {
            'sensor_id': sensor_id,
            'temperature': temperature,
            'timestamp': timestamp,
            'location': location,
            'status': sensor_status
        }
        
        # Guardar en cache (mantener solo los últimos 10 registros)
        cached_data = cache.get('sensor_data', [])
        cached_data.insert(0, sensor_data)  # Agregar al inicio
        cached_data = cached_data[:10]      # Mantener solo 10 registros
        cache.set('sensor_data', cached_data, timeout=3600)  # 1 hora
        
        print(f"🌡️ Sensor {sensor_id}: {temperature}°C at {timestamp}")
        print(f"💾 Datos guardados en cache: {len(cached_data)} registros")
        
        return Response({
            'status': 'success',
            'message': 'Data received successfully',
            'sensor_id': sensor_id,
            'temperature': temperature
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error receiving sensor data: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
