# ⚖️ Cliente de Báscula Camionera - Multiplataforma

## 📂 Estructura del Proyecto

```
raspberry_105_bascula_camionera/
├── raspberry_bascula_client.py  # Código principal (multiplataforma)
├── requirements.txt              # Dependencias Python
├── README.md                     # Esta documentación
├── BACKEND_SETUP.md              # Instrucciones para backend
├── COMO_USAR_OTRAS_BASCULAS.md  # Guía para otras básculas
│
├── linux/                        # Archivos específicos de Linux/Raspberry Pi
│   ├── *.service                 # Archivos de servicio systemd
│   ├── *.timer                   # Timers de reinicio
│   ├── *.sh                      # Scripts de instalación y gestión
│   └── install_bascula_camionera_service.sh
│
└── windows/                      # Archivos específicos de Windows
    ├── WINDOWS_SETUP.md          # Guía de instalación Windows
    ├── ejecutar_bascula.bat      # Script batch para ejecutar
    ├── ejecutar_bascula.ps1      # Script PowerShell para ejecutar
    └── instalar_servicio_windows.ps1  # Instalador de servicio
```

## 📦 ¿Cómo Desplegar el Código?

**👉 IMPORTANTE:** Copia TODO el directorio completo al dispositivo destino y ejecuta los scripts desde los subdirectorios `linux/` o `windows/`.

**Ejemplo:**
```bash
# 1. Copiar todo el directorio a Raspberry Pi
scp -r raspberry_105_bascula_camionera/ usuario@192.168.0.105:/home/usuario/

# 2. En Raspberry Pi, ejecutar desde linux/
cd /home/usuario/raspberry_105_bascula_camionera/linux
sudo bash install_bascula_camionera_service.sh
```

**Los scripts automáticamente detectan el directorio padre donde está el código Python.**

**👉 Ver guía completa de instalación:** [README_INSTALACION.md](./README_INSTALACION.md)

---

## 📋 Información General
- **IP**: 192.168.0.105
- **Función**: Monitoreo de báscula camionera mediante reloj digital
- **Tipo de Sensor**: Reloj digital de báscula (comunicación serial)
- **Intervalo de Lectura**: 2 segundos
- **API Destino**: http://68.183.155.4:8000
- **Usuario**: laptop
- **Reinicio Automático**: Cada 3 horas
- **Formato de Datos**: Peso en quintales desde reloj digital serial

## 🔌 Configuración del Reloj Digital

### Conexión Serial

#### En Linux (Raspberry Pi):
```
Puerto Serial: /dev/ttyUSB0 (o /dev/ttyAMA0 en algunas configuraciones)
Baudrate: 9600 (ajustar si es necesario)
```

#### En Windows:
```
Puerto Serial: COM1, COM2, COM3, etc. (ajustar según tu sistema)
Baudrate: 9600 (ajustar si es necesario)
```

**Configuración común:**
- Bits de datos: 8
- Paridad: None
- Bits de parada: 1
- Timeout: 1 segundo

### Variables de Entorno (Configuración Opcional)

Puedes configurar el comportamiento del cliente usando variables de entorno:

```bash
# Puerto serial (opcional - se detecta automáticamente según el OS)
export SERIAL_PORT="COM1"        # En Windows
export SERIAL_PORT="/dev/ttyUSB0"  # En Linux

# Baudrate (opcional - por defecto 9600)
export SERIAL_BAUDRATE="9600"

# Nombre de la báscula (opcional - se puede cambiar en el código)
export BASCULA_NOMBRE="bascula camionera"
```

**✨ Enfoque Simplificado:**
- El cliente solo envía el **nombre de la báscula** y el **peso**
- No se requiere información del dispositivo (IP, nombre de computadora, etc.)
- El servidor identifica la báscula únicamente por su nombre
- Funciona igual en Windows, Linux, Raspberry Pi sin configuración adicional

### Formato de Datos del Reloj
El reloj digital envía datos en el siguiente formato:
- **Peso estable**: `"3950G    "` (39.50 quintales, estable)
- **Peso moviéndose**: `"3950m    "` (39.50 quintales, no estable)

El sistema solo envía datos al servidor cuando el peso está estable (termina en "G").

### Conversión de Datos
- El reloj envía el peso como un número entero seguido de "G" o "m" y 4 espacios
- Ejemplo: `3950` = 39.50 quintales (se divide por 100)
- Solo se procesan y envían datos cuando terminan en "G" (estable)

## 📦 Instalación

### 🐧 Para Linux/Raspberry Pi

Ver los scripts en el directorio `linux/`:

```bash
cd linux
sudo bash install_bascula_camionera_service.sh
```

Ver detalles completos en: [README.md Linux](linux/README.md) (si existe) o en la sección de instalación más abajo.

### 💻 Para Windows

Ver los scripts en el directorio `windows/`:

**Opción rápida:**
```cmd
cd windows
ejecutar_bascula.bat
```

**Para más información:** [windows/WINDOWS_SETUP.md](windows/WINDOWS_SETUP.md)

---

## 📦 Instalación del Servicio en Linux/Raspberry Pi

### 1. Preparar el Sistema
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y python3-pip python3-venv git

# Habilitar acceso serial para el usuario
sudo usermod -a -G dialout laptop
```

### 2. Instalar Servicio de Báscula
```bash
# Navegar al directorio linux
cd linux

# Ejecutar script de instalación
sudo bash install_bascula_camionera_service.sh

# Verificar instalación
sudo systemctl status bascula-camionera-sensor-client
```

### 3. Configurar Usuario y Permisos
```bash
# Crear usuario laptop si no existe
sudo useradd -m -s /bin/bash laptop
sudo usermod -a -G dialout laptop

# Configurar directorio de trabajo (ajustar según donde esté el proyecto)
sudo mkdir -p /home/laptop/bascula_camionera
sudo chown -R laptop:laptop /home/laptop/bascula_camionera

# Configurar logs
sudo mkdir -p /var/log/bascula
sudo chown -R laptop:laptop /var/log/bascula
```

**Nota:** El script de instalación en `linux/install_bascula_camionera_service.sh` detecta automáticamente la ruta del proyecto, así que funciona desde cualquier ubicación.

## 🚀 Uso del Sistema

### Comandos de Servicio
```bash
# Iniciar servicio
sudo systemctl start bascula-camionera-sensor-client

# Detener servicio
sudo systemctl stop bascula-camionera-sensor-client

# Reiniciar servicio
sudo systemctl restart bascula-camionera-sensor-client

# Ver estado
sudo systemctl status bascula-camionera-sensor-client

# Habilitar inicio automático
sudo systemctl enable bascula-camionera-sensor-client
```

### Verificación de Logs
```bash
# Ver logs en tiempo real
sudo journalctl -u bascula-camionera-sensor-client -f

# Ver logs del archivo
tail -f /var/log/bascula/bascula_camionera_client.log

# Ver últimos logs
sudo journalctl -u bascula-camionera-sensor-client --since "1 hour ago"
```

### Prueba del Serial

#### En Linux (Raspberry Pi):
```bash
# Verificar puerto serial disponible
ls -l /dev/tty*

# Probar lectura serial manual
python3 -c "
import serial
ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=1)
for i in range(10):
    if ser.in_waiting > 0:
        data = ser.readline().decode('utf-8', errors='ignore').strip()
        print(f'Dato recibido: {data}')
    import time
    time.sleep(1)
ser.close()
"
```

#### En Windows:
```cmd
REM Ver puertos COM disponibles
mode

REM Probar lectura serial manual en Python
python -c "import serial; import time; ser = serial.Serial('COM1', 9600, timeout=1); [print(f'Dato: {ser.readline().decode(\"utf-8\", errors=\"ignore\").strip()}') if ser.in_waiting > 0 else None for _ in range(10) if time.sleep(1) or True]; ser.close()"
```

### Ejecución en Windows

El código está preparado para funcionar tanto en Raspberry Pi/Linux como en Windows.

**Forma más fácil - Usar los scripts incluidos:**

1. **Ejecutar directamente (batch):**
   ```cmd
   cd windows
   ejecutar_bascula.bat
   ```
   (Edita `ejecutar_bascula.bat` para cambiar el puerto COM y nombre de báscula)

2. **Ejecutar con PowerShell:**
   ```powershell
   cd windows
   .\ejecutar_bascula.ps1
   ```

3. **Instalar como servicio:**
   ```powershell
   cd windows
   .\instalar_servicio_windows.ps1 -PuertoCOM COM1 -NombreBascula "bascula camionera"
   ```

**📁 Para más información sobre Windows, consulta:** [windows/WINDOWS_SETUP.md](windows/WINDOWS_SETUP.md)

**✨ Ventajas del sistema simplificado:**

1. **No requiere información del dispositivo:** Solo necesitas el nombre de la báscula
2. **Multiplataforma:** Funciona igual en Windows, Linux y Raspberry Pi
3. **Configuración mínima:** Solo ajusta el puerto serial si es necesario
4. **Fácil de usar:** Cambia el nombre de la báscula y listo

## 📡 Configuración de Red

### Configuración Estática
```bash
# Editar configuración de red
sudo nano /etc/dhcpcd.conf

# Agregar al final:
interface eth0
static ip_address=192.168.0.105/24
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
curl -u laptop:beneficiob2 http://68.183.155.4:8000/api/v1/sensors/bascula/resumen/
```

## 🔄 Reinicio Automático

### Configuración del Timer
```bash
# Verificar timer de reinicio
sudo systemctl status bascula-camionera-restart.timer

# Ver logs del timer
sudo journalctl -u bascula-camionera-restart.timer

# Reiniciar manualmente
sudo systemctl restart bascula-camionera-sensor-client
```

### Gestión de Reinicios
```bash
# Usar script de gestión
./manage_restart.sh status
./manage_restart.sh logs
./manage_restart.sh restart
```

## 🛠️ Mantenimiento

### Actualización del Código
```bash
# Detener servicio
sudo systemctl stop bascula-camionera-sensor-client

# Actualizar código
cd /home/laptop/bascula_camionera
git pull origin main

# Reiniciar servicio
sudo systemctl start bascula-camionera-sensor-client
```

### Limpieza de Logs
```bash
# Limpiar logs antiguos
sudo journalctl --vacuum-time=7d

# Limpiar logs del archivo
sudo truncate -s 0 /var/log/bascula/bascula_camionera_client.log
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Servicio no inicia
```bash
# Verificar logs
sudo journalctl -u bascula-camionera-sensor-client -n 50

# Verificar permisos
ls -la /home/laptop/bascula_camionera/
sudo chown -R laptop:laptop /home/laptop/bascula_camionera/

# Verificar permisos del puerto serial
ls -l /dev/ttyUSB0
sudo chmod 666 /dev/ttyUSB0  # Temporal, mejor agregar usuario al grupo dialout
```

#### 2. Puerto serial no responde
```bash
# Verificar que el puerto existe
ls -l /dev/ttyUSB0

# Verificar permisos
groups laptop  # Debe incluir 'dialout'

# Verificar si hay otro proceso usando el puerto
sudo lsof /dev/ttyUSB0

# Probar conexión manual
sudo python3 -c "
import serial
try:
    ser = serial.Serial('/dev/ttyUSB0', 9600, timeout=1)
    print('Puerto serial abierto correctamente')
    ser.close()
except Exception as e:
    print(f'Error: {e}')
"
```

#### 3. Errores de comunicación
```bash
# Verificar baudrate (puede ser diferente según el reloj)
# Ajustar en raspberry_bascula_client.py si es necesario
nano raspberry_bascula_client.py
# Buscar: SERIAL_BAUDRATE = 9600

# Verificar formato de datos
# El reloj puede enviar datos en diferentes formatos
```

#### 4. Problemas de red
```bash
# Verificar conectividad
ping 192.168.0.150

# Verificar DNS
nslookup 192.168.0.150

# Verificar firewall
sudo ufw status
```

### Logs de Diagnóstico
```bash
# Ver todos los logs del sistema
sudo journalctl -u bascula-camionera-sensor-client --since "1 hour ago"

# Ver logs de red
sudo journalctl -u NetworkManager --since "1 hour ago"

# Ver logs de serial
dmesg | grep tty
```

## 📈 Monitoreo

### Dashboard Web
- **URL**: http://68.183.155.4:8000/dashboard/mejorado/
- **Usuario**: laptop
- **Contraseña**: beneficiob2

### API Endpoints
- **Recibir datos**: http://68.183.155.4:8000/api/v1/sensors/bascula/recibir/
- **Resumen**: http://68.183.155.4:8000/api/v1/sensors/bascula/resumen/
- **Estadísticas**: http://68.183.155.4:8000/api/v1/sensors/bascula/estadisticas/

### Verificación Remota
```bash
# Desde el servidor, verificar datos
curl -u laptop:beneficiob2 http://68.183.155.4:8000/api/v1/sensors/bascula/resumen/ | jq '.[] | select(.bascula_nombre | contains("camionera"))'
```

## 🔄 Usar el Código con Otras Básculas

Para usar este código con otras básculas (transformación, especial, etc.), **solo necesitas cambiar el nombre de la báscula**.

### 📋 Opción 1: Modificar el Código

En `raspberry_bascula_client.py`, cambia esta línea:
```python
BASCULA_NOMBRE = "bascula camionera"  # Cambiar por "bascula transformacion", "bascula especial", etc.
```

### 🔧 Opción 2: Variable de Entorno (Recomendado)

**En Linux/Raspberry Pi:**
```bash
export BASCULA_NOMBRE="bascula transformacion"
python raspberry_bascula_client.py
```

**En Windows:**
```cmd
set BASCULA_NOMBRE=bascula transformacion
python raspberry_bascula_client.py
```

**Nombres comunes:**
- `"bascula camionera"` (actual)
- `"bascula transformacion"`
- `"bascula especial"`

**👉 Ver guía completa:** [COMO_USAR_OTRAS_BASCULAS.md](./COMO_USAR_OTRAS_BASCULAS.md)

El backend creará automáticamente las básculas cuando reciba datos con nombres diferentes.

---

## 📝 Instrucciones para Modificar el Backend

### ⚠️ IMPORTANTE: Configuración del Backend

Antes de usar este cliente, necesitas modificar el backend Django para que pueda recibir y almacenar los datos de las básculas.

**👉 Ver las instrucciones completas en: [BACKEND_SETUP.md](./BACKEND_SETUP.md)**

El archivo `BACKEND_SETUP.md` contiene todas las instrucciones detalladas paso a paso para:
- Agregar modelos al backend
- Crear serializers
- Agregar views y endpoints
- Configurar URLs
- Crear y aplicar migraciones
- Verificar que todo funcione correctamente

---

## 📞 Soporte

### Información de Contacto
- **Sistema**: API Beneficio - Báscula Camionera
- **Raspberry Pi**: 192.168.0.105
- **Servidor API**: 68.183.155.4:8000
- **Tipo de Sensor**: Reloj digital de báscula (Serial)

### Archivos Importantes
- **Código principal**: `/home/laptop/bascula_camionera/raspberry_bascula_client.py`
- **Servicio**: `/etc/systemd/system/bascula-camionera-sensor-client.service`
- **Logs**: `/var/log/bascula/bascula_camionera_client.log`
- **Configuración serial**: Editar `SERIAL_PORT` y `SERIAL_BAUDRATE` en el código

### Comandos de Emergencia
```bash
# Reinicio completo del sistema
sudo systemctl restart bascula-camionera-sensor-client

# Verificar estado completo
sudo systemctl status bascula-camionera-sensor-client bascula-camionera-restart.timer

# Logs completos
sudo journalctl -u bascula-camionera-sensor-client --since "today" | tail -100
```

---

## ✅ Resumen de Endpoints

Una vez modificado el backend siguiendo las instrucciones en `BACKEND_SETUP.md`, estarán disponibles los siguientes endpoints:

1. **POST** `/api/v1/sensors/bascula/recibir/` - Recibir datos de báscula
2. **GET** `/api/v1/sensors/bascula/` - Listar básculas
3. **GET** `/api/v1/sensors/bascula/<id>/` - Detalle de báscula
4. **GET** `/api/v1/sensors/bascula/medicion/` - Listar mediciones
5. **GET** `/api/v1/sensors/bascula/resumen/` - Resumen de básculas
6. **GET** `/api/v1/sensors/bascula/estadisticas/` - Estadísticas de básculas

Todos los endpoints requieren autenticación excepto los marcados con `@permission_classes([AllowAny])` que son:
- `/api/v1/sensors/bascula/recibir/`
- `/api/v1/sensors/bascula/resumen/`
- `/api/v1/sensors/bascula/estadisticas/`

Para más detalles, consulta el archivo `BACKEND_SETUP.md`.

