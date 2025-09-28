"""
Views for temperatures
"""

from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg, Max, Min, Count

from .models import Reading
from .serializers import (
    ReadingSerializer, ReadingCreateSerializer, ReadingBatchCreateSerializer,
    TemperatureSummarySerializer
)
from apps.sensors.models import Sensor


class ReadingListCreateView(generics.ListCreateAPIView):
    """Reading list and create view"""
    queryset = Reading.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sensor', 'quality', 'unit']
    search_fields = ['sensor__code', 'sensor__area__name']
    ordering_fields = ['timestamp', 'value']
    ordering = ['-timestamp']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReadingCreateSerializer
        return ReadingSerializer


class ReadingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Reading detail view"""
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer


@api_view(['POST'])
def create_batch_readings(request):
    """Create multiple readings in batch"""
    serializer = ReadingBatchCreateSerializer(data=request.data)
    if serializer.is_valid():
        result = serializer.save()
        return Response(ReadingSerializer(result['readings'], many=True).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def latest_readings(request):
    """Get latest readings for all sensors"""
    sensors = Sensor.objects.filter(is_active=True)
    latest_readings = []
    
    for sensor in sensors:
        latest = Reading.objects.filter(sensor=sensor).order_by('-timestamp').first()
        if latest:
            latest_readings.append(latest)
    
    serializer = ReadingSerializer(latest_readings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def temperature_summary(request):
    """Get temperature summary for dashboard"""
    sensors = Sensor.objects.filter(
        is_active=True, 
        sensor_type='temperature'
    ).select_related('area')
    
    summary_data = []
    
    for sensor in sensors:
        latest = Reading.objects.filter(sensor=sensor).order_by('-timestamp').first()
        if latest:
            # Get previous reading for trend calculation
            previous = Reading.objects.filter(
                sensor=sensor,
                timestamp__lt=latest.timestamp
            ).order_by('-timestamp').first()
            
            trend = 'stable'
            if previous:
                if latest.value > previous.value + 0.5:
                    trend = 'up'
                elif latest.value < previous.value - 0.5:
                    trend = 'down'
            
            summary_data.append({
                'sensor_id': sensor.id,
                'sensor_code': sensor.code,
                'area_name': sensor.area.name,
                'current_value': latest.value,
                'unit': latest.unit,
                'timestamp': latest.timestamp,
                'status': sensor.status,
                'trend': trend
            })
    
    return Response(summary_data)


@api_view(['GET'])
def temperature_history(request):
    """Get temperature history for charts"""
    sensor_id = request.GET.get('sensor_id')
    area_id = request.GET.get('area_id')
    hours = int(request.GET.get('hours', 24))
    
    # Calculate time range
    end_time = timezone.now()
    start_time = end_time - timedelta(hours=hours)
    
    queryset = Reading.objects.filter(
        timestamp__gte=start_time,
        timestamp__lte=end_time
    ).select_related('sensor', 'sensor__area')
    
    if sensor_id:
        queryset = queryset.filter(sensor_id=sensor_id)
    elif area_id:
        queryset = queryset.filter(sensor__area_id=area_id)
    
    # Group by hour for better performance
    readings = queryset.extra(
        select={
            'hour': "date_trunc('hour', timestamp)"
        }
    ).values('hour', 'sensor_id', 'sensor__code', 'sensor__area__name').annotate(
        avg_value=Avg('value'),
        max_value=Max('value'),
        min_value=Min('value'),
        count=Count('id')
    ).order_by('hour')
    
    return Response(list(readings))
