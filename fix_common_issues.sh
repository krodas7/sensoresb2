#!/bin/bash

echo "🔧 Script de Arreglos Automáticos - Beneficio"
echo "=============================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar progreso
show_progress() {
    echo -e "${YELLOW}▶ $1${NC}"
}

show_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

show_error() {
    echo -e "${RED}✗ $1${NC}"
}

# 1. Limpiar node_modules y reinstalar (arregla problemas de dependencias)
fix_dependencies() {
    show_progress "Limpiando y reinstalando dependencias del frontend..."
    cd frontend
    rm -rf node_modules package-lock.json
    npm install
    show_success "Dependencias reinstaladas"
    cd ..
}

# 2. Limpiar cache de Vite
fix_vite_cache() {
    show_progress "Limpiando cache de Vite..."
    cd frontend
    rm -rf node_modules/.vite
    rm -rf dist
    show_success "Cache de Vite limpiado"
    cd ..
}

# 3. Verificar y arreglar imports no utilizados (TypeScript)
fix_unused_imports() {
    show_progress "Buscando imports no utilizados..."
    cd frontend
    # Esto solo reporta, no arregla automáticamente
    npm run type-check 2>&1 | grep "is declared but" || show_success "No se encontraron imports obvios sin usar"
    cd ..
}

# 4. Formatear código (si tienes prettier)
format_code() {
    show_progress "Formateando código..."
    cd frontend
    if [ -f ".prettierrc" ]; then
        npx prettier --write "src/**/*.{ts,tsx,js,jsx}"
        show_success "Código formateado"
    else
        show_error "Prettier no configurado"
    fi
    cd ..
}

# 5. Limpiar archivos temporales
clean_temp_files() {
    show_progress "Limpiando archivos temporales..."
    find . -name ".DS_Store" -delete
    find . -name "*.pyc" -delete
    find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null
    show_success "Archivos temporales limpiados"
}

# 6. Verificar estado de Git
check_git_status() {
    show_progress "Verificando estado de Git..."
    if [ -n "$(git status --porcelain)" ]; then
        show_error "Hay cambios sin commitear"
        git status --short
    else
        show_success "Git limpio"
    fi
}

# 7. Construir frontend para verificar errores
build_frontend() {
    show_progress "Construyendo frontend..."
    cd frontend
    npm run build
    if [ $? -eq 0 ]; then
        show_success "Build exitoso"
    else
        show_error "Build falló - revisar errores"
        return 1
    fi
    cd ..
}

# 8. Verificar backend
check_backend() {
    show_progress "Verificando backend..."
    cd backend
    source venv/bin/activate
    python manage.py check
    if [ $? -eq 0 ]; then
        show_success "Backend OK"
    else
        show_error "Backend tiene problemas"
        return 1
    fi
    cd ..
}

# Menú principal
echo "Selecciona qué arreglar:"
echo "1. Todo (recomendado después de auditoría)"
echo "2. Solo dependencias"
echo "3. Solo cache"
echo "4. Solo verificaciones"
echo "5. Solo build"
echo "6. Salir"
echo ""
read -p "Opción: " option

case $option in
    1)
        echo ""
        echo "🚀 Ejecutando todos los arreglos..."
        echo ""
        clean_temp_files
        fix_vite_cache
        fix_dependencies
        fix_unused_imports
        build_frontend
        check_backend
        check_git_status
        echo ""
        show_success "¡Todos los arreglos completados!"
        ;;
    2)
        fix_dependencies
        ;;
    3)
        fix_vite_cache
        ;;
    4)
        fix_unused_imports
        check_backend
        check_git_status
        ;;
    5)
        build_frontend
        ;;
    6)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        show_error "Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "=============================================="
echo "✅ Script completado"
echo "=============================================="
