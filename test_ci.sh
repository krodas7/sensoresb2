#!/bin/bash

echo "🧪 Testing CI/CD Pipeline Locally..."

# Test Backend
echo "📦 Testing Backend..."
cd backend
source venv/bin/activate

# Set environment variables like in CI
export DATABASE_URL="sqlite:///test.db"
export DEBUG=False
export SECRET_KEY="test-secret-key-for-ci"
export ALLOWED_HOSTS="localhost,127.0.0.1"

# Test Django setup
echo "  ✓ Django check..."
python manage.py check

# Test migrations
echo "  ✓ Running migrations..."
python manage.py migrate

# Test init_roles
echo "  ✓ Initializing roles..."
python manage.py init_roles

# Test basic functionality
echo "  ✓ Testing basic functionality..."
python manage.py test apps.core.test_simple --verbosity=0

cd ..

# Test Frontend
echo "📦 Testing Frontend..."
cd frontend

# Test build
echo "  ✓ Running build..."
npm run build

echo "✅ All tests passed! CI/CD should work correctly."
