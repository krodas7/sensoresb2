#!/bin/bash

# Script para reiniciar el servicio de báscula camionera de manera controlada
# API Beneficio - Sistema de monitoreo automático

SERVICE_NAME="bascula-camionera-sensor-client"
LOG_FILE="/var/log/bascula-restart.log"

# Función para loggear con timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | sudo tee -a "$LOG_FILE"
}

log_message "=== Iniciando reinicio programado del servicio $SERVICE_NAME ==="

# Verificar si el servicio está activo
if systemctl is-active --quiet "$SERVICE_NAME"; then
    log_message "Servicio $SERVICE_NAME está activo, procediendo con reinicio..."
    
    # Detener el servicio de manera controlada
    log_message "Deteniendo servicio $SERVICE_NAME..."
    if sudo systemctl stop "$SERVICE_NAME"; then
        log_message "Servicio detenido exitosamente"
        
        # Esperar un momento para que se liberen recursos
        sleep 5
        
        # Iniciar el servicio nuevamente
        log_message "Iniciando servicio $SERVICE_NAME..."
        if sudo systemctl start "$SERVICE_NAME"; then
            log_message "Servicio reiniciado exitosamente"
            
            # Verificar que está funcionando
            sleep 10
            if systemctl is-active --quiet "$SERVICE_NAME"; then
                log_message "Verificación: Servicio $SERVICE_NAME está funcionando correctamente"
            else
                log_message "ERROR: Servicio $SERVICE_NAME no se inició correctamente"
                exit 1
            fi
        else
            log_message "ERROR: No se pudo iniciar el servicio $SERVICE_NAME"
            exit 1
        fi
    else
        log_message "ERROR: No se pudo detener el servicio $SERVICE_NAME"
        exit 1
    fi
else
    log_message "WARNING: Servicio $SERVICE_NAME no está activo, iniciando..."
    if sudo systemctl start "$SERVICE_NAME"; then
        log_message "Servicio $SERVICE_NAME iniciado exitosamente"
    else
        log_message "ERROR: No se pudo iniciar el servicio $SERVICE_NAME"
        exit 1
    fi
fi

log_message "=== Reinicio programado completado ==="

