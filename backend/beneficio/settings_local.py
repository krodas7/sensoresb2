"""
Local development settings - includes logs module
"""
from .settings import *

# Re-enable logs module for local development
LOCAL_APPS = [
    'apps.core',
    'apps.areas',
    'apps.sensors',
    'apps.temperatures',
    'apps.occupation',
    'apps.lots',
    'apps.fermentation',
    'apps.cupping',
    'apps.employees',
    'apps.attendance',
    'apps.suppliers',
    'apps.inventory',
    'apps.gestions',
    'apps.reports',
    'apps.logs',  # Re-enabled for local development
    'apps.notifications',
]

# Reconstruir INSTALLED_APPS incluyendo jazzmin
DJANGO_APPS = [
    'jazzmin',  # Must be before django.contrib.admin
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# Ensure import_export and auditlog are included
THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',
    'django_celery_beat',
    'django_celery_results',
    'storages',
    'django_filters',
    'drf_spectacular',
    'import_export',
    'auditlog',
]

# Override REST_FRAMEWORK to include session authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
}

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# Configuración para servir archivos estáticos en desarrollo
DEBUG = True

print("🔧 Local development mode: logs module enabled")
