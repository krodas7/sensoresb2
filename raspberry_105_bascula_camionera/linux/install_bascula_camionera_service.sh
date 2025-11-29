#!/bin/bash

# Script de instalación del servicio de báscula camionera para Raspberry Pi
# API Beneficio - Sistema de monitoreo automático

set -e

echo "=== Instalador del Cliente de Báscula Camionera - API Beneficio ==="
echo "📌 Configuración: Báscula Camionera - Reloj Digital Serial"
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

# Obtener directorio actual (linux/) y directorio padre (proyecto)
LINUX_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$LINUX_DIR/.." && pwd)"
SERVICE_NAME="bascula-camionera-sensor-client"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo "📁 Directorio del proyecto: $PROJECT_DIR"
echo "📁 Directorio Linux: $LINUX_DIR"
echo ""

# 1. Instalar dependencias de Python
echo "📦 Instalando dependencias de Python..."

# Verificar si ya existe un entorno virtual
if [ ! -d "$PROJECT_DIR/venv" ]; then
    echo "🔧 Creando entorno virtual..."
    python3 -m venv "$PROJECT_DIR/venv"
fi

# Activar entorno virtual e instalar dependencias
echo "📦 Instalando dependencias en entorno virtual..."
source "$PROJECT_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -r "$PROJECT_DIR/requirements.txt"
deactivate

# 2. Hacer el script ejecutable
echo "🔧 Configurando permisos..."
chmod +x "$PROJECT_DIR/raspberry_bascula_client.py"
chmod +x "$LINUX_DIR/restart_service.sh"
chmod +x "$LINUX_DIR/manage_restart.sh"

# 3. Crear el archivo de servicio systemd
echo "⚙️  Configurando servicio systemd..."

# Actualizar el archivo de servicio con la ruta correcta
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=API Beneficio - Cliente de Báscula Camionera Raspberry Pi
After=network.target
Wants=network.target

[Service]
Type=simple
User=laptop
Group=laptop
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/venv/bin/python $PROJECT_DIR/raspberry_bascula_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Variables de entorno
Environment=PYTHONPATH=$PROJECT_DIR
Environment=LOG_DIR=/var/log/bascula
Environment=PYTHONUNBUFFERED=1

# Configuración de logging
SyslogIdentifier=bascula-camionera-sensor-client

[Install]
WantedBy=multi-user.target
EOF

# 4. Configurar script de reinicio
echo "🔧 Configurando script de reinicio programado..."
chmod +x "$SCRIPT_DIR/restart_service.sh"

# 5. Crear servicios de reinicio programado
echo "⏰ Configurando reinicio programado cada 3 horas..."

# Copiar archivos de servicio y timer
sudo cp "$LINUX_DIR/bascula-camionera-restart.service" /etc/systemd/system/
sudo cp "$LINUX_DIR/bascula-camionera-restart.timer" /etc/systemd/system/

# 6. Preparar directorio de logs
echo "🗂️ Asegurando directorio de logs en /var/log/bascula..."
sudo mkdir -p /var/log/bascula
sudo chown laptop:laptop /var/log/bascula

# 7. Recargar systemd y habilitar servicios
echo "🔄 Recargando configuración de systemd..."
sudo systemctl daemon-reload

echo "✅ Habilitando servicio principal $SERVICE_NAME..."
sudo systemctl enable "$SERVICE_NAME"

echo "✅ Habilitando timer de reinicio programado..."
sudo systemctl enable bascula-camionera-restart.timer

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
echo "   Ver estado timer:    sudo systemctl status bascula-camionera-restart.timer"
echo "   Ver logs reinicio:   sudo journalctl -u bascula-camionera-restart.service"
echo "   Reinicio manual:     sudo systemctl start bascula-camionera-restart.service"
echo "   Ver próximos reinicios: sudo systemctl list-timers bascula-camionera-restart.timer"
echo ""
echo "🚀 El servicio se iniciará automáticamente al reiniciar la Raspberry Pi"
echo "🔄 El servicio se reiniciará automáticamente cada 3 horas para prevenir problemas"
echo ""
echo "⚠️  IMPORTANTE: Asegúrate de que:"
echo "   - El reloj digital esté conectado correctamente al puerto serial"
echo "   - El puerto serial sea /dev/ttyUSB0 (o ajustar en el código si es diferente)"
echo "   - El baudrate sea 9600 (o ajustar en el código si es diferente)"
echo "   - La API esté funcionando en 68.183.155.4:8000"
echo "   - La red esté configurada correctamente"
echo "   - El usuario 'laptop' tenga permisos para acceder al puerto serial"
echo ""
echo "📡 Configuración del puerto serial:"
echo "   - Puerto: /dev/ttyUSB0 (ajustar en raspberry_bascula_client.py si es necesario)"
echo "   - Baudrate: 9600 (ajustar en raspberry_bascula_client.py si es necesario)"
echo ""
echo "⚙️  Permisos de usuario para acceso serial:"
echo "   sudo usermod -a -G dialout laptop"
echo ""
echo "🔍 Para verificar que todo funciona:"
echo "   sudo systemctl start $SERVICE_NAME"
echo "   sudo journalctl -u $SERVICE_NAME -f"
echo ""

