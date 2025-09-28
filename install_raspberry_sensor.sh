#!/bin/bash

echo "🌡️  Instalando Sensor MAX6675 en Raspberry Pi"
echo "=============================================="

# Actualizar sistema
echo "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependencias Python
echo "🐍 Instalando dependencias Python..."
sudo apt install -y python3-pip python3-spidev python3-requests

# Instalar dependencias adicionales
echo "📚 Instalando dependencias adicionales..."
pip3 install requests spidev

# Habilitar SPI
echo "⚙️  Habilitando SPI..."
sudo raspi-config nonint do_spi 0

# Crear directorio para el script
echo "📁 Creando directorio..."
mkdir -p ~/sensor_beneficio
cd ~/sensor_beneficio

# Crear script de inicio
echo "🚀 Creando script de inicio..."
cat > start_sensor.sh << 'EOF'
#!/bin/bash
cd ~/sensor_beneficio
python3 raspberry_sensor_fixed.py
EOF

chmod +x start_sensor.sh

# Crear servicio systemd
echo "🔧 Creando servicio systemd..."
sudo tee /etc/systemd/system/sensor-beneficio.service > /dev/null << EOF
[Unit]
Description=Sensor MAX6675 Beneficio de Cafe
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/sensor_beneficio
ExecStart=/usr/bin/python3 /home/pi/sensor_beneficio/raspberry_sensor_fixed.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd
sudo systemctl daemon-reload

echo "✅ Instalación completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Copia el script raspberry_sensor_fixed.py a ~/sensor_beneficio/"
echo "2. Edita la IP del servidor en el script"
echo "3. Para iniciar manualmente: ./start_sensor.sh"
echo "4. Para iniciar como servicio: sudo systemctl start sensor-beneficio"
echo "5. Para habilitar al inicio: sudo systemctl enable sensor-beneficio"
echo ""
echo "🔍 Para ver logs: journalctl -u sensor-beneficio -f"
