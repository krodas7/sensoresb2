"""
URL configuration for beneficio project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

def api_root(request):
    """API root endpoint"""
    return JsonResponse({
        'message': 'Beneficio de Café API',
        'version': '1.0',
        'status': 'active',
        'endpoints': {
            'health': '/api/v1/health/',
            'auth': '/api/v1/auth/',
            'sensors': '/api/v1/sensors/',
            'areas': '/api/v1/areas/',
            'temperatures': '/api/v1/temperatures/',
            'occupation': '/api/v1/occupation/',
            'lots': '/api/v1/lots/',
            'fermentation': '/api/v1/fermentation/',
            'cupping': '/api/v1/cupping/',
            'employees': '/api/v1/employees/',
            'attendance': '/api/v1/attendance/',
            'suppliers': '/api/v1/suppliers/',
            'cherry_reception': '/api/v1/cherry-reception/',
            'transformation': '/api/v1/transformation/',
            'reports': '/api/v1/reports/',
            'notifications': '/api/v1/notifications/',
            'docs': '/api/docs/',
        }
    })

def root(request):
    """Root endpoint - redirects to API docs"""
    return JsonResponse({
        'message': '🌟 Sistema de Beneficio de Café API',
        'version': '2.0.0',
        'status': 'active',
        'description': 'API profesional para la gestión integral de procesos de beneficio de café',
        'quick_links': {
            'api_root': '/api/v1/',
            'swagger_docs': '/api/docs/',
            'redoc_docs': '/api/redoc/',
            'admin_panel': '/admin/',
        },
        'endpoints': {
            'health': '/api/v1/health/',
            'auth': '/api/v1/auth/',
            'sensors': '/api/v1/sensors/',
            'areas': '/api/v1/areas/',
            'temperatures': '/api/v1/temperatures/',
            'occupation': '/api/v1/occupation/',
            'lots': '/api/v1/lots/',
            'fermentation': '/api/v1/fermentation/',
            'cupping': '/api/v1/cupping/',
            'employees': '/api/v1/employees/',
            'attendance': '/api/v1/attendance/',
            'suppliers': '/api/v1/suppliers/',
            'cherry_reception': '/api/v1/cherry-reception/',
            'transformation': '/api/v1/transformation/',
            'reports': '/api/v1/reports/',
            'notifications': '/api/v1/notifications/',
        }
    })

urlpatterns = [
    # Root endpoint
    path('', root, name='root'),
    
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API Root
    path('api/v1/', api_root, name='api-root'),
    
    # API Endpoints
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/areas/', include('apps.areas.urls')),
    path('api/v1/sensors/', include('apps.sensors.urls')),
    path('api/v1/temperatures/', include('apps.temperatures.urls')),
    path('api/v1/occupation/', include('apps.occupation.urls')),
    path('api/v1/lots/', include('apps.lots.urls')),
    path('api/v1/fermentation/', include('apps.fermentation.urls')),
    path('api/v1/cupping/', include('apps.cupping.urls')),
    path('api/v1/employees/', include('apps.employees.urls')),
    path('api/v1/attendance/', include('apps.attendance.urls')),
    path('api/v1/suppliers/', include('apps.suppliers.urls')),
    path('api/v1/cherry-reception/', include('apps.cherry_reception.urls')),
    path('api/v1/transformation/', include('apps.transformation.urls')),
    path('api/v1/inventory/', include('apps.inventory.urls')),
    path('api/v1/gestions/', include('apps.gestions.urls')),
    path('api/v1/reports/', include('apps.reports.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
