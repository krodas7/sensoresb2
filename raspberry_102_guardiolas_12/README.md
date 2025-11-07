# 🌡️ Raspberry Pi 192.168.0.102 - Guardiolas 1 y 2

## 📋 Información General
- **IP**: 192.168.0.102
- **Función**: Monitoreo de temperatura de 2 Guardiolas
- **Tipo de Sensores**: MAX6675 (Termopar K)
- **Intervalo de Medición**: 30 segundos
- **API Destino**: http://192.168.0.150:8000
- **Usuario**: laptop
- **Reinicio Automático**: Cada 3 horas

## 🔌 Conexiones de Sensores

### MAX6675 - Guardiola 1
```
VCC → Pin 1 (3.3V) o Pin 2 (5V)
GND → Pin 6 (Ground)
SCK → Pin 23 (GPIO11) - Clock SPI
SO  → Pin 21 (GPIO9)  - MISO
CS  → Pin 24 (GPIO8)  - Chip Select
```

### MAX6675 - Guardiola 2
```
VCC → Pin 1 (3.3V) o Pin 2 (5V)
GND → Pin 6 (Ground)
SCK → Pin 23 (GPIO11) - Clock SPI (compartido)
SO  → Pin 21 (GPIO9)  - MISO (compartido)
CS  → Pin 26 (GPIO7)  - Chip Select
```

### Conexiones Compartidas
- **VCC, GND, SCK, SO**: Se comparten entre ambos sensores
- **CS**: Cada sensor tiene su propio pin CS (GPIO8 y GPIO7)

## 🛠️ Instalación

### Paso 1: Preparar la Raspberry Pi
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python y pip
sudo apt install python3 python3-pip python3-venv -y

# Habilitar SPI
sudo raspi-config
# Seleccionar: Interfacing Options → SPI → Enable
```

### Paso 2: Verificar SPI
```bash
# Verificar que SPI esté habilitado
lsmod | grep spi

# Debe mostrar: spi_bcm2835

# Verificar dispositivos SPI
ls /dev/spi*

# Debe mostrar: /dev/spidev0.0 /dev/spidev0.1
```

### Paso 3: Copiar Archivos
```bash
# Crear directorio
mkdir -p /home/pi/api-beneficio/raspberry_102_guardiolas_12

# Copiar archivos desde tu computadora:
# - raspberry_temp_client.py
# - requirements.txt
# - install_guardiolas_12_service.sh
# - guardiolas-12-sensor-client.service
```

### Paso 4: Instalar Dependencias y Servicio
```bash
cd /home/pi/api-beneficio/raspberry_102_guardiolas_12

# Hacer ejecutable el script de instalación
chmod +x install_guardiolas_12_service.sh

# Ejecutar instalación automática
./install_guardiolas_12_service.sh
```

### Paso 5: Verificar Instalación
```bash
# Verificar que el servicio esté habilitado
sudo systemctl status guardiolas-12-sensor-client

# Ver logs en tiempo real
sudo journalctl -u guardiolas-12-sensor-client -f

# Iniciar servicio manualmente si es necesario
sudo systemctl start guardiolas-12-sensor-client
```

## 🔧 Comandos Útiles

### Gestión del Servicio
```bash
# Iniciar servicio
sudo systemctl start guardiolas-12-sensor-client

# Detener servicio
sudo systemctl stop guardiolas-12-sensor-client

# Reiniciar servicio
sudo systemctl restart guardiolas-12-sensor-client

# Ver estado
sudo systemctl status guardiolas-12-sensor-client

# Habilitar inicio automático
sudo systemctl enable guardiolas-12-sensor-client

# Ver logs
sudo journalctl -u guardiolas-12-sensor-client -f
```

### Ejecución Manual
```bash
cd /home/pi/api-beneficio/raspberry_102_guardiolas_12

# Activar entorno virtual
source venv/bin/activate

# Ejecutar cliente manualmente
python raspberry_temp_client.py
```

## 📊 Verificación de Funcionamiento

### 1. Verificar Conexión a la API
```bash
# Probar conectividad con el servidor
ping 192.168.0.150

# Probar endpoint de la API
curl -u laptop:beneficiob2 http://192.168.0.150:8000/api/temperatura/estadisticas/
```

### 2. Verificar Sensores
```bash
# Ver logs del cliente
tail -f /home/pi/api-beneficio/raspberry_102_guardiolas_12/guardiolas_12_temp_client.log

# Los logs deben mostrar:
# - Configuración de SPI
# - Mediciones de temperatura
# - Envío exitoso a la API
```

### 3. Verificar en Dashboard
- Abrir: http://192.168.0.150:8000/api/dashboard/
- Verificar que aparezcan "Guardiola 1" y "Guardiola 2"
- Confirmar que los datos se actualizan cada 30 segundos

### 4. Probar Sensores Manualmente
```bash
# Instalar herramientas de SPI
sudo apt install python3-spidev

# Probar lectura de sensor
python3 -c "
import spidev
import RPi.GPIO as GPIO
import time

# Configurar SPI
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 500000
spi.mode = 0

# Configurar GPIO
GPIO.setmode(GPIO.BCM)
GPIO.setup(8, GPIO.OUT)  # CS Guardiola 1

# Leer sensor
GPIO.output(8, GPIO.LOW)
time.sleep(0.001)
raw = spi.readbytes(2)
GPIO.output(8, GPIO.HIGH)

val = (raw[0] << 8) | raw[1]
if val & 0x0004:
    print('Termopar abierto')
else:
    temp = (val >> 3) * 0.25
    print(f'Temperatura: {temp}°C')

spi.close()
GPIO.cleanup()
"
```

## 🚨 Solución de Problemas

### Error: "Permission denied" en SPI
```bash
# Agregar usuario pi al grupo spi
sudo usermod -a -G spi pi

# Reiniciar la Raspberry Pi
sudo reboot
```

### Error: "No module named 'spidev'"
```bash
# Instalar manualmente
pip3 install spidev

# O reinstalar el servicio
./install_guardiolas_12_service.sh
```

### Error: "SPI not enabled"
```bash
# Habilitar SPI
sudo raspi-config
# Interfacing Options → SPI → Enable

# Reiniciar
sudo reboot

# Verificar
lsmod | grep spi
```

### Error: "Connection refused" a la API
```bash
# Verificar conectividad de red
ping 192.168.0.150

# Verificar que la API esté funcionando
curl -u laptop:beneficiob2 http://192.168.0.150:8000/api/temperatura/estadisticas/
```

### Sensor no responde / Termopar abierto
```bash
# Verificar conexiones físicas
# - VCC conectado a 3.3V o 5V
# - GND conectado a Ground
# - SCK conectado a GPIO11
# - SO conectado a GPIO9
# - CS conectado a GPIO8 (Guardiola 1) o GPIO7 (Guardiola 2)

# Verificar con multímetro:
# - VCC debe medir ~3.3V o ~5V respecto a GND
# - GND debe medir 0V respecto a VCC

# Verificar termopar:
# - Conexiones del termopar K deben estar correctas
# - No debe haber cortocircuitos
```

### Problemas con múltiples sensores MAX6675
```bash
# Verificar que no hay conflictos de CS
gpio readall

# Cada sensor debe tener un CS único
# Si hay conflicto, cambiar los pines CS en el código
```

## 📈 Monitoreo

### Logs del Sistema
```bash
# Logs del servicio
sudo journalctl -u guardiolas-12-sensor-client -f

# Logs de la aplicación
tail -f /home/pi/api-beneficio/raspberry_102_guardiolas_12/guardiolas_12_temp_client.log
```

### Estado de los Sensores
```bash
# Verificar estado de SPI
lsmod | grep spi
ls /dev/spi*

# Verificar estado de GPIO
gpio readall
```

### Monitoreo de Temperatura
```bash
# Ver temperaturas en tiempo real
watch -n 5 'curl -s -u laptop:beneficiob2 http://192.168.0.150:8000/api/temperatura/resumen/ | python3 -m json.tool'
```

## 🔄 Actualizaciones

### Actualizar Código
```bash
cd /home/pi/api-beneficio/raspberry_102_guardiolas_12

# Detener servicio
sudo systemctl stop guardiolas-12-sensor-client

# Copiar nuevo código
# (copiar archivos desde tu computadora)

# Reiniciar servicio
sudo systemctl start guardiolas-12-sensor-client
```

### Actualizar Dependencias
```bash
cd /home/pi/api-beneficio/raspberry_102_guardiolas_12

source venv/bin/activate
pip install --upgrade -r requirements.txt
deactivate

sudo systemctl restart guardiolas-12-sensor-client
```

## 🔄 Sistema de Reinicio Programado

### Características del Reinicio Automático
- **Frecuencia**: Cada 3 horas
- **Tipo**: Reinicio controlado del servicio
- **Logs**: Registrados en `/var/log/guardiolas-12-restart.log`
- **Verificación**: Automática después de cada reinicio

### Comandos de Gestión del Reinicio
```bash
# Ver estado del timer de reinicio
sudo systemctl status guardiolas-12-restart.timer

# Ver logs de reinicios programados
sudo journalctl -u guardiolas-12-restart.service

# Forzar reinicio programado ahora
sudo systemctl start guardiolas-12-restart.service

# Ver cuándo será el próximo reinicio
sudo systemctl list-timers guardiolas-12-restart.timer

# Deshabilitar reinicio automático
sudo systemctl disable guardiolas-12-restart.timer

# Habilitar reinicio automático
sudo systemctl enable guardiolas-12-restart.timer
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

# Información de SPI
lsmod | grep spi
```

### Archivos de Configuración
- **Servicio Principal**: `/etc/systemd/system/guardiolas-12-sensor-client.service`
- **Servicio de Reinicio**: `/etc/systemd/system/guardiolas-12-restart.service`
- **Timer de Reinicio**: `/etc/systemd/system/guardiolas-12-restart.timer`
- **Logs del Servicio**: `/var/log/guardiolas-12/guardiolas_12_temp_client.log`
- **Logs de Reinicio**: `/var/log/guardiolas-12-restart.log`
- **Código**: `/home/laptop/guardiolas_12/raspberry_temp_client.py`

## ⚠️ Consideraciones Especiales

### Termopares Tipo K
- **Rango de temperatura**: -200°C a +1372°C
- **Precisión**: ±2°C en rango 0°C a +700°C
- **Conexiones**: Usar termopares tipo K correctos
- **Compensación**: MAX6675 compensa automáticamente la temperatura fría

### SPI y Múltiples Sensores
- **Compartir SCK y SO**: Ambos sensores comparten estas líneas
- **CS único**: Cada sensor necesita su propio pin CS
- **Velocidad**: 500kHz es suficiente para MAX6675
- **Modo**: SPI Mode 0 (CPOL=0, CPHA=0)

### Alimentación
- **3.3V o 5V**: MAX6675 funciona con ambos voltajes
- **Corriente**: ~1.5mA por sensor
- **Estabilidad**: Usar fuente estable para mediciones precisas

---

**¡Sistema listo para monitorear la temperatura de las Guardiolas 1 y 2!** 🌡️


