# 🍷 Raspberry Pi 192.168.0.100 - Pilas de Fermentación

## 📋 Información General
- **IP**: 192.168.0.100
- **Función**: Monitoreo de 6 Pilas de Fermentación
- **Tipo de Sensores**: HC-SR04 (Ultrasónicos)
- **Intervalo de Medición**: 3 minutos
- **API Destino**: http://192.168.0.150:8000
- **Usuario**: laptop
- **Reinicio Automático**: Cada 3 horas

## 🔌 Conexiones de Sensores

### HC-SR04 - Pila de Fermentación 1
```
VCC  → Pin 2 (5V)
GND  → Pin 6 (Ground)
TRIG → Pin 16 (GPIO23)
ECHO → Pin 18 (GPIO24)
```

### HC-SR04 - Pila de Fermentación 2
```
VCC  → Pin 2 (5V)
GND  → Pin 6 (Ground)
TRIG → Pin 11 (GPIO17)
ECHO → Pin 13 (GPIO27)
```

### HC-SR04 - Pila de Fermentación 3
```
VCC  → Pin 2 (5V)
GND  → Pin 6 (Ground)
TRIG → Pin 15 (GPIO22)
ECHO → Pin 29 (GPIO5)
```

### HC-SR04 - Pila de Fermentación 4
```
VCC  → Pin 2 (5V)
GND  → Pin 6 (Ground)
TRIG → Pin 31 (GPIO6)
ECHO → Pin 33 (GPIO13)
```

### HC-SR04 - Pila de Fermentación 5
```
VCC  → Pin 2 (5V)
GND  → Pin 6 (Ground)
TRIG → Pin 35 (GPIO19)
ECHO → Pin 37 (GPIO26)
```

### HC-SR04 - Pila de Fermentación 6
```
VCC  → Pin 2 (5V)
GND  → Pin 6 (Ground)
TRIG → Pin 36 (GPIO16)
ECHO → Pin 38 (GPIO20)
```

## 🛠️ Instalación

### Paso 1: Preparar la Raspberry Pi
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python y pip
sudo apt install python3 python3-pip python3-venv -y

# Habilitar GPIO
sudo raspi-config
# Seleccionar: Interfacing Options → GPIO → Enable
```

### Paso 2: Copiar Archivos
```bash
# Crear directorio
mkdir -p /home/pi/api-beneficio/raspberry_100_fermentacion

# Copiar archivos desde tu computadora:
# - raspberry_sensor_client.py
# - requirements.txt
# - install_fermentacion_service.sh
# - fermentacion-sensor-client.service
```

### Paso 3: Instalar Dependencias y Servicio
```bash
cd /home/pi/api-beneficio/raspberry_100_fermentacion

# Hacer ejecutable el script de instalación
chmod +x install_fermentacion_service.sh

# Ejecutar instalación automática
./install_fermentacion_service.sh
```

### Paso 4: Verificar Instalación
```bash
# Verificar que el servicio esté habilitado
sudo systemctl status fermentacion-sensor-client

# Ver logs en tiempo real
sudo journalctl -u fermentacion-sensor-client -f

# Iniciar servicio manualmente si es necesario
sudo systemctl start fermentacion-sensor-client
```

## 🔧 Comandos Útiles

### Gestión del Servicio
```bash
# Iniciar servicio
sudo systemctl start fermentacion-sensor-client

# Detener servicio
sudo systemctl stop fermentacion-sensor-client

# Reiniciar servicio
sudo systemctl restart fermentacion-sensor-client

# Ver estado
sudo systemctl status fermentacion-sensor-client

# Habilitar inicio automático
sudo systemctl enable fermentacion-sensor-client

# Ver logs
sudo journalctl -u fermentacion-sensor-client -f
```

### Ejecución Manual
```bash
cd /home/pi/api-beneficio/raspberry_100_fermentacion

# Activar entorno virtual
source venv/bin/activate

# Ejecutar cliente manualmente
python raspberry_sensor_client.py
```

## 📊 Verificación de Funcionamiento

### 1. Verificar Conexión a la API
```bash
# Probar conectividad con el servidor
ping 192.168.0.150

# Probar endpoint de la API
curl -u laptop:beneficiob2 http://192.168.0.150:8000/api/v1/sensors/medicion/estadisticas/
```

### 2. Verificar Sensores
```bash
# Ver logs del cliente
tail -f /home/pi/api-beneficio/raspberry_100_fermentacion/fermentacion_sensor_client.log

# Los logs deben mostrar:
# - Configuración de pines
# - Mediciones de distancia
# - Envío exitoso a la API
```

### 3. Verificar en Dashboard
- Abrir: http://192.168.0.150:8000/api/dashboard/
- Verificar que aparezcan las "Pilas de Fermentación"
- Confirmar que los datos se actualizan cada 3 minutos

## 🚨 Solución de Problemas

### Error: "Permission denied" en GPIO
```bash
# Agregar usuario pi al grupo gpio
sudo usermod -a -G gpio pi

# Reiniciar la Raspberry Pi
sudo reboot
```

### Error: "No module named 'RPi.GPIO'"
```bash
# Instalar manualmente
pip3 install RPi.GPIO

# O reinstalar el servicio
./install_fermentacion_service.sh
```

### Error: "Connection refused" a la API
```bash
# Verificar conectividad de red
ping 192.168.0.150

# Verificar que la API esté funcionando
curl -u laptop:beneficiob2 http://192.168.0.150:8000/api/v1/sensors/medicion/estadisticas/
```

### Sensor no responde
```bash
# Verificar conexiones físicas
# - VCC conectado a 5V
# - GND conectado a Ground
# - TRIG y ECHO conectados a los pines correctos

# Verificar con multímetro:
# - VCC debe medir ~5V respecto a GND
# - GND debe medir 0V respecto a VCC
```

## 📈 Monitoreo

### Logs del Sistema
```bash
# Logs del servicio
sudo journalctl -u fermentacion-sensor-client -f

# Logs de la aplicación
tail -f /home/pi/api-beneficio/raspberry_100_fermentacion/fermentacion_sensor_client.log
```

### Estado de los Sensores
```bash
# Verificar estado de GPIO
gpio readall
```

## 🔄 Actualizaciones

### Actualizar Código
```bash
cd /home/pi/api-beneficio/raspberry_100_fermentacion

# Detener servicio
sudo systemctl stop fermentacion-sensor-client

# Copiar nuevo código
# (copiar archivos desde tu computadora)

# Reiniciar servicio
sudo systemctl start fermentacion-sensor-client
```

### Actualizar Dependencias
```bash
cd /home/pi/api-beneficio/raspberry_100_fermentacion

source venv/bin/activate
pip install --upgrade -r requirements.txt
deactivate

sudo systemctl restart fermentacion-sensor-client
```

## 🔄 Sistema de Reinicio Programado

### Características del Reinicio Automático
- **Frecuencia**: Cada 3 horas
- **Tipo**: Reinicio controlado del servicio
- **Logs**: Registrados en `/var/log/fermentacion-restart.log`
- **Verificación**: Automática después de cada reinicio

### Comandos de Gestión del Reinicio
```bash
# Ver estado del timer de reinicio
sudo systemctl status fermentacion-restart.timer

# Ver logs de reinicios programados
sudo journalctl -u fermentacion-restart.service

# Forzar reinicio programado ahora
sudo systemctl start fermentacion-restart.service

# Ver cuándo será el próximo reinicio
sudo systemctl list-timers fermentacion-restart.timer

# Deshabilitar reinicio automático
sudo systemctl disable fermentacion-restart.timer

# Habilitar reinicio automático
sudo systemctl enable fermentacion-restart.timer
```

### Script de Gestión
```bash
# Usar el script de gestión completo
./manage_restart.sh status      # Ver estado completo
./manage_restart.sh restart     # Reiniciar manualmente
./manage_restart.sh logs        # Ver logs del servicio
./manage_restart.sh next        # Ver próximo reinicio
./manage_restart.sh help        # Ver todos los comandos
```

## 📞 Soporte

### Información del Sistema
```bash
# Información de la Raspberry Pi
cat /proc/cpuinfo | grep Model
cat /proc/version

# Información de red
ip addr show
```

### Archivos de Configuración
- **Servicio Principal**: `/etc/systemd/system/fermentacion-sensor-client.service`
- **Servicio de Reinicio**: `/etc/systemd/system/fermentacion-restart.service`
- **Timer de Reinicio**: `/etc/systemd/system/fermentacion-restart.timer`
- **Logs del Servicio**: `/var/log/fermentacion/fermentacion_sensor_client.log`
- **Logs de Reinicio**: `/var/log/fermentacion-restart.log`
- **Código**: `/home/laptop/fermentacion/raspberry_sensor_client.py`

---

**¡Sistema listo para monitorear las 6 Pilas de Fermentación!** 🍷
