"""
Configuración avanzada de Celery con manejo de errores y reintentos
"""

from celery import Task
from celery.exceptions import MaxRetriesExceededError
import logging

logger = logging.getLogger(__name__)


class ResilientTask(Task):
    """
    Tarea de Celery con manejo robusto de errores
    """
    autoretry_for = (Exception,)
    retry_kwargs = {'max_retries': 3, 'countdown': 5}
    retry_backoff = True
    retry_backoff_max = 600  # 10 minutos máximo
    retry_jitter = True
    
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Callback cuando una tarea falla definitivamente"""
        logger.error(
            f'Task {self.name} failed: {exc}',
            extra={
                'task_id': task_id,
                'args': args,
                'kwargs': kwargs,
                'exception': str(exc)
            }
        )
        
        # Crear alerta en el sistema
        try:
            from apps.core.models import Alert
            Alert.objects.create(
                alert_type='task_failure',
                rule=f'Celery task {self.name} failed',
                destination='admin@beneficio.com',
                severity='high',
                description=f'Task ID: {task_id}\nError: {exc}'
            )
        except Exception as e:
            logger.error(f"Failed to create alert: {e}")
    
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Callback cuando una tarea se reintenta"""
        logger.warning(
            f'Task {self.name} retry attempt',
            extra={
                'task_id': task_id,
                'exception': str(exc),
                'retry_count': self.request.retries
            }
        )
    
    def on_success(self, retval, task_id, args, kwargs):
        """Callback cuando una tarea tiene éxito"""
        logger.info(
            f'Task {self.name} completed successfully',
            extra={'task_id': task_id}
        )


# Configuración de Celery Beat Schedule con tareas de mantenimiento
CELERY_BEAT_SCHEDULE = {
    # Health check cada 5 minutos
    'health-check-every-5-minutes': {
        'task': 'apps.core.tasks.system_health_check',
        'schedule': 300.0,  # 5 minutos
    },
    
    # Limpieza de eventos antiguos cada día
    'cleanup-old-events-daily': {
        'task': 'apps.core.tasks.cleanup_old_events',
        'schedule': 86400.0,  # 24 horas
    },
    
    # Backup automático cada 6 horas
    'auto-backup-every-6-hours': {
        'task': 'apps.core.tasks.auto_backup',
        'schedule': 21600.0,  # 6 horas
    },
    
    # Verificar sensores cada 10 minutos
    'check-sensor-status-every-10-minutes': {
        'task': 'apps.core.tasks.check_sensor_status',
        'schedule': 600.0,  # 10 minutos
    },
    
    # Procesar alertas de temperatura cada 5 minutos
    'process-temperature-alerts-every-5-minutes': {
        'task': 'apps.core.tasks.process_temperature_alerts',
        'schedule': 300.0,  # 5 minutos
    },
}

# Dead Letter Queue para tareas fallidas
CELERY_TASK_ROUTES = {
    'apps.core.tasks.*': {'queue': 'default'},
    'apps.*.tasks.cleanup_*': {'queue': 'low_priority'},
    'apps.*.tasks.backup_*': {'queue': 'backups'},
}

CELERY_TASK_QUEUES = {
    'default': {
        'exchange': 'default',
        'routing_key': 'default',
    },
    'low_priority': {
        'exchange': 'low_priority',
        'routing_key': 'low_priority',
    },
    'backups': {
        'exchange': 'backups',
        'routing_key': 'backups',
    },
    'failed': {
        'exchange': 'failed',
        'routing_key': 'failed',
    },
}

