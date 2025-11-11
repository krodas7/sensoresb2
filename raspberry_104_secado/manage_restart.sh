#!/bin/bash

# Script para gestionar el reinicio programado del servicio de secado
# API Beneficio - Sistema de monitoreo automático

SERVICE_NAME="secado-sensor-client"
TIMER_NAME="secado-restart.timer"
RESTART_SERVICE_NAME="secado-restart.service"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}=== Gestor de Reinicio Programado - API Beneficio (Secado) ===${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  status     - Ver estado del servicio y timer"
    echo "  start      - Iniciar el servicio principal"
    echo "  stop       - Detener el servicio principal"
    echo "  restart    - Reiniciar manualmente el servicio"
    echo "  enable     - Habilitar reinicio automático cada 3 horas"
    echo "  disable    - Deshabilitar reinicio automático"
    echo "  logs       - Ver logs del servicio principal"
    echo "  restart-logs - Ver logs de reinicios programados"
    echo "  next       - Ver cuándo será el próximo reinicio"
    echo "  force-restart - Forzar reinicio programado ahora"
    echo "  help       - Mostrar esta ayuda"
    echo ""
}

# Función para verificar si el servicio está activo
check_service_status() {
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo -e "${GREEN}✅ Servicio $SERVICE_NAME está activo${NC}"
        return 0
    else
        echo -e "${RED}❌ Servicio $SERVICE_NAME no está activo${NC}"
        return 1
    fi
}

# Función para verificar si el timer está activo
check_timer_status() {
    if systemctl is-active --quiet "$TIMER_NAME"; then
        echo -e "${GREEN}✅ Timer de reinicio está activo${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Timer de reinicio no está activo${NC}"
        return 1
    fi
}

# Función para mostrar estado completo
show_status() {
    echo -e "${BLUE}=== Estado del Sistema de Secado ===${NC}"
    echo ""
    
    echo -e "${YELLOW}Servicio Principal:${NC}"
    check_service_status
    echo ""
    
    echo -e "${YELLOW}Timer de Reinicio:${NC}"
    check_timer_status
    echo ""
    
    echo -e "${YELLOW}Información del Timer:${NC}"
    systemctl list-timers "$TIMER_NAME" --no-pager
    echo ""
    
    echo -e "${YELLOW}Últimos logs del servicio:${NC}"
    sudo journalctl -u "$SERVICE_NAME" -n 5 --no-pager
}

# Función para iniciar el servicio
start_service() {
    echo -e "${BLUE}Iniciando servicio $SERVICE_NAME...${NC}"
    if sudo systemctl start "$SERVICE_NAME"; then
        echo -e "${GREEN}✅ Servicio iniciado exitosamente${NC}"
        check_service_status
    else
        echo -e "${RED}❌ Error al iniciar el servicio${NC}"
        exit 1
    fi
}

# Función para detener el servicio
stop_service() {
    echo -e "${BLUE}Deteniendo servicio $SERVICE_NAME...${NC}"
    if sudo systemctl stop "$SERVICE_NAME"; then
        echo -e "${GREEN}✅ Servicio detenido exitosamente${NC}"
    else
        echo -e "${RED}❌ Error al detener el servicio${NC}"
        exit 1
    fi
}

# Función para reiniciar el servicio
restart_service() {
    echo -e "${BLUE}Reiniciando servicio $SERVICE_NAME...${NC}"
    if sudo systemctl restart "$SERVICE_NAME"; then
        echo -e "${GREEN}✅ Servicio reiniciado exitosamente${NC}"
        check_service_status
    else
        echo -e "${RED}❌ Error al reiniciar el servicio${NC}"
        exit 1
    fi
}

# Función para habilitar reinicio automático
enable_auto_restart() {
    echo -e "${BLUE}Habilitando reinicio automático cada 3 horas...${NC}"
    
    if sudo systemctl enable "$TIMER_NAME"; then
        echo -e "${GREEN}✅ Timer de reinicio habilitado${NC}"
    else
        echo -e "${RED}❌ Error al habilitar el timer${NC}"
        exit 1
    fi
    
    if sudo systemctl start "$TIMER_NAME"; then
        echo -e "${GREEN}✅ Timer de reinicio iniciado${NC}"
        check_timer_status
    else
        echo -e "${RED}❌ Error al iniciar el timer${NC}"
        exit 1
    fi
}

# Función para deshabilitar reinicio automático
disable_auto_restart() {
    echo -e "${BLUE}Deshabilitando reinicio automático...${NC}"
    
    if sudo systemctl stop "$TIMER_NAME"; then
        echo -e "${GREEN}✅ Timer de reinicio detenido${NC}"
    else
        echo -e "${RED}❌ Error al detener el timer${NC}"
        exit 1
    fi
    
    if sudo systemctl disable "$TIMER_NAME"; then
        echo -e "${GREEN}✅ Timer de reinicio deshabilitado${NC}"
    else
        echo -e "${RED}❌ Error al deshabilitar el timer${NC}"
        exit 1
    fi
}

# Función para mostrar logs
show_logs() {
    echo -e "${BLUE}=== Logs del Servicio Principal ===${NC}"
    sudo journalctl -u "$SERVICE_NAME" -f --no-pager
}

# Función para mostrar logs de reinicios
show_restart_logs() {
    echo -e "${BLUE}=== Logs de Reinicios Programados ===${NC}"
    sudo journalctl -u "$RESTART_SERVICE_NAME" -f --no-pager
}

# Función para mostrar próximo reinicio
show_next_restart() {
    echo -e "${BLUE}=== Próximo Reinicio Programado ===${NC}"
    systemctl list-timers "$TIMER_NAME" --no-pager
}

# Función para forzar reinicio programado
force_restart() {
    echo -e "${BLUE}Ejecutando reinicio programado manualmente...${NC}"
    if sudo systemctl start "$RESTART_SERVICE_NAME"; then
        echo -e "${GREEN}✅ Reinicio programado ejecutado exitosamente${NC}"
        sleep 5
        check_service_status
    else
        echo -e "${RED}❌ Error al ejecutar reinicio programado${NC}"
        exit 1
    fi
}

# Procesar argumentos
case "$1" in
    status)
        show_status
        ;;
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    enable)
        enable_auto_restart
        ;;
    disable)
        disable_auto_restart
        ;;
    logs)
        show_logs
        ;;
    restart-logs)
        show_restart_logs
        ;;
    next)
        show_next_restart
        ;;
    force-restart)
        force_restart
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Comando no reconocido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
