# ☀️ Raspberry Pi 192.168.0.101 - Pilas de Secado

## 📋 Información General
- **IP**: 192.168.0.101
- **Función**: Monitoreo de 3 Sensores (Horno + Pilas 5 y 6)
- **Tipo de Sensores**: MAX6675 (Temperatura)
- **Intervalo de Medición**: 30 segundos
- **API Destino**: http://68.183.155.4:8000
- **Usuario**: laptop
- **Reinicio Automático**: Cada 3 horas
- **Método**: SPI independiente por sensor (máxima estabilidad)
- **Pines optimizados**: Evita conflictos de GPIO (UART, PWM, I2C)

## 🔌 Conexiones de Sensores MAX6675

### Configuración SPI Compartida
```
SCK → Pin 23 (GPIO 11) - Clock SPI
SO  → Pin 21 (GPIO 9)  - MISO (Master In Slave Out)
```

### Alimentación Compartida
```
VCC → Pin 1 (3.3V) o Pin 2 (5V)
GND → Pin 6 (Ground)
```

### Conexiones Individuales por Sensor (3 Sensores)

#### MAX6675 - Horno
```
VCC  → Pin 1 (3.3V) o Pin 2 (5V)
GND  → Pin 6 (Ground)
SCK  → Pin 23 (GPIO 11) - Compartido
SO   → Pin 21 (GPIO 9)  - Compartido
CS   → Pin 8  (GPIO 14) - Chip Select
```

#### MAX6675 - Pila de Secado 5
```
VCC  → Pin 1 (3.3V) o Pin 2 (5V)
GND  → Pin 6 (Ground)
SCK  → Pin 23 (GPIO 11) - Compartido
SO   → Pin 21 (GPIO 9)  - Compartido
CS   → Pin 16 (GPIO 23) - Chip Select
```

#### MAX6675 - Pila de Secado 6
```
VCC  → Pin 1 (3.3V) o Pin 2 (5V)
GND  → Pin 6 (Ground)
SCK  → Pin 23 (GPIO 11) - Compartido
SO   → Pin 21 (GPIO 9)  - Compartido
CS   → Pin 22 (GPIO 25) - Chip Select
```

## 📊 Parámetros de Temperatura

### Rangos y Estados
- **Rango válido**: -10°C a 80°C
- **Estado OK**: -10°C < temperatura < 50°C
- **Estado WARNING**: 50°C ≤ temperatura ≤ 80°C
- **Estado ERROR**: temperatura < -10°C o > 80°C

### Configuración de Sensores
- **Resolución**: 0.25°C
- **Precisión**: ±2°C
- **Rango de medición**: 0°C a +1024°C
- **Velocidad SPI**: 500 kHz

## 🔧 Instalación del Servicio

### 1. Preparar el Sistema
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y python3-pip python3-venv git

# Habilitar SPI
sudo raspi-config
# Seleccionar: Interfacing Options → SPI → Enable
```

### 2. Instalar Servicio de Sensores
```bash
# Ejecutar script de instalación
sudo bash install_secado_service.sh

# Verificar instalación
sudo systemctl status secado-sensor-client
```

### 3. Configurar Usuario y Permisos
```bash
# Crear usuario laptop si no existe
sudo useradd -m -s /bin/bash laptop
sudo usermod -a -G gpio,spi laptop

# Configurar directorio de trabajo
sudo mkdir -p /home/laptop/secado
sudo chown -R laptop:laptop /home/laptop/secado

# Configurar logs
sudo mkdir -p /var/log/secado
sudo chown -R laptop:laptop /var/log/secado
```

## 🚀 Uso del Sistema

### Comandos de Servicio
```bash
# Iniciar servicio
sudo systemctl start secado-sensor-client

# Detener servicio
sudo systemctl stop secado-sensor-client

# Reiniciar servicio
sudo systemctl restart secado-sensor-client

# Ver estado
sudo systemctl status secado-sensor-client

# Habilitar inicio automático
sudo systemctl enable secado-sensor-client
```

### Verificación de Logs
```bash
# Ver logs en tiempo real
sudo journalctl -u secado-sensor-client -f

# Ver logs del archivo
tail -f /var/log/secado/secado_temp_client.log

# Ver últimos logs
sudo journalctl -u secado-sensor-client --since "1 hour ago"
```

### Prueba de Sensores
```bash
# Ejecutar script base (ajustar según necesidad)
cd /home/laptop/secado
python3 test_sensores_simple.py

# Verificar lectura individual del Horno (GPIO 14)
python3 -c "
import RPi.GPIO as GPIO
import spidev
import time

GPIO.setmode(GPIO.BCM)
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 500000

# Probar Horno (GPIO 14)
GPIO.setup(14, GPIO.OUT)
GPIO.output(14, GPIO.HIGH)
time.sleep(0.001)
GPIO.output(14, GPIO.LOW)
time.sleep(0.001)
raw = spi.readbytes(2)
GPIO.output(14, GPIO.HIGH)
val = (raw[0] << 8) | raw[1]
if val & 0x0004:
    print('Horno: Termopar abierto')
else:
    temp = (val >> 3) * 0.25
    print(f'Horno: {temp}°C')
spi.close()
GPIO.cleanup()
"
```

## 📡 Configuración de Red

### Configuración Estática
```bash
# Editar configuración de red
sudo nano /etc/dhcpcd.conf

# Agregar al final:
interface eth0
static ip_address=192.168.0.101/24
static routers=192.168.0.1
static domain_name_servers=8.8.8.8 8.8.4.4

# Reiniciar red
sudo systemctl restart dhcpcd
```

### Verificar Conectividad
```bash
# Verificar IP
ip addr show eth0

# Probar conectividad con servidor
ping 68.183.155.4

# Probar API
curl -u laptop:beneficiob2 http://68.183.155.4:8000/api/temperatura/resumen/
```

## 🔄 Reinicio Automático

### Configuración del Timer
```bash
# Verificar timer de reinicio
sudo systemctl status secado-restart.timer

# Ver logs del timer
sudo journalctl -u secado-restart.timer

# Reiniciar manualmente
sudo systemctl restart secado-sensor-client
```

### Gestión de Reinicios
```bash
# Verificar servicio de reinicio
sudo systemctl status secado-restart.service

# Ver logs de reinicio
sudo journalctl -u secado-restart.service

# Reiniciar manualmente
sudo bash /home/laptop/secado/restart_service.sh
```

## 🛠️ Mantenimiento

### Actualización del Código
```bash
# Detener servicio
sudo systemctl stop secado-sensor-client

# Actualizar código
cd /home/laptop/secado
git pull origin main

# Reiniciar servicio
sudo systemctl start secado-sensor-client
```

### Limpieza de Logs
```bash
# Limpiar logs antiguos
sudo journalctl --vacuum-time=7d

# Limpiar logs del archivo
sudo truncate -s 0 /var/log/secado/secado_temp_client.log
```

### Verificación de Sensores
```bash
# Verificar sensores con múltiples lecturas
python3 test_sensores_multiple_simple.py

# Verificar sensor específico (método optimizado)
python3 -c "
import RPi.GPIO as GPIO
import spidev
import time

def test_sensor_optimizado(cs_pin, name):
    GPIO.setmode(GPIO.BCM)
    spi = spidev.SpiDev()
    spi.open(0, 0)
    spi.max_speed_hz = 500000
    
    GPIO.setup(cs_pin, GPIO.OUT)
    GPIO.output(cs_pin, GPIO.HIGH)
    time.sleep(0.001)
    GPIO.output(cs_pin, GPIO.LOW)
    time.sleep(0.001)
    raw = spi.readbytes(2)
    GPIO.output(cs_pin, GPIO.HIGH)
    
    val = (raw[0] << 8) | raw[1]
    if val & 0x0004:
        print(f'{name}: Termopar abierto')
    else:
        temp = (val >> 3) * 0.25
        print(f'{name}: {temp}°C')
    
    spi.close()
    GPIO.cleanup()

# Probar los sensores configurados (Pilas 5 y 6)
sensors = {
    'Pila 5': 23,
    'Pila 6': 25,
}

for name, cs in sensors.items():
    test_sensor_optimizado(cs, name)
"
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Servicio no inicia
```bash
# Verificar logs
sudo journalctl -u secado-sensor-client -n 50

# Verificar permisos
ls -la /home/laptop/secado/
sudo chown -R laptop:laptop /home/laptop/secado/
```

#### 2. Sensores no responden
```bash
# Verificar SPI habilitado
lsmod | grep spi

# Verificar permisos SPI
sudo usermod -a -G spi laptop

# Probar SPI manualmente
sudo python3 -c "
import spidev
spi = spidev.SpiDev()
spi.open(0, 0)
print('SPI funcionando')
spi.close()
"
```

#### 3. Errores de temperatura
```bash
# Verificar conexiones
python3 test_sensores_secado.py

# Verificar termopares
# Si aparece "Termopar abierto", verificar conexiones del termopar
```

#### 4. Problemas de red
```bash
# Verificar conectividad
ping 68.183.155.4

# Verificar DNS
nslookup 68.183.155.4

# Verificar firewall
sudo ufw status
```

### Logs de Diagnóstico
```bash
# Ver todos los logs del sistema
sudo journalctl -u secado-sensor-client --since "1 hour ago"

# Ver logs de red
sudo journalctl -u NetworkManager --since "1 hour ago"

# Ver logs de SPI
dmesg | grep spi
```

## 📈 Monitoreo

### Dashboard Web
- **URL**: http://68.183.155.4:8000/dashboard/mejorado/
- **Usuario**: laptop
- **Contraseña**: beneficiob2

### API Endpoints
- **Resumen**: http://68.183.155.4:8000/api/temperatura/resumen/
- **Estadísticas**: http://68.183.155.4:8000/api/temperatura/estadisticas/
- **Recibir datos**: http://68.183.155.4:8000/api/temperatura/recibir/

### Verificación Remota
```bash
# Desde el servidor, verificar datos
curl -u laptop:beneficiob2 http://68.183.155.4:8000/api/temperatura/resumen/ | jq '.[] | select(.sensor | contains("Secado"))'
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Editar archivo de servicio
sudo nano /etc/systemd/system/secado-sensor-client.service

# Agregar variables si es necesario:
Environment=PYTHONPATH=/home/laptop/secado
Environment=LOG_LEVEL=INFO
Environment=API_TIMEOUT=30
```

### Optimización de SPI
```bash
# Configurar velocidad SPI
sudo nano /boot/config.txt

# Agregar:
dtparam=spi=on
dtoverlay=spi1-1cs
```

### Configuración de Logs
```bash
# Configurar rotación de logs
sudo nano /etc/logrotate.d/secado

# Contenido:
/var/log/secado/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 laptop laptop
}
```

## 📞 Soporte

### Información de Contacto
- **Sistema**: API Beneficio - Pilas de Secado
- **Raspberry Pi**: 192.168.0.101
- **Servidor API**: 68.183.155.4:8000
- **Tipo de Sensores**: MAX6675 (Temperatura)

### Archivos Importantes
- **Código principal**: `/home/laptop/secado/raspberry_temp_client.py`
- **Servicio**: `/etc/systemd/system/secado-sensor-client.service`
- **Logs**: `/var/log/secado/secado_temp_client.log`
- **Script de prueba**: `/home/laptop/secado/test_sensores_secado.py`

### Comandos de Emergencia
```bash
# Reinicio completo del sistema
sudo systemctl restart secado-sensor-client

# Verificar estado completo
sudo systemctl status secado-sensor-client secado-restart.timer

# Logs completos
sudo journalctl -u secado-sensor-client --since "today" | tail -100
```

## 🚀 Mejoras Implementadas

### Configuración Optimizada
- **3 sensores** dedicados (Horno + Pilas 5 y 6)
- **Pines GPIO optimizados** para evitar conflictos
- **SPI independiente** por sensor para máxima estabilidad
- **Método probado** basado en test_sensores_simple.py

### Pines Seleccionados
- **GPIO 14**: Horno (Pin físico 8)
- **GPIO 23, 25**: Pines asignados para CS (Pilas 5 y 6)
- **Evita pines problemáticos**: GPIO 15 (UART), GPIO 18 (PWM)

### Ventajas de la Nueva Configuración
1. **Mayor estabilidad** - Sin interferencias entre sensores
2. **Lecturas consistentes** - Método SPI independiente
3. **Pines optimizados** - Evita conflictos de funciones especiales
4. **Fácil mantenimiento** - Configuración clara y documentada
5. **Escalabilidad** - Fácil agregar más sensores si es necesario

### Scripts de Prueba Disponibles
- `test_sensores_simple.py` - Prueba rápida de lectura
- `test_sensores_multiple_simple.py` - Prueba con múltiples lecturas
- `diagnostico_conexiones.py` - Diagnóstico de problemas de conexión