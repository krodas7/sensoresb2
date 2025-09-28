"""
Custom exceptions for the Sistema de Beneficio
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils.translation import gettext_lazy as _
import logging

logger = logging.getLogger(__name__)


class BeneficioException(Exception):
    """Base exception for Beneficio system"""
    pass


class SensorOfflineException(BeneficioException):
    """Exception raised when sensor is offline"""
    pass


class InvalidSensorDataException(BeneficioException):
    """Exception raised when sensor data is invalid"""
    pass


class AreaOccupiedException(BeneficioException):
    """Exception raised when trying to occupy an already occupied area"""
    pass


class InsufficientPermissionsException(BeneficioException):
    """Exception raised when user has insufficient permissions"""
    pass


class ReportGenerationException(BeneficioException):
    """Exception raised when report generation fails"""
    pass


class CuppingSessionException(BeneficioException):
    """Exception raised when cupping session operations fail"""
    pass


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF that provides consistent error responses
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': True,
            'message': 'Ha ocurrido un error en el sistema',
            'details': {},
            'timestamp': None,
            'request_id': None
        }
        
        # Get the original data from DRF
        if hasattr(response, 'data'):
            custom_response_data['details'] = response.data
        
        # Add timestamp
        from django.utils import timezone
        custom_response_data['timestamp'] = timezone.now().isoformat()
        
        # Add request ID if available
        request = context.get('request')
        if request and hasattr(request, 'id'):
            custom_response_data['request_id'] = request.id
        
        # Handle specific exception types
        if isinstance(exc, BeneficioException):
            custom_response_data['message'] = str(exc)
            response.status_code = status.HTTP_400_BAD_REQUEST
        
        elif isinstance(exc, ValidationError):
            custom_response_data['message'] = 'Error de validación de datos'
            custom_response_data['details'] = exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            response.status_code = status.HTTP_400_BAD_REQUEST
        
        elif isinstance(exc, IntegrityError):
            custom_response_data['message'] = 'Error de integridad de datos'
            custom_response_data['details'] = {'database_error': 'Violación de restricciones de base de datos'}
            response.status_code = status.HTTP_400_BAD_REQUEST
        
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            custom_response_data['message'] = 'Recurso no encontrado'
            custom_response_data['details'] = {'resource': 'El recurso solicitado no existe'}
        
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            custom_response_data['message'] = 'Acceso denegado'
            custom_response_data['details'] = {'permission': 'No tienes permisos para realizar esta acción'}
        
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            custom_response_data['message'] = 'No autorizado'
            custom_response_data['details'] = {'authentication': 'Credenciales inválidas o expiradas'}
        
        elif response.status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
            custom_response_data['message'] = 'Error interno del servidor'
            custom_response_data['details'] = {'server_error': 'Ha ocurrido un error inesperado en el servidor'}
            
            # Log the error for debugging
            logger.error(f"Server error: {exc}", exc_info=True)
        
        response.data = custom_response_data
    
    return response


class ErrorResponse:
    """
    Utility class for creating standardized error responses
    """
    
    @staticmethod
    def bad_request(message, details=None):
        return Response({
            'error': True,
            'message': message,
            'details': details or {},
            'status_code': status.HTTP_400_BAD_REQUEST
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def unauthorized(message="No autorizado", details=None):
        return Response({
            'error': True,
            'message': message,
            'details': details or {},
            'status_code': status.HTTP_401_UNAUTHORIZED
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    @staticmethod
    def forbidden(message="Acceso denegado", details=None):
        return Response({
            'error': True,
            'message': message,
            'details': details or {},
            'status_code': status.HTTP_403_FORBIDDEN
        }, status=status.HTTP_403_FORBIDDEN)
    
    @staticmethod
    def not_found(message="Recurso no encontrado", details=None):
        return Response({
            'error': True,
            'message': message,
            'details': details or {},
            'status_code': status.HTTP_404_NOT_FOUND
        }, status=status.HTTP_404_NOT_FOUND)
    
    @staticmethod
    def server_error(message="Error interno del servidor", details=None):
        return Response({
            'error': True,
            'message': message,
            'details': details or {},
            'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @staticmethod
    def validation_error(message="Error de validación", errors=None):
        return Response({
            'error': True,
            'message': message,
            'details': {'validation_errors': errors or {}},
            'status_code': status.HTTP_400_BAD_REQUEST
        }, status=status.HTTP_400_BAD_REQUEST)
