from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q
from django.utils import timezone
from .models import (
    Cupping, CuppingSample, Cupper, CuppingScore, 
    CuppingDescriptor, CuppingSessionParticipant
)
from .serializers import (
    CuppingSerializer, CuppingCreateSerializer, CuppingSampleSerializer,
    CupperSerializer, CuppingScoreSerializer, CuppingScoreCreateSerializer,
    CuppingDescriptorSerializer, CuppingSessionParticipantSerializer
)


class CuppingViewSet(viewsets.ModelViewSet):
    queryset = Cupping.objects.all()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CuppingCreateSerializer
        return CuppingSerializer
    
    @action(detail=True, methods=['post'])
    def open_session(self, request, pk=None):
        """Open a cupping session"""
        cupping = self.get_object()
        if cupping.status != 'draft':
            return Response(
                {'error': 'Solo se pueden abrir sesiones en estado borrador'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cupping.status = 'open'
        cupping.opened_at = timezone.now()
        cupping.save()
        
        return Response({'status': 'Sesión abierta exitosamente'})
    
    @action(detail=True, methods=['post'])
    def close_session(self, request, pk=None):
        """Close a cupping session"""
        cupping = self.get_object()
        if cupping.status != 'open':
            return Response(
                {'error': 'Solo se pueden cerrar sesiones abiertas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cupping.status = 'closed'
        cupping.closed_at = timezone.now()
        cupping.save()
        
        return Response({'status': 'Sesión cerrada exitosamente'})
    
    @action(detail=True, methods=['get'])
    def analysis(self, request, pk=None):
        """Get analysis data for a cupping session"""
        cupping = self.get_object()
        
        # Calculate sample statistics
        samples_data = []
        for sample in cupping.samples.all():
            scores = sample.scores.all()
            if scores.exists():
                avg_score = scores.aggregate(avg=Avg('total_score'))['avg']
                score_count = scores.count()
                scores_list = [s.total_score for s in scores]
                
                # Calculate standard deviation
                if len(scores_list) > 1:
                    mean = sum(scores_list) / len(scores_list)
                    variance = sum((x - mean) ** 2 for x in scores_list) / len(scores_list)
                    std_dev = variance ** 0.5
                else:
                    std_dev = 0
                
                samples_data.append({
                    'id': sample.id,
                    'blind_code': sample.blind_code,
                    'origin': sample.origin,
                    'average_score': round(avg_score, 2),
                    'score_count': score_count,
                    'standard_deviation': round(std_dev, 2),
                    'scores': scores_list
                })
        
        # Calculate cupper statistics
        cuppers_data = []
        for participant in cupping.participants.all():
            cupper = participant.cupper
            cupper_scores = CuppingScore.objects.filter(
                cupper=cupper, 
                sample__cupping=cupping
            )
            
            if cupper_scores.exists():
                avg_score = cupper_scores.aggregate(avg=Avg('total_score'))['avg']
                score_count = cupper_scores.count()
                
                cuppers_data.append({
                    'id': cupper.id,
                    'name': cupper.name,
                    'role': cupper.role,
                    'average_score': round(avg_score, 2),
                    'score_count': score_count
                })
        
        return Response({
            'session': CuppingSerializer(cupping).data,
            'samples': samples_data,
            'cuppers': cuppers_data
        })
    
    @action(detail=True, methods=['get'])
    def flavor_wheel(self, request, pk=None):
        """Get flavor wheel data for a cupping session"""
        cupping = self.get_object()
        
        # Get all descriptors for this session
        descriptors = CuppingDescriptor.objects.filter(
            sample__cupping=cupping
        ).values('descriptor', 'intensity', 'polarity').annotate(
            avg_intensity=Avg('intensity'),
            count=Count('id')
        )
        
        # Group by polarity
        positive_descriptors = [
            d for d in descriptors if d['polarity'] == 'positive'
        ]
        negative_descriptors = [
            d for d in descriptors if d['polarity'] == 'negative'
        ]
        
        return Response({
            'positive_descriptors': positive_descriptors,
            'negative_descriptors': negative_descriptors
        })


class CuppingSampleViewSet(viewsets.ModelViewSet):
    queryset = CuppingSample.objects.all()
    serializer_class = CuppingSampleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        cupping_id = self.request.query_params.get('cupping_id')
        if cupping_id:
            queryset = queryset.filter(cupping_id=cupping_id)
        return queryset


class CupperViewSet(viewsets.ModelViewSet):
    queryset = Cupper.objects.all()
    serializer_class = CupperSerializer


class CuppingScoreViewSet(viewsets.ModelViewSet):
    queryset = CuppingScore.objects.all()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update']:
            return CuppingScoreCreateSerializer
        return CuppingScoreSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        sample_id = self.request.query_params.get('sample_id')
        cupper_id = self.request.query_params.get('cupper_id')
        
        if sample_id:
            queryset = queryset.filter(sample_id=sample_id)
        if cupper_id:
            queryset = queryset.filter(cupper_id=cupper_id)
            
        return queryset


class CuppingDescriptorViewSet(viewsets.ModelViewSet):
    queryset = CuppingDescriptor.objects.all()
    serializer_class = CuppingDescriptorSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        sample_id = self.request.query_params.get('sample_id')
        cupper_id = self.request.query_params.get('cupper_id')
        
        if sample_id:
            queryset = queryset.filter(sample_id=sample_id)
        if cupper_id:
            queryset = queryset.filter(cupper_id=cupper_id)
            
        return queryset


class CuppingSessionParticipantViewSet(viewsets.ModelViewSet):
    queryset = CuppingSessionParticipant.objects.all()
    serializer_class = CuppingSessionParticipantSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        cupping_id = self.request.query_params.get('cupping_id')
        if cupping_id:
            queryset = queryset.filter(cupping_id=cupping_id)
        return queryset
