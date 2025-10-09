#!/bin/bash

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         MONITOR DE TESTSPRITE - BENEFICIO                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Función para verificar procesos de TestSprite
check_testsprite() {
    TESTSPRITE_COUNT=$(ps aux | grep -i testsprite | grep -v grep | wc -l | tr -d ' ')
    
    if [ "$TESTSPRITE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓ TestSprite está ejecutándose${NC}"
        echo -e "  Procesos activos: ${YELLOW}$TESTSPRITE_COUNT${NC}"
        echo ""
        
        # Mostrar procesos
        echo -e "${BLUE}Procesos de TestSprite:${NC}"
        ps aux | grep -i testsprite | grep -v grep | awk '{print "  - PID: " $2 " | CPU: " $3 "% | Mem: " $4 "% | " $11}'
        echo ""
    else
        echo -e "${RED}✗ TestSprite NO está ejecutándose${NC}"
        echo ""
    fi
}

# Función para verificar servicios del proyecto
check_services() {
    echo -e "${BLUE}Servicios del Proyecto:${NC}"
    
    # Frontend
    if lsof -i :5173 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Frontend (Puerto 5173): ${GREEN}ACTIVO${NC}"
    else
        echo -e "  ${RED}✗${NC} Frontend (Puerto 5173): ${RED}INACTIVO${NC}"
    fi
    
    # Backend
    if lsof -i :8000 > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Backend (Puerto 8000): ${GREEN}ACTIVO${NC}"
    else
        echo -e "  ${RED}✗${NC} Backend (Puerto 8000): ${RED}INACTIVO${NC}"
    fi
    echo ""
}

# Función para verificar uso de recursos
check_resources() {
    echo -e "${BLUE}Uso de Recursos:${NC}"
    
    # CPU y Memoria de Node (Frontend)
    NODE_STATS=$(ps aux | grep "vite" | grep -v grep | awk '{print "  Frontend - CPU: " $3 "% | Mem: " $4 "%"}')
    if [ -n "$NODE_STATS" ]; then
        echo -e "${YELLOW}$NODE_STATS${NC}"
    fi
    
    # CPU y Memoria de Python (Backend)
    PYTHON_STATS=$(ps aux | grep "runserver" | grep -v grep | head -1 | awk '{print "  Backend  - CPU: " $3 "% | Mem: " $4 "%"}')
    if [ -n "$PYTHON_STATS" ]; then
        echo -e "${YELLOW}$PYTHON_STATS${NC}"
    fi
    echo ""
}

# Función para verificar logs recientes
check_logs() {
    echo -e "${BLUE}Actividad Reciente:${NC}"
    
    # Verificar si hay errores en consola del frontend
    if [ -d "frontend/node_modules/.vite" ]; then
        echo -e "  ${GREEN}✓${NC} Cache de Vite presente"
    fi
    
    # Verificar última modificación de archivos
    LAST_MODIFIED=$(find frontend/src -type f -name "*.tsx" -o -name "*.ts" | xargs ls -lt | head -1 | awk '{print $9}')
    if [ -n "$LAST_MODIFIED" ]; then
        echo -e "  Último archivo modificado: ${YELLOW}$LAST_MODIFIED${NC}"
    fi
    echo ""
}

# Función para mostrar tiempo de ejecución
show_runtime() {
    if [ "$TESTSPRITE_COUNT" -gt 0 ]; then
        # Obtener tiempo de inicio del proceso más antiguo de TestSprite
        OLDEST_PID=$(ps aux | grep -i testsprite | grep -v grep | awk '{print $2}' | head -1)
        if [ -n "$OLDEST_PID" ]; then
            START_TIME=$(ps -p $OLDEST_PID -o lstart= 2>/dev/null)
            if [ -n "$START_TIME" ]; then
                echo -e "${BLUE}Tiempo de Ejecución:${NC}"
                echo -e "  Inicio: ${YELLOW}$START_TIME${NC}"
                echo ""
            fi
        fi
    fi
}

# Función para mostrar estadísticas
show_stats() {
    echo -e "${BLUE}Estadísticas del Proyecto:${NC}"
    
    # Contar archivos TypeScript
    TS_FILES=$(find frontend/src -name "*.tsx" -o -name "*.ts" | wc -l | tr -d ' ')
    echo -e "  Archivos TypeScript: ${YELLOW}$TS_FILES${NC}"
    
    # Contar archivos Python
    PY_FILES=$(find backend/apps -name "*.py" | wc -l | tr -d ' ')
    echo -e "  Archivos Python: ${YELLOW}$PY_FILES${NC}"
    
    # Tamaño del bundle si existe
    if [ -d "frontend/dist" ]; then
        BUNDLE_SIZE=$(du -sh frontend/dist 2>/dev/null | awk '{print $1}')
        echo -e "  Tamaño del bundle: ${YELLOW}$BUNDLE_SIZE${NC}"
    fi
    echo ""
}

# Función principal
main() {
    check_testsprite
    check_services
    check_resources
    show_runtime
    check_logs
    show_stats
    
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Presiona Ctrl+C para salir | Actualizando cada 5s...     ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

# Modo de monitoreo continuo
if [ "$1" == "--watch" ] || [ "$1" == "-w" ]; then
    while true; do
        clear
        main
        sleep 5
    done
else
    main
fi
