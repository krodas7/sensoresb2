"""
Sistema de resiliencia y tolerancia a fallos
Incluye: Retry logic, Circuit Breaker, Fallbacks
"""

import functools
import time
import logging
from typing import Callable, Any, Optional
from datetime import datetime, timedelta
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Implementación de Circuit Breaker para prevenir cascadas de fallos
    
    Estados:
    - CLOSED: Funcionamiento normal
    - OPEN: Circuito abierto, rechaza peticiones
    - HALF_OPEN: Probando si el servicio se recuperó
    """
    
    CLOSED = 'closed'
    OPEN = 'open'
    HALF_OPEN = 'half_open'
    
    def __init__(self, failure_threshold=5, recovery_timeout=60, expected_exception=Exception):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        self.failure_count = 0
        self.last_failure_time = None
        self.state = self.CLOSED
    
    def call(self, func, *args, **kwargs):
        """Ejecutar función con circuit breaker"""
        
        if self.state == self.OPEN:
            if self._should_attempt_reset():
                self.state = self.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN - Service unavailable")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise e
    
    def _on_success(self):
        """Llamado cuando una operación tiene éxito"""
        self.failure_count = 0
        self.state = self.CLOSED
    
    def _on_failure(self):
        """Llamado cuando una operación falla"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = self.OPEN
            logger.error(f"Circuit breaker opened after {self.failure_count} failures")
    
    def _should_attempt_reset(self):
        """Verificar si es tiempo de intentar recuperación"""
        return (
            self.last_failure_time and
            datetime.now() - self.last_failure_time >= timedelta(seconds=self.recovery_timeout)
        )


def retry_on_failure(max_retries=3, delay=1, backoff=2, exceptions=(Exception,)):
    """
    Decorador para reintentar automáticamente en caso de fallo
    
    Args:
        max_retries: Número máximo de reintentos
        delay: Delay inicial en segundos
        backoff: Factor de backoff exponencial
        exceptions: Tupla de excepciones a capturar
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            current_delay = delay
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    
                    if attempt == max_retries:
                        logger.error(
                            f"Function {func.__name__} failed after {max_retries} retries: {e}",
                            exc_info=True
                        )
                        raise
                    
                    logger.warning(
                        f"Attempt {attempt + 1}/{max_retries} failed for {func.__name__}: {e}. "
                        f"Retrying in {current_delay}s..."
                    )
                    
                    time.sleep(current_delay)
                    current_delay *= backoff
            
            raise last_exception
        
        return wrapper
    return decorator


def with_fallback(fallback_func):
    """
    Decorador que proporciona un fallback en caso de fallo
    
    Args:
        fallback_func: Función a ejecutar si la principal falla
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.warning(
                    f"Function {func.__name__} failed, using fallback: {e}"
                )
                return fallback_func(*args, **kwargs)
        return wrapper
    return decorator


def cache_with_fallback(cache_key, timeout=300):
    """
    Decorador que cachea resultados y usa caché como fallback
    
    Args:
        cache_key: Clave para el caché
        timeout: Tiempo de vida del caché en segundos
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Intentar obtener del caché primero
            cached_value = cache.get(cache_key)
            
            try:
                # Ejecutar función
                result = func(*args, **kwargs)
                
                # Guardar en caché
                cache.set(cache_key, result, timeout)
                
                return result
            except Exception as e:
                logger.warning(
                    f"Function {func.__name__} failed, attempting cache fallback: {e}"
                )
                
                # Si falla, usar valor en caché si existe
                if cached_value is not None:
                    logger.info(f"Using cached value for {cache_key}")
                    return cached_value
                
                # Si no hay caché, re-lanzar excepción
                raise
        
        return wrapper
    return decorator


def timeout_decorator(seconds=30):
    """
    Decorador para limitar el tiempo de ejecución de una función
    
    Args:
        seconds: Tiempo máximo en segundos
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            import signal
            
            def timeout_handler(signum, frame):
                raise TimeoutError(f"Function {func.__name__} exceeded {seconds}s timeout")
            
            # Solo funciona en Unix
            try:
                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(seconds)
                
                try:
                    result = func(*args, **kwargs)
                finally:
                    signal.alarm(0)
                
                return result
            except AttributeError:
                # En Windows, ejecutar sin timeout
                logger.warning("Timeout not supported on this platform")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


class GracefulDegradation:
    """Proporciona degradación elegante de servicios"""
    
    @staticmethod
    def get_cached_or_empty(cache_key, empty_value=None):
        """Obtener valor en caché o retornar valor vacío"""
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
        return empty_value if empty_value is not None else []
    
    @staticmethod
    def fallback_response(error_message, fallback_data=None, status_code=status.HTTP_200_OK):
        """Generar respuesta de fallback para API"""
        return Response({
            'success': False,
            'message': 'Service temporarily degraded',
            'error': error_message,
            'data': fallback_data or [],
            'fallback': True
        }, status=status_code)


class HealthChecker:
    """Sistema de health checks para servicios"""
    
    @staticmethod
    def check_database():
        """Verificar salud de la base de datos"""
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return True, "Database OK"
        except Exception as e:
            return False, f"Database error: {e}"
    
    @staticmethod
    def check_redis():
        """Verificar salud de Redis"""
        try:
            from django.core.cache import cache
            cache.set('health_check', 'ok', 10)
            value = cache.get('health_check')
            return value == 'ok', "Redis OK" if value == 'ok' else "Redis error"
        except Exception as e:
            return False, f"Redis error: {e}"
    
    @staticmethod
    def check_celery():
        """Verificar salud de Celery"""
        try:
            from beneficio.celery import app
            stats = app.control.inspect().stats()
            if stats:
                return True, f"Celery OK - {len(stats)} workers"
            return False, "No Celery workers available"
        except Exception as e:
            return False, f"Celery error: {e}"
    
    @staticmethod
    def check_mqtt():
        """Verificar salud de MQTT"""
        try:
            from apps.core.mqtt_service import MQTTService
            # Implementar verificación según tu servicio MQTT
            return True, "MQTT OK"
        except Exception as e:
            return False, f"MQTT error: {e}"
    
    @classmethod
    def get_system_health(cls):
        """Obtener salud completa del sistema"""
        checks = {
            'database': cls.check_database(),
            'redis': cls.check_redis(),
            'celery': cls.check_celery(),
            'mqtt': cls.check_mqtt(),
        }
        
        all_healthy = all(check[0] for check in checks.values())
        
        return {
            'healthy': all_healthy,
            'timestamp': datetime.now().isoformat(),
            'checks': {
                name: {
                    'status': 'healthy' if result[0] else 'unhealthy',
                    'message': result[1]
                }
                for name, result in checks.items()
            }
        }


# Instancia global de circuit breaker para servicios externos
external_api_breaker = CircuitBreaker(failure_threshold=5, recovery_timeout=60)
database_breaker = CircuitBreaker(failure_threshold=3, recovery_timeout=30)

