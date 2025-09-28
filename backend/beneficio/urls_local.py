"""
Local development URLs - includes logs URLs
"""
from .urls import urlpatterns

# Add logs URLs back for local development
from django.urls import path, include

# Insert logs URLs before the end
urlpatterns.insert(-1, path('api/v1/logs/', include('apps.logs.urls')))

print("🔧 Local development mode: logs URLs enabled")
