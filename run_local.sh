#!/bin/bash

echo "🚀 Starting Beneficio in LOCAL DEVELOPMENT mode"
echo "📝 Logs module: ENABLED"
echo "🔧 Configuration: settings_local.py"

cd backend
source venv/bin/activate

# Use local settings that include logs
export DJANGO_SETTINGS_MODULE=beneficio.settings_local

# Run migrations with logs enabled
echo "📦 Running migrations with logs enabled..."
python manage.py migrate

# Initialize roles
echo "👥 Initializing roles..."
python manage.py init_roles

# Start server
echo "🌐 Starting Django server..."
python manage.py runserver
