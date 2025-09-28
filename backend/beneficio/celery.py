"""
Celery configuration for beneficio project
"""

import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'beneficio.settings')

app = Celery('beneficio')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat schedule
app.conf.beat_schedule = {
    'check-sensor-status': {
        'task': 'apps.core.tasks.check_sensor_status',
        'schedule': 300.0,  # Every 5 minutes
    },
    'generate-daily-reports': {
        'task': 'apps.reports.tasks.generate_daily_reports',
        'schedule': 86400.0,  # Every 24 hours
    },
    'cleanup-old-readings': {
        'task': 'apps.temperatures.tasks.cleanup_old_readings',
        'schedule': 3600.0,  # Every hour
    },
}

app.conf.timezone = 'America/Guatemala'


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
