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
            'reports': '/api/v1/reports/',
            'logs': '/api/v1/logs/',
            'notifications': '/api/v1/notifications/',
            'docs': '/api/docs/',
        }
    })

urlpatterns = [
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
    path('api/v1/reports/', include('apps.reports.urls')),
    # path('api/v1/logs/', include('apps.logs.urls')),  # Temporarily disabled for CI compatibility
    path('api/v1/notifications/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
