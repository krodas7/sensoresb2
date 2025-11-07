#!/bin/bash

# Script de instalación del servicio de sensores de fermentación para Raspberry Pi
# API Beneficio - Sistema de monitoreo automático

set -e

echo "=== Instalador del Cliente de Sensores de Fermentación - API Beneficio ==="
echo ""

# Verificar que estamos en Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️  ADVERTENCIA: Este script está diseñado para Raspberry Pi"
    echo "   Continuando de todas formas..."
fi

# Verificar Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 no está instalado"
    exit 1
fi

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ Error: pip3 no está instalado"
    exit 1
fi

# Obtener directorio actual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="fermentacion-sensor-client"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "📁 Directorio del proyecto: $SCRIPT_DIR"
echo ""

# 1. Instalar dependencias de Python
echo "📦 Instalando dependencias de Python..."

# Verificar si ya existe un entorno virtual
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "🔧 Creando entorno virtual..."
    python3 -m venv "$SCRIPT_DIR/venv"
    
    # Verificar que el entorno virtual se creó correctamente
    if [ ! -f "$SCRIPT_DIR/venv/bin/pip" ]; then
        echo "❌ Error: No se pudo crear el entorno virtual"
        exit 1
    fi
    echo "✅ Entorno virtual creado correctamente"
else
    echo "✅ Entorno virtual ya existe"
fi

# Instalar dependencias en entorno virtual
echo "📦 Instalando dependencias en entorno virtual..."
"$SCRIPT_DIR/venv/bin/pip" install --upgrade pip
"$SCRIPT_DIR/venv/bin/pip" install -r "$SCRIPT_DIR/requirements.txt"

# 2. Hacer el script ejecutable
echo "🔧 Configurando permisos..."
chmod +x "$SCRIPT_DIR/raspberry_sensor_client.py"

# 3. Crear el archivo de servicio systemd
echo "⚙️  Configurando servicio systemd..."

# Obtener el usuario actual
CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn "$CURRENT_USER")

echo "👤 Usuario actual: $CURRENT_USER"
echo "👥 Grupo actual: $CURRENT_GROUP"

# Actualizar el archivo de servicio con la ruta correcta
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=API Beneficio - Cliente de Sensores de Fermentación Raspberry Pi
After=network.target
Wants=network.target

[Service]
Type=simple
User=$CURRENT_USER
Group=$CURRENT_GROUP
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/raspberry_sensor_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Variables de entorno
Environment=PYTHONPATH=$SCRIPT_DIR
Environment=PYTHONUNBUFFERED=1

# Configuración de logging
SyslogIdentifier=fermentacion-sensor-client

[Install]
WantedBy=multi-user.target
EOF

# 4. Configurar script de reinicio
echo "🔧 Configurando script de reinicio programado..."
chmod +x "$SCRIPT_DIR/restart_service.sh"

# 5. Crear servicios de reinicio programado
echo "⏰ Configurando reinicio programado cada 3 horas..."

# Copiar archivos de servicio y timer
sudo cp "$SCRIPT_DIR/fermentacion-restart.service" /etc/systemd/system/
sudo cp "$SCRIPT_DIR/fermentacion-restart.timer" /etc/systemd/system/

# 6. Recargar systemd y habilitar servicios
echo "🔄 Recargando configuración de systemd..."
sudo systemctl daemon-reload

echo "✅ Habilitando servicio principal $SERVICE_NAME..."
sudo systemctl enable "$SERVICE_NAME"

echo "✅ Habilitando timer de reinicio programado..."
sudo systemctl enable fermentacion-restart.timer

echo ""
echo "🎉 ¡Instalación completada!"
echo ""
echo "📋 Comandos útiles:"
echo "   Iniciar servicio:     sudo systemctl start $SERVICE_NAME"
echo "   Detener servicio:     sudo systemctl stop $SERVICE_NAME"
echo "   Ver estado:          sudo systemctl status $SERVICE_NAME"
echo "   Ver logs:            sudo journalctl -u $SERVICE_NAME -f"
echo "   Reiniciar servicio:  sudo systemctl restart $SERVICE_NAME"
echo ""
echo "⏰ Comandos del reinicio programado:"
echo "   Ver estado timer:    sudo systemctl status fermentacion-restart.timer"
echo "   Ver logs reinicio:   sudo journalctl -u fermentacion-restart.service"
echo "   Reinicio manual:     sudo systemctl start fermentacion-restart.service"
echo "   Ver próximos reinicios: sudo systemctl list-timers fermentacion-restart.timer"
echo ""
echo "🚀 El servicio se iniciará automáticamente al reiniciar la Raspberry Pi"
echo "🔄 El servicio se reiniciará automáticamente cada 3 horas para prevenir problemas"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que:"
echo "   - Los sensores HC-SR04 estén conectados correctamente"
echo "   - La API esté funcionando en 192.168.0.150:8000"
echo "   - La red esté configurada correctamente"
echo ""
echo "🔍 Para verificar que todo funciona:"
echo "   sudo systemctl start $SERVICE_NAME"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "📡 Conexiones HC-SR04 para Pilas de Fermentación:"
echo "   Pila 1: TRIG=GPIO23, ECHO=GPIO24"
echo "   Pila 2: TRIG=GPIO17, ECHO=GPIO27"
echo "   Pila 3: TRIG=GPIO22, ECHO=GPIO5"
echo "   Pila 4: TRIG=GPIO6,  ECHO=GPIO13"
echo "   Pila 5: TRIG=GPIO19, ECHO=GPIO26"
echo "   Pila 6: TRIG=GPIO16, ECHO=GPIO20"
echo "   VCC: 5V, GND: Ground"
