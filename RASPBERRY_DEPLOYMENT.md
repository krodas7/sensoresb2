# 🍓 Despliegue en Raspberry Pis - Sistema IoT de Monitoreo

Este documento explica cómo desplegar los clientes de sensores en cada Raspberry Pi del sistema de monitoreo de beneficio de café.

## 📋 Resumen del Sistema

El sistema consta de 4 Raspberry Pis que envían datos al servidor central en `192.168.0.150:8000`:

| Raspberry Pi | IP | Función | Sensores | Endpoint |
|--------------|-----|---------|----------|----------|
| Raspberry 100 | 192.168.0.100 | Fermentación | 6 HC-SR04 (distancia) | `/api/v1/sensors/medicion/recibir/` |
| Raspberry 101 | 192.168.0.101 | Secado | 3 MAX6675 (temperatura) | `/api/v1/sensors/temperatura/recibir/` |
| Raspberry 102 | 192.168.0.102 | Guardiolas 1-2 | 2 MAX6675 (temperatura) | `/api/v1/sensors/temperatura/recibir/` |
| Raspberry 103 | 192.168.0.103 | Guardiolas 3-4 | 2 MAX6675 (temperatura) | `/api/v1/sensors/temperatura/recibir/` |

---

## 🚀 Instalación en Raspberry Pi 100 - Pilas de Fermentación

### 1. Copiar archivos a la Raspberry Pi
```bash
# Desde tu computadora (192.168.0.150)
scp -r raspberry_100_fermentacion/ laptop@192.168.0.100:/home/laptop/sensoresb2/
```

### 2. Conectar a la Raspberry Pi
```bash
ssh laptop@192.168.0.100
```

### 3. Instalar el servicio
```bash
cd /home/laptop/sensoresb2/raspberry_100_fermentacion/
chmod +x install_fermentacion_service.sh
./install_fermentacion_service.sh
```

### 4. Verificar que funciona
```bash
# Ver logs en tiempo real
sudo journalctl -u fermentacion-sensor-client -f

# Ver estado del servicio
sudo systemctl status fermentacion-sensor-client
```

### 5. Comandos útiles
```bash
# Reiniciar servicio
sudo systemctl restart fermentacion-sensor-client

# Detener servicio
sudo systemctl stop fermentacion-sensor-client

# Deshabilitar servicio (no arranca automáticamente)
sudo systemctl disable fermentacion-sensor-client
```

---

## 🌡️ Instalación en Raspberry Pi 101 - Pilas de Secado

### 1. Copiar archivos
```bash
scp -r raspberry_101_secado/ laptop@192.168.0.101:/home/laptop/sensoresb2/
```

### 2. Conectar y configurar
```bash
ssh laptop@192.168.0.101
cd /home/laptop/sensoresb2/raspberry_101_secado/
chmod +x install_secado_service.sh
./install_secado_service.sh
```

### 3. Verificar
```bash
sudo journalctl -u secado-sensor-client -f
sudo systemctl status secado-sensor-client
```

---

## 🌡️ Instalación en Raspberry Pi 102 - Guardiolas 1-2

### 1. Copiar archivos
```bash
scp -r raspberry_102_guardiolas_12/ laptop@192.168.0.102:/home/laptop/sensoresb2/
```

### 2. Conectar y configurar
```bash
ssh laptop@192.168.0.102
cd /home/laptop/sensoresb2/raspberry_102_guardiolas_12/
chmod +x install_guardiolas_12_service.sh
./install_guardiolas_12_service.sh
```

### 3. Verificar
```bash
sudo journalctl -u guardiolas-12-sensor-client -f
sudo systemctl status guardiolas-12-sensor-client
```

---

## 🌡️ Instalación en Raspberry Pi 103 - Guardiolas 3-4

### 1. Copiar archivos
```bash
scp -r raspberry_103_guardiolas_34/ laptop@192.168.0.103:/home/laptop/sensoresb2/
```

### 2. Conectar y configurar
```bash
ssh laptop@192.168.0.103
cd /home/laptop/sensoresb2/raspberry_103_guardiolas_34/
chmod +x install_guardiolas_34_service.sh
./install_guardiolas_34_service.sh
```

### 3. Verificar
```bash
sudo journalctl -u guardiolas-34-sensor-client -f
sudo systemctl status guardiolas-34-sensor-client
```

---

## 🔧 Configuración

Todos los scripts ya están configurados para conectarse al servidor en `192.168.0.150:8000`.

Si necesitas cambiar la IP del servidor, edita el archivo Python en cada Raspberry:

```python
# En raspberry_XXX_XXXX/raspberry_*_client.py
API_BASE_URL = "http://192.168.0.150:8000"  # Cambiar esta IP
```

---

## 📊 Verificar que el sistema funciona

### Desde el servidor (192.168.0.150):

```bash
# Ver resumen de fermentación
curl http://localhost:8000/api/v1/sensors/fermentacion/resumen/

# Ver resumen de temperaturas
curl http://localhost:8000/api/v1/sensors/temperatura/resumen/

# Ver todas las mediciones recientes
curl http://localhost:8000/api/v1/sensors/medicion/estadisticas/
```

### Desde Django shell:
```bash
cd backend
python manage.py shell
```

```python
from apps.sensors.models import Medicion, MedicionTemperatura

# Ver últimas mediciones de distancia
for m in Medicion.objects.all()[:10]:
    print(f"{m.recipiente.nombre}: {m.porcentaje_llenado}% - {m.timestamp}")

# Ver últimas mediciones de temperatura
for m in MedicionTemperatura.objects.all()[:10]:
    print(f"{m.sensor.nombre}: {m.temperatura}°C - {m.timestamp}")
```

---

## 🐛 Solución de Problemas

### La Raspberry no envía datos:

1. **Verificar que el servicio está corriendo:**
```bash
sudo systemctl status [nombre-servicio]
```

2. **Ver los logs para errores:**
```bash
sudo journalctl -u [nombre-servicio] -n 50
```

3. **Verificar conectividad con el servidor:**
```bash
ping 192.168.0.150
curl http://192.168.0.150:8000/api/v1/sensors/fermentacion/resumen/
```

4. **Reiniciar el servicio:**
```bash
sudo systemctl restart [nombre-servicio]
```

### Error de permisos GPIO:

```bash
sudo usermod -a -G gpio pi
sudo reboot
```

### Error de SPI (sensores de temperatura):

```bash
sudo raspi-config
# Ir a: Interfacing Options → SPI → Enable
sudo reboot
```

---

## 📝 Nombres de Servicios

| Raspberry Pi | Nombre del Servicio |
|--------------|---------------------|
| 100 (Fermentación) | `fermentacion-sensor-client` |
| 101 (Secado) | `secado-sensor-client` |
| 102 (Guardiolas 1-2) | `guardiolas-12-sensor-client` |
| 103 (Guardiolas 3-4) | `guardiolas-34-sensor-client` |

---

## ⏱️ Intervalos de Medición

- **Fermentación (distancia):** 3 minutos (180 segundos)
- **Secado (temperatura):** 30 segundos
- **Guardiolas (temperatura):** 30 segundos

---

## 🔄 Actualizar configuración después de cambios

Si modificas el código de algún script:

```bash
# En la Raspberry Pi
cd /home/pi/sensoresb2/raspberry_XXX_XXXX/
sudo systemctl restart [nombre-servicio]

# Ver que los cambios se aplicaron
sudo journalctl -u [nombre-servicio] -f
```

---

## 📞 Endpoints de la API

Todos los endpoints están en el servidor `http://192.168.0.150:8000`:

### Recepción de datos (POST - sin autenticación):
- `/api/v1/sensors/medicion/recibir/` - Mediciones de distancia (fermentación)
- `/api/v1/sensors/temperatura/recibir/` - Mediciones de temperatura

### Consulta de datos (GET - sin autenticación):
- `/api/v1/sensors/fermentacion/resumen/` - Resumen de fermentación
- `/api/v1/sensors/secado/resumen/` - Resumen de secado
- `/api/v1/sensors/temperatura/resumen/` - Resumen de temperaturas
- `/api/v1/sensors/medicion/estadisticas/` - Estadísticas generales
- `/api/v1/sensors/temperatura/estadisticas/` - Estadísticas de temperatura

---

## ✅ Lista de Verificación de Despliegue

- [ ] Raspberry Pi 100 desplegada y enviando datos
- [ ] Raspberry Pi 101 desplegada y enviando datos
- [ ] Raspberry Pi 102 desplegada y enviando datos
- [ ] Raspberry Pi 103 desplegada y enviando datos
- [ ] Verificar en el servidor que llegan datos de todas las Raspberry Pis
- [ ] Verificar que los cálculos de porcentaje son correctos
- [ ] Verificar que las temperaturas se leen correctamente
- [ ] Documentar cualquier problema encontrado

---

**Sistema migrado de `api-beneficio` a `sensoresb2` - ¡Listo para producción! 🚀**

