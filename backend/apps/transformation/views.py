from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count
from .models import Transformation, TransformationImage
from .serializers import (
    TransformationSerializer,
    TransformationCreateSerializer,
    TransformationImageSerializer,
    TransformationStatsSerializer
)
from .ocr_service import VoucherOCRService
import logging

logger = logging.getLogger(__name__)


class TransformationListCreateView(generics.ListCreateAPIView):
    """Lista y crea transformaciones"""
    queryset = Transformation.objects.all().select_related('lot', 'processed_by')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TransformationCreateSerializer
        return TransformationSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        lot_id = self.request.query_params.get('lot')
        status_filter = self.request.query_params.get('status')
        
        if lot_id:
            queryset = queryset.filter(lot_id=lot_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset


class TransformationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualización y eliminación"""
    queryset = Transformation.objects.all().select_related('lot', 'processed_by')
    serializer_class = TransformationSerializer


class TransformationImageUploadView(generics.CreateAPIView):
    """Subir imágenes adicionales"""
    queryset = TransformationImage.objects.all()
    serializer_class = TransformationImageSerializer


@api_view(['POST'])
def process_ocr(request, pk):
    """
    Procesar OCR manualmente en una transformación existente
    
    POST /api/v1/transformation/<pk>/process-ocr/
    """
    try:
        transformation = Transformation.objects.get(pk=pk)
        
        if not transformation.voucher_image:
            return Response({
                'success': False,
                'error': 'No hay imagen de vale para procesar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Procesar OCR
        ocr_result = VoucherOCRService.extract_data_from_voucher(transformation.voucher_image.path)
        
        # Actualizar transformación
        transformation.ocr_raw_text = ocr_result.get('raw_text', '')
        transformation.ocr_weight_confidence = ocr_result.get('weight_confidence', 0.0)
        transformation.ocr_yield_confidence = ocr_result.get('yield_confidence', 0.0)
        transformation.ocr_processed = True
        
        extracted_weight = ocr_result.get('weight')
        extracted_yield = ocr_result.get('yield_percentage')
        
        if extracted_weight:
            transformation.weight_qq = extracted_weight
        if extracted_yield:
            transformation.yield_percentage = extracted_yield
        
        if extracted_weight and extracted_yield:
            transformation.status = 'processing'
            transformation.manual_correction = False
        else:
            transformation.manual_correction = True
        
        transformation.save()
        
        serializer = TransformationSerializer(transformation)
        return Response({
            'success': True,
            'transformation': serializer.data,
            'ocr_result': ocr_result
        })
        
    except Transformation.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Transformación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error processing OCR: {e}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
def update_data_manually(request, pk):
    """
    Actualizar peso y rendimiento manualmente
    
    PATCH /api/v1/transformation/<pk>/update-data/
    Body: { "weight_qq": 45.5, "yield_percentage": 18.5 }
    """
    try:
        transformation = Transformation.objects.get(pk=pk)
        
        weight_qq = request.data.get('weight_qq')
        yield_percentage = request.data.get('yield_percentage')
        
        if weight_qq:
            transformation.weight_qq = float(weight_qq)
        
        if yield_percentage:
            # Validar rendimiento
            is_valid, message = VoucherOCRService.validate_yield(yield_percentage)
            if not is_valid:
                return Response({
                    'success': False,
                    'error': message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            transformation.yield_percentage = float(yield_percentage)
        
        transformation.manual_correction = True
        transformation.status = 'processing'
        transformation.save()
        
        serializer = TransformationSerializer(transformation)
        return Response({
            'success': True,
            'message': 'Datos actualizados correctamente',
            'transformation': serializer.data
        })
        
    except Transformation.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Transformación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating data: {e}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def transformation_stats(request):
    """
    Estadísticas de transformaciones
    
    GET /api/v1/transformation/stats/
    """
    try:
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = Transformation.objects.all()
        
        if date_from:
            queryset = queryset.filter(transformation_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(transformation_date__lte=date_to)
        
        # Estadísticas
        total_stats = queryset.aggregate(
            total_weight=Sum('weight_qq'),
            avg_yield=Avg('yield_percentage'),
            total_count=Count('id')
        )
        
        by_status = dict(queryset.values('status').annotate(
            count=Count('id')
        ).values_list('status', 'count'))
        
        # Tasa de éxito OCR
        ocr_success = queryset.filter(
            ocr_processed=True,
            weight_qq__gt=0,
            yield_percentage__gt=0
        ).count()
        ocr_total = queryset.filter(ocr_processed=True).count()
        ocr_success_rate = (ocr_success / ocr_total * 100) if ocr_total > 0 else 0
        
        # Transformaciones recientes
        recent = queryset[:10]
        
        stats = {
            'total_transformations': total_stats['total_count'] or 0,
            'total_weight_qq': float(total_stats['total_weight'] or 0),
            'avg_yield_percentage': float(total_stats['avg_yield'] or 0),
            'by_status': by_status,
            'ocr_success_rate': float(ocr_success_rate),
            'recent_transformations': TransformationSerializer(recent, many=True).data
        }
        
        serializer = TransformationStatsSerializer(stats)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

