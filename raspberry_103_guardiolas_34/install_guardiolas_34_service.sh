#!/bin/bash

# Script de instalación del servicio de sensores de guardiolas 3-4 para Raspberry Pi
# API Beneficio - Sistema de monitoreo automático

set -e

echo "=== Instalador del Cliente de Sensores de Guardiolas 3-4 - API Beneficio ==="
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
SERVICE_NAME="guardiolas-34-sensor-client"
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

# 2. Hacer el script ejecutable y configurar permisos
echo "🔧 Configurando permisos..."
chmod +x "$SCRIPT_DIR/raspberry_temp_client.py"

# Configurar permisos del directorio para el usuario laptop
echo "🔧 Configurando permisos del directorio..."
sudo chown -R laptop:laptop "$SCRIPT_DIR"
chmod -R 755 "$SCRIPT_DIR"

# Crear directorio de logs y configurar permisos
echo "🔧 Configurando directorio de logs..."
sudo mkdir -p /var/log/guardiolas-34
sudo chown laptop:laptop /var/log/guardiolas-34
sudo chmod 755 /var/log/guardiolas-34

# 3. Habilitar SPI en Raspberry Pi
echo "⚙️  Configurando SPI..."
sudo raspi-config nonint do_spi 0

# 4. Crear el archivo de servicio systemd
echo "⚙️  Configurando servicio systemd..."

# Actualizar el archivo de servicio con la ruta correcta
sudo cat > "$SERVICE_FILE" << EOF
[Unit]
Description=API Beneficio - Cliente de Sensores de Guardiolas 3-4 Raspberry Pi
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
Environment=LOG_DIR=/var/log/guardiolas-34

# Configuración de logging
SyslogIdentifier=guardiolas-34-sensor-client

[Install]
WantedBy=multi-user.target
EOF

# 5. Configurar script de reinicio
echo "🔧 Configurando script de reinicio programado..."
chmod +x "$SCRIPT_DIR/restart_service.sh"

# 6. Crear servicios de reinicio programado
echo "⏰ Configurando reinicio programado cada 3 horas..."

# Copiar archivos de servicio y timer
sudo cp "$SCRIPT_DIR/guardiolas-34-restart.service" /etc/systemd/system/
sudo cp "$SCRIPT_DIR/guardiolas-34-restart.timer" /etc/systemd/system/

# 7. Recargar systemd y habilitar servicios
echo "🔄 Recargando configuración de systemd..."
sudo systemctl daemon-reload

echo "✅ Habilitando servicio principal $SERVICE_NAME..."
sudo systemctl enable "$SERVICE_NAME"

echo "✅ Habilitando timer de reinicio programado..."
sudo systemctl enable guardiolas-34-restart.timer

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
echo "   Ver estado timer:    sudo systemctl status guardiolas-34-restart.timer"
echo "   Ver logs reinicio:   sudo journalctl -u guardiolas-34-restart.service"
echo "   Reinicio manual:     sudo systemctl start guardiolas-34-restart.service"
echo "   Ver próximos reinicios: sudo systemctl list-timers guardiolas-34-restart.timer"
echo ""
echo "🚀 El servicio se iniciará automáticamente al reiniciar la Raspberry Pi"
echo "🔄 El servicio se reiniciará automáticamente cada 3 horas para prevenir problemas"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que:"
echo "   - Los sensores MAX6675 estén conectados correctamente"
echo "   - La API esté funcionando en 68.183.155.4:8000"
echo "   - La red esté configurada correctamente"
echo "   - SPI esté habilitado (se configuró automáticamente)"
echo ""
echo "🔍 Para verificar que todo funciona:"
echo "   sudo systemctl start $SERVICE_NAME"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo ""
echo "📡 Conexiones MAX6675 para Guardiolas 3-4:"
echo "   - VCC: Pin 1 (3.3V) o Pin 2 (5V)"
echo "   - GND: Pin 6 (Ground)"
echo "   - SCK: Pin 23 (GPIO 11) - Clock SPI"
echo "   - SO:  Pin 21 (GPIO 9)  - MISO"
echo "   - CS:  Pin 24 (GPIO 8)  - Guardiola 3"
echo "   - CS:  Pin 26 (GPIO 7)  - Guardiola 4"
echo ""
echo "🌡️  Sensores configurados:"
echo "   - Guardiola 3 (CS: GPIO 8)"
echo "   - Guardiola 4 (CS: GPIO 7)"


