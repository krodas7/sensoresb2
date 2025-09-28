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
    'apps.reports',
    'apps.logs',  # Re-enabled for local development
    'apps.notifications',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

print("🔧 Local development mode: logs module enabled")
