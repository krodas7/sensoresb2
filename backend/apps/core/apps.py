from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.core'
    verbose_name = 'Core'
    
    def ready(self):
        """Import auditlog configuration when Django starts"""
        try:
            from . import auditlog_config
        except ImportError:
            pass