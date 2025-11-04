"""
Sistema de monitoreo y alertas automáticas
"""

import logging
from datetime import datetime, timedelta
from django.core.mail import send_mail
from django.conf import settings
from .models import Alert, Event
from .resilience import HealthChecker

logger = logging.getLogger(__name__)


class SystemMonitor:
    """Monitor del sistema para detectar problemas automáticamente"""
    
    @staticmethod
    def check_and_alert():
        """Verificar salud del sistema y crear alertas si es necesario"""
        health = HealthChecker.get_system_health()
        
        if not health['healthy']:
            SystemMonitor.create_health_alert(health)
        
        return health
    
    @staticmethod
    def create_health_alert(health_data):
        """Crear alerta cuando el sistema no está saludable"""
        try:
            unhealthy_services = [
                name for name, check in health_data['checks'].items()
                if check['status'] != 'healthy'
            ]
            
            if unhealthy_services:
                alert = Alert.objects.create(
                    alert_type='system_health',
                    rule=f'Services unhealthy: {", ".join(unhealthy_services)}',
                    destination='admin@beneficio.com',
                    severity='critical',
                    description=f'Health check failed at {health_data["timestamp"]}'
                )
                
                # Enviar notificación
                SystemMonitor.send_alert_notification(alert)
                
                logger.critical(f"System health alert created: {alert.id}")
        
        except Exception as e:
            logger.error(f"Failed to create health alert: {e}")
    
    @staticmethod
    def send_alert_notification(alert):
        """Enviar notificación de alerta (email, SMS, etc.)"""
        try:
            if settings.DEBUG:
                # En desarrollo, solo log
                logger.warning(f"ALERT: {alert.alert_type} - {alert.description}")
            else:
                # En producción, enviar email
                send_mail(
                    subject=f'[ALERT] {alert.alert_type.upper()}',
                    message=alert.description,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[alert.destination],
                    fail_silently=True,
                )
        except Exception as e:
            logger.error(f"Failed to send alert notification: {e}")
    
    @staticmethod
    def log_event(event_type, payload=None, severity='info'):
        """Registrar evento en el sistema"""
        try:
            Event.objects.create(
                event_type=event_type,
                payload_json=str(payload) if payload else '',
                severity=severity
            )
        except Exception as e:
            logger.error(f"Failed to log event: {e}")


class PerformanceMonitor:
    """Monitor de rendimiento del sistema"""
    
    @staticmethod
    def track_slow_query(query_time, query, threshold=1.0):
        """Registrar queries lentas"""
        if query_time > threshold:
            logger.warning(
                f"Slow query detected: {query_time:.2f}s",
                extra={
                    'query_time': query_time,
                    'query': query,
                    'threshold': threshold
                }
            )
            
            SystemMonitor.log_event(
                'slow_query',
                {'time': query_time, 'query': query},
                'warning'
            )
    
    @staticmethod
    def track_api_response_time(endpoint, duration):
        """Registrar tiempos de respuesta de API"""
        if duration > 1.0:  # > 1 segundo
            logger.warning(
                f"Slow API response: {endpoint} took {duration:.2f}s"
            )


class ResourceMonitor:
    """Monitor de recursos del sistema"""
    
    @staticmethod
    def check_disk_space():
        """Verificar espacio en disco"""
        import shutil
        
        try:
            total, used, free = shutil.disk_usage("/")
            free_percent = (free / total) * 100
            
            if free_percent < 10:
                Alert.objects.create(
                    alert_type='disk_space',
                    rule='Low disk space',
                    destination='admin@beneficio.com',
                    severity='critical',
                    description=f'Only {free_percent:.1f}% disk space remaining'
                )
                logger.critical(f"Low disk space: {free_percent:.1f}% free")
            
            return free_percent
        except Exception as e:
            logger.error(f"Failed to check disk space: {e}")
            return None
    
    @staticmethod
    def check_memory():
        """Verificar uso de memoria"""
        try:
            import psutil
            memory = psutil.virtual_memory()
            
            if memory.percent > 90:
                logger.warning(f"High memory usage: {memory.percent}%")
            
            return memory.percent
        except ImportError:
            # psutil no instalado
            return None
        except Exception as e:
            logger.error(f"Failed to check memory: {e}")
            return None

