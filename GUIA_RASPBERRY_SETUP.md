# 🌡️ Guía de Configuración Raspberry Pi → Backend

## 📋 Opciones de Comunicación

### Opción 1: MQTT (✅ Recomendado para IoT)

**Ventajas:**
- Protocolo diseñado para IoT
- Desacoplamiento entre sensores y backend
- Menor carga en el backend
- Reintentos automáticos
- Escalable

**Desventajas:**
- Requiere broker MQTT (ya tienes Mosquitto)

---

### Opción 2: HTTP REST (Ya implementado)

**Ventajas:**
- Simple y directo
- Ya lo tienes funcionando

**Desventajas:**
- Más carga en el backend
- Cada Pi hace request directo
- Si el backend cae, pierdes datos

---

## 🚀 Implementación MQTT (Recomendado)

### 1. En la Raspberry Pi

```bash
# 1. Instalar librerías
sudo pip3 install paho-mqtt

# 2. Copiar el archivo
# Copiar raspberry_mqtt_client.py a la Raspberry

# 3. Configurar variables
nano raspberry_mqtt_client.py
```

**Configurar:**
```python
MQTT_BROKER = "192.168.0.21"  # IP del backend
SENSOR_ID = 1  # ID del sensor en BD
AREA_TYPE = "guardiola-1"  # Tipo de área
```

### 2. Integrar con el sensor real

En la función `read_real_sensor()`:

```python
def read_real_sensor(self):
    # Para MAX6675:
    import max6675
    cs = 8
    sck = 11
    so = 9
    sensor = max6675.MAX6675(sck, cs, so)
    temp = sensor.read_temp()
    return temp
    
    # Para DHT22:
    # import Adafruit_DHT
    # sensor = Adafruit_DHT.DHT22
    # pin = 4
    # humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)
    # return temperature
```

### 3. Ejecutar en la Raspberry

```bash
# Ejecutar manualmente
python3 raspberry_mqtt_client.py

# Ejecutar como servicio (recomendado)
sudo nano /etc/systemd/system/sensor-mqtt.service
```

**Contenido del servicio:**
```ini
[Unit]
Description=Sensor MQTT Client
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /home/pi/raspberry_mqtt_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Activar servicio:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable sensor-mqtt.service
sudo systemctl start sensor-mqtt.service
sudo systemctl status sensor-mqtt.service
```

---

## 🔧 Configuración del Backend

### 1. Verificar que Mosquitto esté corriendo

```bash
# En el servidor backend
sudo systemctl status mosquitto

# Si no está corriendo:
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

### 2. Verificar configuración MQTT

El backend ya está configurado para recibir MQTT:
- **Topic:** `beneficio/{area_type}/sensor/{sensor_id}/{sensor_type}`
- **Puerto:** 1883
- **Sin autenticación** (configurado en `mosquitto.conf`)

### 3. Estructura del mensaje MQTT

```json
{
  "v": 25.5,
  "u": "°C",
  "t": "2025-10-27T10:30:00",
  "s": "OK"
}
```

**Campos:**
- `v`: valor (temperatura)
- `u`: unidad (°C, %, etc.)
- `t`: timestamp (ISO 8601)
- `s`: status (OK, ERROR, etc.)

---

## 🧪 Pruebas

### 1. Probar desde la Raspberry

```bash
# Instalar mosquitto-client
sudo apt install mosquitto-clients

# Publicar mensaje de prueba
mosquitto_pub -h 192.168.0.21 -t "beneficio/test/sensor/1/temp" -m '{"v":25.5,"u":"°C","t":"2025-10-27T10:30:00","s":"OK"}'
```

### 2. Verificar en el backend

```bash
# Ver logs de Django
tail -f backend/logs/django.log | grep MQTT

# Verificar base de datos
python manage.py shell
>>> from apps.temperatures.models import Reading
>>> Reading.objects.all().order_by('-timestamp')[:5]
```

### 3. Verificar en el dashboard

- Ir a **Monitoreo de Temperaturas**
- Verificar que aparezcan las lecturas
- Verificar que el gráfico se actualice

---

## 🔐 Seguridad (Opcional pero Recomendado)

### 1. Agregar autenticación MQTT

**En el servidor (mosquitto.conf):**
```conf
listener 1883
password_file /etc/mosquitto/passwd
allow_anonymous false
```

**Crear usuario:**
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd raspberry
# Ingresar contraseña
sudo systemctl restart mosquitto
```

**En la Raspberry:**
```python
MQTT_USERNAME = "raspberry"
MQTT_PASSWORD = "tu_contraseña"
```

### 2. Usar SSL/TLS

```bash
# Generar certificados
sudo mosquitto ...
# Configurar raspberry_mqtt_client.py para usar SSL
```

---

## 📊 Monitoreo

### Ver mensajes MQTT en tiempo real

```bash
# Suscribirse a todos los topics del beneficio
mosquitto_sub -h 192.168.0.21 -t "beneficio/#" -v
```

### Ver logs del sistema

```bash
# Logs de Mosquitto
sudo tail -f /var/log/mosquitto/mosquitto.log

# Logs de Django
tail -f backend/logs/django.log
```

---

## 🐛 Troubleshooting

### Problema: No se conecta al broker

```bash
# Verificar conectividad
ping 192.168.0.21

# Verificar puerto
nc -zv 192.168.0.21 1883

# Verificar firewall
sudo ufw status
```

### Problema: Mensajes no llegan al backend

```bash
# Verificar que el consumer MQTT esté activo
# En el servidor backend, iniciar Daphne con Channels
daphne -b 0.0.0.0 -p 8001 beneficio.asgi:application

# Verificar logs
tail -f backend/logs/django.log | grep mqtt
```

### Problema: Datos no aparecen en el dashboard

```bash
# Verificar modelos
python manage.py shell
>>> from apps.temperatures.models import Reading
>>> Reading.objects.count()
>>> Reading.objects.last()

# Verificar WebSocket
# Abrir consola del navegador, ver Network > WS
```

---

## 📝 Checklist de Implementación

- [ ] Instalar `paho-mqtt` en Raspberry Pi
- [ ] Configurar `MQTT_BROKER` y `SENSOR_ID`
- [ ] Integrar código de lectura del sensor real
- [ ] Ejecutar script de prueba
- [ ] Configurar como servicio systemd
- [ ] Verificar conexión MQTT
- [ ] Verificar datos en backend
- [ ] Verificar dashboard en tiempo real
- [ ] (Opcional) Configurar autenticación
- [ ] (Opcional) Configurar SSL/TLS

---

## 📚 Referencias

- [Paho MQTT](https://www.eclipse.org/paho/index.php?page=clients/python/docs/index.php)
- [Mosquitto](https://mosquitto.org/)
- [Channels Django](https://channels.readthedocs.io/)

