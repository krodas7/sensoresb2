#!/bin/bash
# Script de instalación para Raspberry Pi - Sensor MAX6675

echo "🍓 Instalando dependencias para sensor MAX6675 en Raspberry Pi"
echo "=============================================================="

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias de Python
echo "🐍 Instalando dependencias de Python..."
sudo apt install -y python3-pip python3-dev python3-spidev

# Instalar librerías de Python
echo "📚 Instalando librerías de Python..."
pip3 install requests spidev

# Habilitar SPI
echo "🔌 Habilitando SPI..."
sudo raspi-config nonint do_spi 0

# Crear directorio para scripts
echo "📁 Creando directorio de trabajo..."
mkdir -p ~/sensor_temperature
cd ~/sensor_temperature

# Hacer scripts ejecutables
chmod +x *.py

echo "✅ Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Copia los scripts Python a ~/sensor_temperature/"
echo "2. Edita la IP del servidor en los scripts"
echo "3. Ejecuta: python3 real_sensor_integration.py"
echo ""
echo "🔧 Configuración SPI:"
echo "- Bus: 0, Device: 0 (por defecto)"
echo "- Velocidad: 500kHz"
echo "- Modo: 0 (CPOL=0, CPHA=0)"
echo ""
echo "🌐 Para probar la conexión:"
echo "python3 raspberry_sensor_client.py"
