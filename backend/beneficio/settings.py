"""
Django settings for beneficio project.
"""

import os
from pathlib import Path
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment variables
env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, 'django-insecure-change-me-in-production'),
    DATABASE_URL=(str, 'postgresql://beneficio:password@localhost:5432/beneficio'),
    REDIS_URL=(str, 'redis://localhost:6379/0'),
    MQTT_BROKER=(str, 'localhost'),
    MQTT_PORT=(int, 1883),
    MQTT_USERNAME=(str, ''),
    MQTT_PASSWORD=(str, ''),
)

# Read .env file
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG', default=True)

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '192.168.0.5', '192.168.0.16']

# Application definition
DJANGO_APPS = [
    'jazzmin',  # Must be before django.contrib.admin
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

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
    'import_export',  # Django Import-Export
    'auditlog',  # Django Auditlog
]

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
    'apps.cherry_reception',
    'apps.transformation',
    'apps.inventory',
    'apps.gestions',
    'apps.reports',
    'apps.logs',
    'apps.notifications',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'auditlog.middleware.AuditlogMiddleware',
    # Middleware de resiliencia
    'apps.core.middleware.RequestLoggingMiddleware',
    'apps.core.middleware.ErrorHandlingMiddleware',
    'apps.core.middleware.DatabaseConnectionPoolMiddleware',
    # 'apps.core.middleware.RateLimitMiddleware',  # Descomentar para activar rate limiting
]

ROOT_URLCONF = 'beneficio.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'beneficio.wsgi.application'
ASGI_APPLICATION = 'beneficio.asgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-gt'
TIME_ZONE = 'America/Guatemala'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom user model
AUTH_USER_MODEL = 'core.User'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    # 'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.ProfessionalPageNumberPagination',  # Temporalmente deshabilitado
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # 'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',  # Temporalmente deshabilitado
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    },
    # 'DEFAULT_VERSIONING_CLASS': 'apps.core.api_versioning.ProfessionalAPIVersioning',  # Temporalmente deshabilitado
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),  # 8 horas de sesión activa
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True

# Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [env('REDIS_URL')],
        },
    },
}

# Celery - Configuración robusta
CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = env('REDIS_URL')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Configuración de resiliencia para Celery
CELERY_TASK_ACKS_LATE = True  # Confirmar tarea solo después de completarla
CELERY_WORKER_PREFETCH_MULTIPLIER = 1  # Tomar una tarea a la vez
CELERY_TASK_REJECT_ON_WORKER_LOST = True  # Re-encolar si el worker muere
CELERY_TASK_TIME_LIMIT = 3600  # 1 hora máximo por tarea
CELERY_TASK_SOFT_TIME_LIMIT = 3300  # 55 minutos soft limit
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000  # Restart worker cada 1000 tareas
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_CONNECTION_MAX_RETRIES = 10

# MQTT Settings
MQTT_BROKER = env('MQTT_BROKER')
MQTT_PORT = env('MQTT_PORT')
MQTT_USERNAME = env('MQTT_USERNAME')
MQTT_PASSWORD = env('MQTT_PASSWORD')

# Temperature thresholds
TEMP_OCCUPIED_THRESHOLD = 35.0  # °C

# Logging avanzado con rotación
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        }
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
        'file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose'
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'errors.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Configuraciones de resiliencia
RESILIENCE_SETTINGS = {
    'CIRCUIT_BREAKER_THRESHOLD': 5,
    'CIRCUIT_BREAKER_TIMEOUT': 60,
    'MAX_RETRIES': 3,
    'RETRY_DELAY': 1,
    'RETRY_BACKOFF': 2,
    'REQUEST_TIMEOUT': 30,
    'DATABASE_TIMEOUT': 10,
}

# File Storage (MinIO/S3)
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = env('MINIO_ACCESS_KEY', default='minioadmin')
AWS_SECRET_ACCESS_KEY = env('MINIO_SECRET_KEY', default='minioadmin')
AWS_STORAGE_BUCKET_NAME = env('MINIO_BUCKET', default='beneficio-files')
AWS_S3_ENDPOINT_URL = f"http://{env('MINIO_ENDPOINT', default='localhost:9000')}"
AWS_S3_USE_SSL = False
AWS_DEFAULT_ACL = None

# API Documentation
SPECTACULAR_SETTINGS = {
    'TITLE': '🌟 Sistema de Beneficio de Café API',
    'DESCRIPTION': '''
    # 🚀 API Profesional del Sistema de Beneficio de Café
    
    ## 📋 Descripción
    API de clase empresarial para la gestión integral de procesos de beneficio de café, diseñada para optimizar la producción y calidad del café desde la recepción hasta el empaque final.
    
    ## ✨ Características Principales
    - 🏭 **Gestión de Lotes**: Control completo del proceso de beneficio húmedo y seco
    - 🌡️ **Monitoreo IoT**: Sensores de temperatura, humedad, pH y calidad en tiempo real
    - ☕ **Catación Profesional**: Sistema de evaluación SCA y CVA con reportes detallados
    - 👥 **Gestión de Personal**: Control de empleados, asistencia y productividad
    - 📊 **Analytics Avanzados**: Métricas, reportes y dashboards en tiempo real
    - 🔒 **Seguridad Enterprise**: Autenticación JWT, roles y permisos granulares
    - 📱 **Mobile-First**: Optimizado para aplicaciones móviles y PWA
    
    ## 🔐 Autenticación
    La API utiliza autenticación JWT (JSON Web Tokens) para seguridad. Incluye tokens de acceso y refresh para sesiones seguras.
    
    ### Headers Requeridos:
    ```
    Authorization: Bearer <jwt_token>
    Content-Type: application/json
    Accept: application/json
    ```
    
    ## 📊 Códigos de Estado HTTP
    | Código | Descripción | Uso |
    |--------|-------------|-----|
    | 200 | OK | Operación exitosa |
    | 201 | Created | Recurso creado exitosamente |
    | 400 | Bad Request | Error de validación |
    | 401 | Unauthorized | Token inválido o expirado |
    | 403 | Forbidden | Sin permisos para la operación |
    | 404 | Not Found | Recurso no encontrado |
    | 429 | Too Many Requests | Límite de rate limit excedido |
    | 500 | Internal Server Error | Error interno del servidor |
    
    ## 🚦 Rate Limiting
    - **Usuarios autenticados**: 1000 requests/hora
    - **Usuarios no autenticados**: 100 requests/hora
    - **Endpoints de autenticación**: 10 requests/minuto
    
    ## 📖 Documentación Adicional
    - [Guía de Integración](https://docs.beneficio.com/integration)
    - [Ejemplos de Código](https://docs.beneficio.com/examples)
    - [SDK para Desarrolladores](https://docs.beneficio.com/sdk)
    
    ## 🆘 Soporte Técnico
    - 📧 **Email**: soporte@beneficio.com
    - 📞 **Teléfono**: +502 1234-5678
    - 💬 **Chat**: Disponible en el panel de administración
    - 📚 **Documentación**: https://docs.beneficio.com
    
    ---
    *Desarrollado con ❤️ para la industria cafetalera guatemalteca*
    ''',
    'VERSION': '2.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/v1/',
    'TAGS': [
        {'name': '🔐 Authentication', 'description': 'Autenticación JWT, registro y gestión de tokens'},
        {'name': '👥 Users', 'description': 'Gestión de usuarios, perfiles y permisos'},
        {'name': '🏭 Areas', 'description': 'Gestión de áreas de procesamiento del beneficio'},
        {'name': '🌡️ Sensors', 'description': 'Monitoreo IoT y gestión de sensores'},
        {'name': '📊 Temperatures', 'description': 'Lecturas de temperatura en tiempo real'},
        {'name': '📍 Occupation', 'description': 'Control de ocupación y disponibilidad de áreas'},
        {'name': '📦 Lots', 'description': 'Gestión completa de lotes de café'},
        {'name': '🍃 Fermentation', 'description': 'Control de procesos de fermentación'},
        {'name': '☕ Cupping', 'description': 'Sistema profesional de catación SCA/CVA'},
        {'name': '👷 Employees', 'description': 'Gestión de empleados y personal'},
        {'name': '⏰ Attendance', 'description': 'Control de asistencia y horarios'},
        {'name': '🚚 Suppliers', 'description': 'Gestión de proveedores y materias primas'},
        {'name': '📋 Inventory', 'description': 'Control de inventario y almacén'},
        {'name': '📊 Reports', 'description': 'Generación de reportes y analytics'},
        {'name': '🔔 Notifications', 'description': 'Sistema de notificaciones y alertas'},
        {'name': '📈 Dashboard', 'description': 'Dashboard ejecutivo y métricas KPI'},
        {'name': '💾 Backup', 'description': 'Sistema de backup automático y recuperación'},
    ],
    'EXTENSIONS_INFO': {
        'x-logo': {
            'url': '/static/images/logo-api.png',
            'altText': 'Sistema de Beneficio de Café - API Profesional',
            'backgroundColor': '#8B4513'
        },
        'x-theme': {
            'primaryColor': '#8B4513',
            'secondaryColor': '#D2691E'
        }
    },
    'CONTACT': {
        'name': '🏢 Equipo de Desarrollo - Beneficio de Café',
        'email': 'soporte@beneficio.com',
        'url': 'https://beneficio.com/contact'
    },
    'LICENSE': {
        'name': 'MIT License',
        'url': 'https://opensource.org/licenses/MIT'
    },
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
        'filter': True,
        'tryItOutEnabled': True,
        'requestSnippetsEnabled': True,
        'requestSnippets': {
            'generators': {
                'curl_bash': {
                    'title': 'cURL (bash)',
                    'syntax': 'bash'
                },
                'curl_powershell': {
                    'title': 'cURL (PowerShell)',
                    'syntax': 'powershell'
                },
                'curl_cmd': {
                    'title': 'cURL (CMD)',
                    'syntax': 'bash'
                },
                'javascript_fetch': {
                    'title': 'JavaScript (fetch)',
                    'syntax': 'javascript'
                },
                'python_requests': {
                    'title': 'Python (requests)',
                    'syntax': 'python'
                }
            }
        },
        'layout': 'StandaloneLayout',
        'validatorUrl': None,
        'plugins': [
            'TopbarPlugin',
            'FilterPlugin',
            'LayoutPlugin'
        ],
        'presets': [
            'SwaggerUIStandalonePreset'
        ]
    },
    'REDOC_UI_SETTINGS': {
        'hideDownloadButton': False,
        'expandResponses': '200,201',
        'pathInMiddlePanel': True,
        'theme': {
            'colors': {
                'primary': {
                    'main': '#8B4513'
                }
            },
            'typography': {
                'fontSize': '14px',
                'lineHeight': '1.5em',
                'code': {
                    'fontSize': '13px'
                }
            }
        },
        'nativeScrollbars': False,
        'requiredPropsFirst': True,
        'sortPropsAlphabetically': False
    },
    'PREPROCESSING_HOOKS': [
        'drf_spectacular.hooks.preprocessing_filter_spec'
    ],
    'POSTPROCESSING_HOOKS': [
        'drf_spectacular.hooks.postprocessing_schema_format_field',
        'drf_spectacular.hooks.postprocessing_schema_format_field_factory',
        'drf_spectacular.hooks.postprocessing_schema_format_field_serializer'
    ],
    'SERVE_PERMISSIONS': ['rest_framework.permissions.AllowAny'],
    'SERVE_AUTHENTICATION': None,
}

# Logging
import os
import logging

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'beneficio': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Only add file logging in non-CI environments
if not os.environ.get('CI') and not os.environ.get('GITHUB_ACTIONS'):
    LOGGING['root']['handlers'].append('file')
    LOGGING['loggers']['django']['handlers'].append('file')
    LOGGING['loggers']['beneficio']['handlers'].append('file')

# Jazzmin Admin Configuration
JAZZMIN_SETTINGS = {
    # title of the window (Will default to current_admin_site.site_title if absent or None)
    "site_title": "Beneficio Admin",
    
    # Title on the login screen (19 chars max) (defaults to current_admin_site.site_header if absent or None)
    "site_header": "Beneficio de Café",
    
    # Title on the brand (19 chars max) (defaults to current_admin_site.site_header if absent or None)
    "site_brand": "Beneficio",
    
    # Logo to use for your site, must be present in static files, used for brand on top left
    "site_logo": None,
    
    # Logo to use for your site, must be present in static files, used for login form logo (defaults to site_logo)
    "login_logo": None,
    
    # CSS classes that are applied to the logo above
    "site_logo_classes": "img-circle",
    
    # Relative path to a favicon for your site, will default to site_logo if absent (ideally 32x32 px)
    "site_icon": None,
    
    # Welcome text on the login screen
    "welcome_sign": "Bienvenido al Sistema de Gestión",
    
    # Copyright on the footer
    "copyright": "Beneficio de Café",
    
    # Field name on user model that contains avatar ImageField/URLField/Charfield or a callable that receives the user
    "user_avatar": None,
    
    ############
    # Top Menu #
    ############
    
    # Links to put along the top menu
    "topmenu_links": [
        # Url that gets reversed (Permissions can be added)
        {"name": "Inicio", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "Dashboard Avanzado", "url": "/api/v1/advanced-dashboard/", "permissions": ["auth.view_user"]},
        
        # external url that opens in a new window (Permissions can be added)
        {"name": "API Docs", "url": "/api/docs/", "new_window": True},
        {"name": "API Redoc", "url": "/api/redoc/", "new_window": True},
        
        # model admin to link to (Permissions checked against model)
        {"model": "auth.User"},
    ],
    
    #############
    # User Menu #
    #############
    
    # Additional links to include in the user menu on the top right ("app" url type is not allowed)
    "usermenu_links": [
        {"model": "auth.user"}
    ],
    
    #############
    # Side Menu #
    #############
    
    # Whether to display the side menu
    "show_sidebar": True,
    
    # Whether to aut expand the menu
    "navigation_expanded": True,
    
    # Hide these apps when generating side menu e.g (auth)
    "hide_apps": [],
    
    # Hide these models when generating side menu (e.g auth.user)
    "hide_models": [],
    
    # List of apps (and/or models) to base side menu ordering off of (does not need to contain all apps/models)
    "order_with_respect_to": [
        "auth",
        "core",
        "areas",
        "sensors",
        "temperatures",
        "occupation",
        "lots",
        "fermentation",
        "cupping",
        "employees",
        "attendance",
    ],
    
    # Custom icons for side menu apps/models See https://fontawesome.com/icons?d=gallery&m=free&v=5.0.0,5.0.1,5.0.10,5.0.11,5.0.12,5.0.13,5.0.2,5.0.3,5.0.4,5.0.5,5.0.6,5.0.7,5.0.8,5.0.9,5.1.0,5.1.1,5.2.0,5.3.0,5.3.1,5.4.0,5.4.1,5.4.2,5.13.0,5.12.0,5.11.2,5.11.1,5.10.0,5.9.0,5.8.2,5.8.1,5.7.2,5.7.1,5.7.0,5.6.3,5.5.0,5.4.2
    # for the full list of 5.13.0 free icon classes
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.user": "fas fa-user",
        "auth.Group": "fas fa-users",
        
        "core": "fas fa-home",
        "core.User": "fas fa-user-circle",
        
        "areas": "fas fa-map-marked-alt",
        "areas.Area": "fas fa-map-marker-alt",
        
        "sensors": "fas fa-microchip",
        "sensors.Sensor": "fas fa-thermometer-half",
        
        "temperatures": "fas fa-temperature-high",
        "temperatures.Temperature": "fas fa-chart-line",
        
        "occupation": "fas fa-users",
        "occupation.Occupation": "fas fa-user-check",
        
        "lots": "fas fa-box",
        "lots.Lot": "fas fa-boxes",
        
        "fermentation": "fas fa-flask",
        "fermentation.FermentationBatch": "fas fa-vial",
        
        "cupping": "fas fa-coffee",
        "cupping.Cupping": "fas fa-mug-hot",
        "cupping.CommercialCupping": "fas fa-clipboard-check",
        "cupping.CuppingSample": "fas fa-vials",
        "cupping.Cupper": "fas fa-user-tie",
        "cupping.CuppingScore": "fas fa-star",
        
        "employees": "fas fa-id-card",
        "employees.Employee": "fas fa-user-tag",
        
        "attendance": "fas fa-calendar-check",
        "attendance.Attendance": "fas fa-clock",
    },
    
    # Icons that are used when one is not manually specified
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    
    #################
    # Related Modal #
    #################
    # Use modals instead of popups
    "related_modal_active": False,
    
    #############
    # UI Tweaks #
    #############
    
    # Relative paths to custom CSS/JS scripts (must be present in static files)
    "custom_css": None,
    "custom_js": None,
    
    # Whether to link font from fonts.googleapis.com (use custom_css to supply font otherwise)
    "use_google_fonts_cdn": True,
    
    # Whether to show the UI customizer on the sidebar
    "show_ui_builder": False,
    
    ###############
    # Change view #
    ###############
    # Render out the change view as a single form, or in tabs, current options are
    # - single
    # - horizontal_tabs (default)
    # - vertical_tabs
    # - collapsible
    # - carousel
    "changeform_format": "horizontal_tabs",
    
    # override change forms on a per modeladmin basis
    "changeform_format_overrides": {
        "auth.user": "collapsible",
        "auth.group": "vertical_tabs",
    },
}

# Jazzmin UI Tweaks
JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-brown",
    "accent": "accent-coffee",
    "navbar": "navbar-dark navbar-brown",
    "no_navbar_border": False,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-brown",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "flatly",
    "dark_mode_theme": "darkly",
    "button_classes": {
        "primary": "btn-primary",
        "secondary": "btn-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    },
    "actions_sticky_top": True,
}
