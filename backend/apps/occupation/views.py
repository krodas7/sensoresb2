"""
Views for occupation
"""

from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from .models import Occupation
from .serializers import (
    OccupationSerializer, OccupationCreateSerializer, OccupationSummarySerializer
)
from apps.areas.models import Area


class OccupationListCreateView(generics.ListCreateAPIView):
    """Occupation list and create view"""
    queryset = Occupation.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['area', 'status', 'is_automatic']
    search_fields = ['area__name', 'lot__codigo', 'reason']
    ordering_fields = ['timestamp', 'area__name']
    ordering = ['-timestamp']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OccupationCreateSerializer
        return OccupationSerializer


class OccupationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Occupation detail view"""
    queryset = Occupation.objects.all()
    serializer_class = OccupationSerializer


@api_view(['GET'])
def occupation_summary(request):
    """Get current occupation summary for all areas"""
    areas = Area.objects.filter(is_active=True)
    summary_data = []
    
    for area in areas:
        latest_occupation = Occupation.objects.filter(area=area).order_by('-timestamp').first()
        
        if latest_occupation:
            summary_data.append({
                'area_id': area.id,
                'area_name': area.name,
                'area_type': area.area_type,
                'status': latest_occupation.status,
                'lot_code': latest_occupation.lot.codigo if latest_occupation.lot else None,
                'lot_finca': latest_occupation.lot.finca if latest_occupation.lot else None,
                'timestamp': latest_occupation.timestamp,
                'duration': latest_occupation.duration,
                'is_automatic': latest_occupation.is_automatic,
            })
        else:
            summary_data.append({
                'area_id': area.id,
                'area_name': area.name,
                'area_type': area.area_type,
                'status': 'libre',
                'lot_code': None,
                'lot_finca': None,
                'timestamp': None,
                'duration': None,
                'is_automatic': True,
            })
    
    return Response(summary_data)


@api_view(['POST'])
def force_occupation(request):
    """Force area occupation status (admin only)"""
    area_id = request.data.get('area_id')
    status = request.data.get('status')
    reason = request.data.get('reason', '')
    lot_id = request.data.get('lot_id')
    
    try:
        area = Area.objects.get(id=area_id)
    except Area.DoesNotExist:
        return Response({'error': 'Área no encontrada'}, status=status.HTTP_404_NOT_FOUND)
    
    # Create occupation record
    occupation = Occupation.objects.create(
        area=area,
        lot_id=lot_id,
        status=status,
        reason=reason,
        timestamp=timezone.now(),
        is_automatic=False
    )
    
    serializer = OccupationSerializer(occupation)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
