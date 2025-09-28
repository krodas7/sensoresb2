"""
Views for areas
"""

from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Area
from .serializers import AreaSerializer, AreaListSerializer


class AreaListCreateView(generics.ListCreateAPIView):
    """Area list and create view"""
    queryset = Area.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['area_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'capacity']
    ordering = ['name']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AreaListSerializer
        return AreaSerializer


class AreaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Area detail view"""
    queryset = Area.objects.all()
    serializer_class = AreaSerializer
