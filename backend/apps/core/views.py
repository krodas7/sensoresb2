from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from django.utils import timezone
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Parameter, Event, Alert, UserRole, ModulePermission, UserProfile
from .serializers import (
    UserSerializer, ParameterSerializer, EventSerializer, AlertSerializer,
    UserRoleSerializer, ModulePermissionSerializer, UserProfileSerializer, UserWithPermissionsSerializer
)
from .exceptions import ErrorResponse
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
import logging

logger = logging.getLogger(__name__)

# Sistema limpio sin sensores

# Authentication views
@extend_schema(
    tags=['Authentication'],
    summary='Autenticación de usuario',
    description='Endpoint para autenticar usuarios y obtener tokens JWT',
    examples=[
        OpenApiExample(
            'Login Example',
            summary='Ejemplo de login',
            description='Ejemplo de cómo autenticar un usuario',
            value={
                'username': 'admin',
                'password': 'password123'
            }
        )
    ],
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        401: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login endpoint"""
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return ErrorResponse.bad_request(
                'Usuario y contraseña son requeridos',
                {'missing_fields': ['username', 'password']}
            )

        user = authenticate(username=username, password=password)
        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'message': 'Login exitoso',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'expires_in': 1800  # 30 minutes
            })
        else:
            return ErrorResponse.unauthorized(
                'Credenciales inválidas',
                {'reason': 'Usuario no encontrado o inactivo'}
            )
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error interno durante el login',
            {'error_type': 'authentication_error'}
        )

@extend_schema(
    tags=['Authentication'],
    summary='Cerrar sesión',
    description='Endpoint para cerrar la sesión del usuario'
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'success': True,
            'message': 'Sesión cerrada exitosamente'
        })
    except Exception as e:
        logger.error(f"Logout error: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error interno durante el logout',
            {'error_type': 'logout_error'}
        )

@extend_schema(
    tags=['Authentication'],
    summary='Refrescar token',
    description='Endpoint para refrescar el token de acceso'
)
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh token endpoint"""
    try:
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return ErrorResponse.bad_request(
                'Token de refresco requerido',
                {'missing_fields': ['refresh_token']}
            )
        
        token = RefreshToken(refresh_token)
        return Response({
            'access': str(token.access_token),
            'refresh': str(token),
            'expires_in': 1800
        })
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}", exc_info=True)
        return ErrorResponse.unauthorized(
            'Token de refresco inválido',
            {'error_type': 'token_refresh_error'}
        )

@extend_schema(
    tags=['Authentication'],
    summary='Información del usuario',
    description='Endpoint para obtener información del usuario autenticado'
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """Get current user info"""
    try:
        user_data = UserSerializer(request.user).data
        return Response({
            'success': True,
            'user': user_data
        })
    except Exception as e:
        logger.error(f"Get user info error: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error interno obteniendo información del usuario',
            {'error_type': 'user_info_error'}
        )

@extend_schema(
    tags=['Core'],
    summary='Health check',
    description='Endpoint para verificar el estado del servidor'
)
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Health check endpoint"""
    return Response({
        'status': 'healthy',
        'timestamp': timezone.now().isoformat()
    })

# User Management Views
class UserListCreateView(ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class UserDetailView(RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

# Parameter Management Views
class ParameterListCreateView(ListCreateAPIView):
    queryset = Parameter.objects.all()
    serializer_class = ParameterSerializer
    permission_classes = [IsAuthenticated]

class ParameterDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Parameter.objects.all()
    serializer_class = ParameterSerializer
    permission_classes = [IsAuthenticated]

# Event Views
class EventListView(ListCreateAPIView):
    queryset = Event.objects.all().order_by('-timestamp')
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

# Alert Management Views
class AlertListCreateView(ListCreateAPIView):
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

class AlertDetailView(RetrieveUpdateDestroyAPIView):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]


# Role and Permission Management Views
class UserRoleListCreateView(ListCreateAPIView):
    """List and create user roles"""
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]

class UserRoleDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update and delete user roles"""
    queryset = UserRole.objects.all()
    serializer_class = UserRoleSerializer
    permission_classes = [IsAuthenticated]

class ModulePermissionListCreateView(ListCreateAPIView):
    """List and create module permissions"""
    queryset = ModulePermission.objects.all()
    serializer_class = ModulePermissionSerializer
    permission_classes = [IsAuthenticated]

class ModulePermissionDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update and delete module permissions"""
    queryset = ModulePermission.objects.all()
    serializer_class = ModulePermissionSerializer
    permission_classes = [IsAuthenticated]

class UserProfileListCreateView(ListCreateAPIView):
    """List and create user profiles"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

class UserProfileDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update and delete user profiles"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

@extend_schema(
    tags=['Permissions'],
    summary='Obtener permisos de usuario',
    description='Obtiene los permisos y módulos accesibles para un usuario específico',
    responses={
        200: UserWithPermissionsSerializer,
        404: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_permissions(request, user_id):
    """Get user permissions and accessible modules"""
    try:
        user = User.objects.get(id=user_id)
        serializer = UserWithPermissionsSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return ErrorResponse.not_found('Usuario no encontrado')

@extend_schema(
    tags=['Permissions'],
    summary='Verificar permiso de usuario',
    description='Verifica si un usuario tiene un permiso específico en un módulo',
    parameters=[
        OpenApiParameter(name='module', description='Nombre del módulo', required=True, type=str),
        OpenApiParameter(name='permission', description='Tipo de permiso', required=True, type=str)
    ],
    responses={
        200: OpenApiTypes.OBJECT,
        404: OpenApiTypes.OBJECT
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_user_permission(request, user_id):
    """Check if user has specific permission"""
    try:
        user = User.objects.get(id=user_id)
        module = request.GET.get('module')
        permission = request.GET.get('permission')
        
        if not module or not permission:
            return ErrorResponse.validation_error('Módulo y permiso son requeridos')
        
        if hasattr(user, 'profile') and user.profile:
            has_permission = user.profile.has_permission(module, permission)
            return Response({
                'user_id': user_id,
                'module': module,
                'permission': permission,
                'has_permission': has_permission
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'user_id': user_id,
                'module': module,
                'permission': permission,
                'has_permission': False
            }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return ErrorResponse.not_found('Usuario no encontrado')

@extend_schema(
    tags=['Permissions'],
    summary='Inicializar roles por defecto',
    description='Crea los roles y permisos por defecto del sistema',
    responses={
        201: OpenApiTypes.OBJECT,
        500: OpenApiTypes.OBJECT
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_default_roles(request):
    """Initialize default roles and permissions"""
    try:
        # Crear roles por defecto
        default_roles = [
            {
                'name': 'superusuario',
                'display_name': 'Superusuario',
                'description': 'Acceso completo a todos los módulos y funciones del sistema'
            },
            {
                'name': 'administrador',
                'display_name': 'Administrador',
                'description': 'Gestión de usuarios, reportes y configuración del sistema'
            },
            {
                'name': 'catador',
                'display_name': 'Catador',
                'description': 'Acceso al módulo de catación y evaluación de calidad'
            },
            {
                'name': 'pesador',
                'display_name': 'Pesador',
                'description': 'Acceso a módulos de pesos, integraciones y envíos'
            },
            {
                'name': 'operador',
                'display_name': 'Operador',
                'description': 'Acceso a módulos básicos de producción y operación'
            },
            {
                'name': 'supervisor',
                'display_name': 'Supervisor',
                'description': 'Supervisión de procesos y acceso a reportes'
            },
            {
                'name': 'invitado',
                'display_name': 'Invitado',
                'description': 'Acceso de solo lectura a módulos básicos'
            }
        ]
        
        created_roles = []
        for role_data in default_roles:
            role, created = UserRole.objects.get_or_create(
                name=role_data['name'],
                defaults=role_data
            )
            if created:
                created_roles.append(role)
        
        # Crear permisos por defecto para cada rol
        modules = [choice[0] for choice in ModulePermission.MODULE_CHOICES]
        permissions = [choice[0] for choice in ModulePermission.PERMISSION_CHOICES]
        
        # Definir permisos por rol
        role_permissions = {
            'superusuario': {module: permissions for module in modules},
            'administrador': {
                'dashboard': ['view', 'admin'],
                'usuarios': ['view', 'create', 'edit', 'delete', 'admin'],
                'empleados': ['view', 'create', 'edit', 'delete'],
                'proveedores': ['view', 'create', 'edit', 'delete'],
                'reportes': ['view', 'create', 'edit', 'export', 'admin'],
                'logs': ['view', 'export'],
                'configuracion': ['view', 'edit', 'admin']
            },
            'catador': {
                'dashboard': ['view'],
                'catacion': ['view', 'create', 'edit'],
                'reportes': ['view', 'export']
            },
            'pesador': {
                'dashboard': ['view'],
                'integracion_lotes': ['view', 'create', 'edit'],
                'pesos_envio': ['view', 'create', 'edit'],
                'reportes': ['view', 'export']
            },
            'operador': {
                'dashboard': ['view'],
                'temperaturas': ['view'],
                'fermentacion': ['view', 'edit'],
                'ocupacion': ['view', 'edit']
            },
            'supervisor': {
                'dashboard': ['view', 'admin'],
                'usuarios': ['view'],
                'empleados': ['view'],
                'proveedores': ['view'],
                'catacion': ['view'],
                'integracion_lotes': ['view'],
                'pesos_envio': ['view'],
                'temperaturas': ['view'],
                'fermentacion': ['view'],
                'ocupacion': ['view'],
                'reportes': ['view', 'export']
            },
            'invitado': {
                'dashboard': ['view'],
                'temperaturas': ['view'],
                'fermentacion': ['view'],
                'ocupacion': ['view']
            }
        }
        
        created_permissions = []
        for role_name, module_perms in role_permissions.items():
            try:
                role = UserRole.objects.get(name=role_name)
                for module, perms in module_perms.items():
                    for permission in perms:
                        perm, created = ModulePermission.objects.get_or_create(
                            role=role,
                            module=module,
                            permission=permission,
                            defaults={'is_granted': True}
                        )
                        if created:
                            created_permissions.append(perm)
            except UserRole.DoesNotExist:
                continue
        
        return Response({
            'message': 'Roles y permisos inicializados correctamente',
            'roles_created': len(created_roles),
            'permissions_created': len(created_permissions),
            'details': {
                'roles': [role.display_name for role in created_roles],
                'permissions_count': len(created_permissions)
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error initializing default roles: {str(e)}", exc_info=True)
        return ErrorResponse.server_error(
            'Error inicializando roles por defecto',
            {'error_type': 'role_initialization_error', 'error': str(e)}
        )