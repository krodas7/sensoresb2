"""
Sistema de health checks avanzado para monitoreo de servicios
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from django.core.cache import cache
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check simple para load balancers
    GET /api/v1/health/
    """
    return Response({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


@api_view(['GET'])
@permission_classes([AllowAny])
def readiness_check(request):
    """
    Readiness check - verifica si el servicio está listo para recibir tráfico
    GET /api/v1/readiness/
    """
    checks = {}
    all_ready = True
    
    # Check 1: Database
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks['database'] = {'status': 'ready', 'message': 'Connected'}
    except Exception as e:
        checks['database'] = {'status': 'not_ready', 'message': str(e)}
        all_ready = False
    
    # Check 2: Redis/Cache
    try:
        cache.set('readiness_check', 'ok', 10)
        if cache.get('readiness_check') == 'ok':
            checks['cache'] = {'status': 'ready', 'message': 'Connected'}
        else:
            checks['cache'] = {'status': 'not_ready', 'message': 'Cache not responding'}
            all_ready = False
    except Exception as e:
        checks['cache'] = {'status': 'not_ready', 'message': str(e)}
        all_ready = False
    
    # Check 3: Migrations
    try:
        from django.db.migrations.executor import MigrationExecutor
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if not plan:
            checks['migrations'] = {'status': 'ready', 'message': 'All migrations applied'}
        else:
            checks['migrations'] = {'status': 'not_ready', 'message': f'{len(plan)} pending migrations'}
            all_ready = False
    except Exception as e:
        checks['migrations'] = {'status': 'unknown', 'message': str(e)}
    
    response_status = status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response({
        'ready': all_ready,
        'timestamp': datetime.now().isoformat(),
        'checks': checks
    }, status=response_status)


@api_view(['GET'])
@permission_classes([AllowAny])
def liveness_check(request):
    """
    Liveness check - verifica si el servicio está vivo (para Kubernetes)
    GET /api/v1/liveness/
    """
    return Response({
        'alive': True,
        'timestamp': datetime.now().isoformat()
    })


@api_view(['GET'])
def detailed_health(request):
    """
    Health check detallado - requiere autenticación
    GET /api/v1/health/detailed/
    """
    from .resilience import HealthChecker
    
    health_data = HealthChecker.get_system_health()
    
    # Agregar métricas adicionales
    try:
        from apps.core.models import User
        from apps.sensors.models import Sensor
        
        health_data['metrics'] = {
            'total_users': User.objects.count(),
            'active_sensors': Sensor.objects.filter(is_active=True).count(),
            'database_size': get_database_size(),
        }
    except Exception as e:
        health_data['metrics'] = {'error': str(e)}
    
    response_status = status.HTTP_200_OK if health_data['healthy'] else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response(health_data, status=response_status)


def get_database_size():
    """Obtener tamaño de la base de datos"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """)
            row = cursor.fetchone()
            return row[0] if row else 'Unknown'
    except Exception:
        return 'Unknown'


@api_view(['GET'])
def metrics(request):
    """
    Métricas del sistema en formato Prometheus
    GET /api/v1/metrics/
    """
    from django.db.models import Count, Avg
    from apps.temperatures.models import Reading
    from apps.core.models import User
    
    try:
        metrics_data = {
            'system': {
                'uptime_seconds': get_uptime(),
                'timestamp': datetime.now().isoformat()
            },
            'database': {
                'connections_active': get_active_connections(),
                'size': get_database_size()
            },
            'users': {
                'total': User.objects.count(),
                'active': User.objects.filter(is_active=True).count()
            },
            'readings': {
                'total': Reading.objects.count(),
                'last_24h': Reading.objects.filter(
                    timestamp__gte=datetime.now() - timedelta(hours=24)
                ).count()
            }
        }
        
        return Response(metrics_data)
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        return Response({
            'error': 'Unable to retrieve metrics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_uptime():
    """Obtener uptime del servicio (aproximado)"""
    try:
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.readline().split()[0])
            return uptime_seconds
    except:
        return 0


def get_active_connections():
    """Obtener número de conexiones activas a la base de datos"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT count(*) FROM pg_stat_activity 
                WHERE datname = current_database()
            """)
            row = cursor.fetchone()
            return row[0] if row else 0
    except:
        return 0


from datetime import timedelta

