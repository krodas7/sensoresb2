from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum, Avg, Count, Q
from .models import CherryReception, CherryReceptionImage
from .serializers import (
    CherryReceptionSerializer, 
    CherryReceptionCreateSerializer,
    CherryReceptionImageSerializer,
    CherryReceptionStatsSerializer
)
from .ocr_service import ScaleOCRService
import logging

logger = logging.getLogger(__name__)


class CherryReceptionListCreateView(generics.ListCreateAPIView):
    """Lista y crea recepciones de cereza"""
    queryset = CherryReception.objects.all().select_related('supplier', 'received_by')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CherryReceptionCreateSerializer
        return CherryReceptionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros opcionales
        supplier_id = self.request.query_params.get('supplier')
        status_filter = self.request.query_params.get('status')
        quality = self.request.query_params.get('quality')
        
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if quality:
            queryset = queryset.filter(quality=quality)
        
        return queryset


class CherryReceptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualización y eliminación de recepción"""
    queryset = CherryReception.objects.all().select_related('supplier', 'received_by')
    serializer_class = CherryReceptionSerializer


class CherryReceptionImageUploadView(generics.CreateAPIView):
    """Subir imágenes adicionales a una recepción"""
    queryset = CherryReceptionImage.objects.all()
    serializer_class = CherryReceptionImageSerializer


@api_view(['POST'])
def process_ocr(request, pk):
    """
    Procesar OCR manualmente en una recepción existente
    
    POST /api/v1/cherry-reception/<pk>/process-ocr/
    """
    try:
        reception = CherryReception.objects.get(pk=pk)
        
        if not reception.scale_image:
            return Response({
                'success': False,
                'error': 'No hay imagen de báscula para procesar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Procesar OCR
        ocr_result = ScaleOCRService.extract_weight_from_image(reception.scale_image.path)
        
        # Actualizar recepción
        reception.ocr_raw_text = ocr_result.get('raw_text', '')
        reception.ocr_confidence = ocr_result.get('confidence', 0.0)
        reception.ocr_processed = True
        
        extracted_weight = ocr_result.get('weight')
        if extracted_weight:
            reception.weight_qq = extracted_weight
            reception.status = 'processing'
            reception.manual_correction = False
        else:
            reception.manual_correction = True
        
        reception.save()
        
        serializer = CherryReceptionSerializer(reception)
        return Response({
            'success': True,
            'reception': serializer.data,
            'ocr_result': ocr_result
        })
        
    except CherryReception.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Recepción no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error processing OCR: {e}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def reception_stats(request):
    """
    Obtener estadísticas de recepciones de cereza
    
    GET /api/v1/cherry-reception/stats/
    """
    try:
        # Filtros opcionales
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        queryset = CherryReception.objects.all()
        
        if date_from:
            queryset = queryset.filter(reception_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(reception_date__lte=date_to)
        
        # Estadísticas generales
        total_stats = queryset.aggregate(
            total_weight_qq=Sum('weight_qq'),
            avg_weight_qq=Avg('weight_qq'),
            total_receptions=Count('id')
        )
        
        # Por proveedor
        by_supplier = list(queryset.values('supplier__name').annotate(
            total_weight=Sum('weight_qq'),
            count=Count('id')
        ).order_by('-total_weight')[:10])
        
        # Por estado
        by_status = dict(queryset.values('status').annotate(
            count=Count('id')
        ).values_list('status', 'count'))
        
        # Por calidad
        by_quality = dict(queryset.values('quality').annotate(
            count=Count('id')
        ).values_list('quality', 'count'))
        
        # Tasa de éxito de OCR
        ocr_success = queryset.filter(ocr_processed=True, weight_qq__gt=0).count()
        ocr_total = queryset.filter(ocr_processed=True).count()
        ocr_success_rate = (ocr_success / ocr_total * 100) if ocr_total > 0 else 0
        
        stats = {
            'total_receptions': total_stats['total_receptions'] or 0,
            'total_weight_qq': float(total_stats['total_weight_qq'] or 0),
            'total_weight_lbs': float(total_stats['total_weight_qq'] or 0) * 100,
            'avg_weight_qq': float(total_stats['avg_weight_qq'] or 0),
            'by_supplier': by_supplier,
            'by_status': by_status,
            'by_quality': by_quality,
            'ocr_success_rate': float(ocr_success_rate)
        }
        
        serializer = CherryReceptionStatsSerializer(stats)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}", exc_info=True)
        return Response({
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
def update_weight_manually(request, pk):
    """
    Actualizar peso manualmente cuando OCR falla
    
    PATCH /api/v1/cherry-reception/<pk>/update-weight/
    Body: { "weight_qq": 45.5 }
    """
    try:
        reception = CherryReception.objects.get(pk=pk)
        
        weight_qq = request.data.get('weight_qq')
        if not weight_qq:
            return Response({
                'success': False,
                'error': 'weight_qq es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar peso
        is_valid, message = ScaleOCRService.validate_weight(weight_qq)
        if not is_valid:
            return Response({
                'success': False,
                'error': message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar peso
        reception.weight_qq = float(weight_qq)
        reception.manual_correction = True
        reception.status = 'processing'
        reception.save()
        
        serializer = CherryReceptionSerializer(reception)
        return Response({
            'success': True,
            'message': 'Peso actualizado correctamente',
            'reception': serializer.data
        })
        
    except CherryReception.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Recepción no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error updating weight: {e}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

