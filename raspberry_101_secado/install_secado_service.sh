#!/bin/bash

# Script de instalación del servicio de sensores de secado para Raspberry Pi
# API Beneficio - Sistema de monitoreo automático

set -e

echo "=== Instalador del Cliente de Sensores de Pilas de Secado (Temperatura) - API Beneficio ==="
echo "📌 Configuración: 7 sensores (Horno + Pilas 1-6) con pines optimizados"
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
SERVICE_NAME="secado-sensor-client"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "📁 Directorio del proyecto: $SCRIPT_DIR"
echo ""

# 1. Instalar dependencias de Python
echo "📦 Instalando dependencias de Python..."

# Verificar si ya existe un entorno virtual
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "🔧 Creando entorno virtual..."
    python3 -m venv "$SCRIPT_DIR/venv"
fi

# Activar entorno virtual e instalar dependencias
echo "📦 Instalando dependencias en entorno virtual..."
source "$SCRIPT_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -r "$SCRIPT_DIR/requirements.txt"
deactivate

# 2. Hacer el script ejecutable
echo "🔧 Configurando permisos..."
chmod +x "$SCRIPT_DIR/raspberry_temp_client.py"

# 3. Crear el archivo de servicio systemd
echo "⚙️  Configurando servicio systemd..."

# Actualizar el archivo de servicio con la ruta correcta
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=API Beneficio - Cliente de Sensores de Secado Raspberry Pi
After=network.target
Wants=network.target

[Service]
Type=simple
User=laptop
Group=laptop
WorkingDirectory=$SCRIPT_DIR
ExecStart=$SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/raspberry_temp_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Variables de entorno
Environment=PYTHONPATH=$SCRIPT_DIR
Environment=PYTHONUNBUFFERED=1

# Configuración de logging
SyslogIdentifier=secado-sensor-client

[Install]
WantedBy=multi-user.target
EOF

# 4. Configurar script de reinicio
echo "🔧 Configurando script de reinicio programado..."
chmod +x "$SCRIPT_DIR/restart_service.sh"

# 5. Crear servicios de reinicio programado
echo "⏰ Configurando reinicio programado cada 3 horas..."

# Copiar archivos de servicio y timer
sudo cp "$SCRIPT_DIR/secado-restart.service" /etc/systemd/system/
sudo cp "$SCRIPT_DIR/secado-restart.timer" /etc/systemd/system/

# 6. Recargar systemd y habilitar servicios
echo "🔄 Recargando configuración de systemd..."
sudo systemctl daemon-reload

echo "✅ Habilitando servicio principal $SERVICE_NAME..."
sudo systemctl enable "$SERVICE_NAME"

echo "✅ Habilitando timer de reinicio programado..."
sudo systemctl enable secado-restart.timer

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
echo "   Ver estado timer:    sudo systemctl status secado-restart.timer"
echo "   Ver logs reinicio:   sudo journalctl -u secado-restart.service"
echo "   Reinicio manual:     sudo systemctl start secado-restart.service"
echo "   Ver próximos reinicios: sudo systemctl list-timers secado-restart.timer"
echo ""
echo "🚀 El servicio se iniciará automáticamente al reiniciar la Raspberry Pi"
echo "🔄 El servicio se reiniciará automáticamente cada 3 horas para prevenir problemas"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que:"
echo "   - Los sensores MAX6675 estén conectados correctamente"
echo "   - La API esté funcionando en 192.168.0.150:8000"
echo "   - La red esté configurada correctamente"
echo "   - SPI esté habilitado (sudo raspi-config)"
echo ""
echo "🔍 Para verificar que todo funciona:"
echo "   sudo systemctl start $SERVICE_NAME"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "📡 Conexiones MAX6675 para 7 Sensores (Horno + Pilas 1-6):"
echo "   - VCC: Pin 1 (3.3V) o Pin 2 (5V) - Compartido"
echo "   - GND: Pin 6 (Ground) - Compartido"
echo "   - SCK: Pin 23 (GPIO 11) - Clock SPI - Compartido"
echo "   - SO:  Pin 21 (GPIO 9)  - MISO - Compartido"
echo "   - CS:  Pin 8  (GPIO 14) - Horno"
echo "   - CS:  Pin 29 (GPIO 5)  - Pila 1"
echo "   - CS:  Pin 31 (GPIO 6)  - Pila 2"
echo "   - CS:  Pin 33 (GPIO 13) - Pila 3"
echo "   - CS:  Pin 36 (GPIO 16) - Pila 4"
echo "   - CS:  Pin 16 (GPIO 23) - Pila 5"
echo "   - CS:  Pin 22 (GPIO 25) - Pila 6"
echo ""
echo "🌡️ Sensores configurados (Temperatura):"
echo "   - Horno (CS: GPIO 14) - Pin 8"
echo "   - Pila 1 (CS: GPIO 5)  - Pin 29"
echo "   - Pila 2 (CS: GPIO 6)  - Pin 31"
echo "   - Pila 3 (CS: GPIO 13) - Pin 33"
echo "   - Pila 4 (CS: GPIO 16) - Pin 36"
echo "   - Pila 5 (CS: GPIO 23) - Pin 16"
echo "   - Pila 6 (CS: GPIO 25) - Pin 22"
echo ""
echo "✅ Pines optimizados para evitar conflictos de GPIO"
echo "✅ Método SPI independiente por sensor para máxima estabilidad"


