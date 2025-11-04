"""
Middleware personalizado para manejo de errores y resiliencia
"""

import logging
import traceback
import json
from django.http import JsonResponse
from django.core.exceptions import ValidationError
from rest_framework.exceptions import APIException
from django.db import OperationalError, InterfaceError

logger = logging.getLogger(__name__)


class ErrorHandlingMiddleware:
    """
    Middleware global para manejo de errores con respuestas estructuradas
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        try:
            response = self.get_response(request)
            return response
        except Exception as e:
            return self.handle_exception(request, e)
    
    def handle_exception(self, request, exception):
        """Manejar excepciones de forma elegante"""
        
        # Log del error
        logger.error(
            f"Unhandled exception in {request.method} {request.path}",
            exc_info=True,
            extra={
                'user': getattr(request, 'user', None),
                'path': request.path,
                'method': request.method,
            }
        )
        
        # Determinar tipo de error y respuesta apropiada
        if isinstance(exception, ValidationError):
            return JsonResponse({
                'success': False,
                'error': 'Validation Error',
                'details': exception.message_dict if hasattr(exception, 'message_dict') else str(exception),
                'type': 'validation_error'
            }, status=400)
        
        elif isinstance(exception, (OperationalError, InterfaceError)):
            return JsonResponse({
                'success': False,
                'error': 'Database Temporarily Unavailable',
                'message': 'Please try again in a few moments',
                'type': 'database_error',
                'retry': True
            }, status=503)
        
        elif isinstance(exception, APIException):
            return JsonResponse({
                'success': False,
                'error': str(exception),
                'type': 'api_error'
            }, status=exception.status_code)
        
        else:
            # Error genérico
            return JsonResponse({
                'success': False,
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred. Our team has been notified.',
                'type': 'server_error',
                'request_id': str(id(request))  # Para tracking
            }, status=500)


class RequestLoggingMiddleware:
    """
    Middleware para logging detallado de requests
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        import time
        
        # Log del request
        start_time = time.time()
        
        logger.info(
            f"Request started: {request.method} {request.path}",
            extra={
                'user': getattr(request, 'user', 'Anonymous'),
                'ip': self.get_client_ip(request),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            }
        )
        
        # Procesar request
        response = self.get_response(request)
        
        # Log del response
        duration = time.time() - start_time
        
        logger.info(
            f"Request completed: {request.method} {request.path} - {response.status_code}",
            extra={
                'duration_ms': round(duration * 1000, 2),
                'status_code': response.status_code,
            }
        )
        
        # Agregar header con tiempo de respuesta
        response['X-Response-Time'] = f"{round(duration * 1000, 2)}ms"
        
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Obtener IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class DatabaseConnectionPoolMiddleware:
    """
    Middleware para manejar conexiones de base de datos de forma robusta
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        from django.db import connection
        
        # Verificar salud de conexión antes de procesar
        try:
            connection.ensure_connection()
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return JsonResponse({
                'success': False,
                'error': 'Database temporarily unavailable',
                'retry': True
            }, status=503)
        
        response = self.get_response(request)
        
        # Cerrar conexión si está idle
        if connection.connection and not connection.in_atomic_block:
            connection.close()
        
        return response


class RateLimitMiddleware:
    """
    Middleware simple de rate limiting por IP
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limit = 100  # requests por minuto
        self.window = 60  # segundos
    
    def __call__(self, request):
        # Obtener IP del cliente
        ip = self.get_client_ip(request)
        cache_key = f"rate_limit:{ip}"
        
        # Obtener contador actual
        requests_count = cache.get(cache_key, 0)
        
        if requests_count >= self.rate_limit:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return JsonResponse({
                'success': False,
                'error': 'Rate limit exceeded',
                'message': f'Maximum {self.rate_limit} requests per minute',
                'retry_after': self.window
            }, status=429)
        
        # Incrementar contador
        cache.set(cache_key, requests_count + 1, self.window)
        
        response = self.get_response(request)
        
        # Agregar headers de rate limit
        response['X-RateLimit-Limit'] = str(self.rate_limit)
        response['X-RateLimit-Remaining'] = str(self.rate_limit - requests_count - 1)
        
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Obtener IP del cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

