#!/bin/bash

# Script de configuración para Sistema de Beneficio de Café
# Ejecutar con: bash setup.sh

set -e

echo "☕ Configurando Sistema de Beneficio de Café..."
echo "=============================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar requisitos
print_status "Verificando requisitos del sistema..."

# Verificar Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 no está instalado. Por favor instálalo primero."
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
print_success "Python $PYTHON_VERSION encontrado"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Por favor instálalo primero."
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js $NODE_VERSION encontrado"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado. Por favor instálalo primero."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm $NPM_VERSION encontrado"

echo ""
print_status "Configurando Backend (Django)..."
echo "=================================="

cd backend

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    print_status "Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
print_status "Activando entorno virtual..."
source venv/bin/activate

# Actualizar pip
print_status "Actualizando pip..."
pip install --upgrade pip

# Instalar dependencias
print_status "Instalando dependencias de Python..."
pip install -r requirements.txt

# Ejecutar migraciones
print_status "Ejecutando migraciones de base de datos..."
python manage.py migrate

# Inicializar roles
print_status "Inicializando roles por defecto..."
python manage.py init_roles

print_success "Backend configurado correctamente"

echo ""
print_status "Configurando Frontend (React)..."
echo "==================================="

cd ../frontend

# Instalar dependencias
print_status "Instalando dependencias de Node.js..."
npm install

print_success "Frontend configurado correctamente"

echo ""
print_status "Creando archivos de configuración..."
echo "======================================="

# Crear archivo .env para backend
cd ../backend
if [ ! -f ".env" ]; then
    cat > .env << EOF
DEBUG=True
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173
EOF
    print_success "Archivo .env creado para backend"
fi

# Crear archivo .env para frontend
cd ../frontend
if [ ! -f ".env" ]; then
    cat > .env << EOF
VITE_API_URL=http://localhost:8000/api/v1
EOF
    print_success "Archivo .env creado para frontend"
fi

echo ""
print_success "🎉 ¡Configuración completada exitosamente!"
echo ""
print_status "Para iniciar el sistema:"
echo ""
echo "Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo "Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
print_status "URLs de acceso:"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:8000/api/v1/"
echo "  Documentación API: http://localhost:8000/api/docs/"
echo "  Admin Django: http://localhost:8000/admin/"
echo ""
print_warning "No olvides crear un superusuario con:"
echo "  python manage.py createsuperuser"
echo ""
print_success "¡Disfruta del Sistema de Beneficio de Café! ☕"