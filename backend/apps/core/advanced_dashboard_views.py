"""
Vistas avanzadas para el dashboard
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiTypes

from .advanced_metrics import AdvancedMetricsService


@extend_schema(
    tags=['Dashboard Avanzado'],
    summary='Métricas de Producción',
    description='Obtiene métricas detalladas de producción',
    responses={
        200: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def production_metrics(request):
    """Obtener métricas de producción"""
    try:
        metrics_service = AdvancedMetricsService()
        data = metrics_service.get_production_metrics()
        
        return Response(data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Dashboard Avanzado'],
    summary='Métricas de Calidad',
    description='Obtiene métricas detalladas de calidad y catación',
    responses={
        200: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quality_metrics(request):
    """Obtener métricas de calidad"""
    try:
        metrics_service = AdvancedMetricsService()
        data = metrics_service.get_quality_metrics()
        
        return Response(data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Dashboard Avanzado'],
    summary='Métricas Operacionales',
    description='Obtiene métricas operacionales (empleados, asistencia, temperaturas)',
    responses={
        200: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def operational_metrics(request):
    """Obtener métricas operacionales"""
    try:
        metrics_service = AdvancedMetricsService()
        data = metrics_service.get_operational_metrics()
        
        return Response(data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Dashboard Avanzado'],
    summary='Métricas de Equipos',
    description='Obtiene métricas de equipos y sensores',
    responses={
        200: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def equipment_metrics(request):
    """Obtener métricas de equipos"""
    try:
        metrics_service = AdvancedMetricsService()
        data = metrics_service.get_equipment_metrics()
        
        return Response(data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Dashboard Avanzado'],
    summary='Métricas de Alertas',
    description='Obtiene métricas de alertas y notificaciones',
    responses={
        200: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alerts_metrics(request):
    """Obtener métricas de alertas"""
    try:
        metrics_service = AdvancedMetricsService()
        data = metrics_service.get_alerts_metrics()
        
        return Response(data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Dashboard Avanzado'],
    summary='Dashboard Completo',
    description='Obtiene todas las métricas del dashboard en una sola llamada',
    responses={
        200: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def comprehensive_dashboard(request):
    """Obtener dashboard completo con todas las métricas"""
    try:
        metrics_service = AdvancedMetricsService()
        data = metrics_service.get_comprehensive_dashboard_data()
        
        return Response(data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Dashboard Avanzado'],
    summary='KPIs Principales',
    description='Obtiene un resumen de los KPIs principales',
    responses={
        200: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kpi_summary(request):
    """Obtener resumen de KPIs principales"""
    try:
        metrics_service = AdvancedMetricsService()
        data = metrics_service.get_kpi_summary()
        
        return Response(data)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

