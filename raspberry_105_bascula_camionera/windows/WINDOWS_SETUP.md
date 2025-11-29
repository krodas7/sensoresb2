# 💻 Guía de Configuración para Windows

Esta guía explica cómo ejecutar el cliente de báscula en un sistema Windows.

**✨ Enfoque Simplificado:** El cliente solo necesita el nombre de la báscula y el peso. No se requiere información del dispositivo (IP, nombre de computadora, etc.).

## 📁 Archivos Disponibles

En este directorio (`windows/`) encontrarás:

- **`WINDOWS_SETUP.md`** (este archivo) - Guía completa de instalación
- **`ejecutar_bascula.bat`** - Script batch para ejecutar el cliente (doble clic o desde CMD)
- **`ejecutar_bascula.ps1`** - Script PowerShell para ejecutar el cliente
- **`instalar_servicio_windows.ps1`** - Instalador para ejecutar como servicio de Windows

## 🚀 Inicio Rápido

### Opción 1: Ejecutar con Script Batch (Más Fácil)

1. Edita `ejecutar_bascula.bat` y ajusta el puerto COM si es necesario:
   ```batch
   set SERIAL_PORT=COM1  ← Cambia si tu reloj está en otro puerto
   set BASCULA_NOMBRE=bascula camionera
   ```

2. Doble clic en `ejecutar_bascula.bat` o ejecuta desde CMD:
   ```cmd
   cd windows
   ejecutar_bascula.bat
   ```

### Opción 2: Ejecutar con PowerShell

1. Ejecuta PowerShell (como administrador si es necesario)
2. Navega al directorio:
   ```powershell
   cd C:\ruta\a\raspberry_105_bascula_camionera\windows
   ```
3. Ejecuta:
   ```powershell
   .\ejecutar_bascula.ps1
   ```

### Opción 3: Instalar como Servicio (Para Ejecución Automática)

Ver sección "Ejecutar como Servicio de Windows" más abajo.

## 📋 Requisitos Previos

1. **Python 3.7 o superior** instalado en Windows
2. **Puerto COM** donde está conectado el reloj digital (ej: COM1, COM2, COM3)
3. **Conexión a Internet** para comunicarse con el servidor API

## 🔧 Instalación

### 1. Instalar Python (si no está instalado)

1. Descargar Python desde [python.org](https://www.python.org/downloads/)
2. Durante la instalación, asegúrate de marcar "Add Python to PATH"
3. Verificar instalación:
```cmd
python --version
pip --version
```

### 2. Instalar Dependencias

Abrir PowerShell o CMD como administrador y ejecutar:

```cmd
pip install pyserial requests
```

O instalar desde el archivo `requirements.txt`:

```cmd
cd C:\ruta\a\raspberry_105_bascula_camionera
pip install -r requirements.txt
```

### 3. Verificar Puerto COM

Para ver qué puertos COM están disponibles en tu sistema:

```cmd
mode
```

O usar PowerShell:
```powershell
[System.IO.Ports.SerialPort]::getportnames()
```

## ⚙️ Configuración

### Opción 1: Configurar mediante Variables de Entorno

Establecer variables de entorno en Windows:

#### En CMD:
```cmd
set SERIAL_PORT=COM1
set SERIAL_BAUDRATE=9600
set BASCULA_NOMBRE=bascula camionera
```

#### En PowerShell:
```powershell
$env:SERIAL_PORT="COM1"
$env:SERIAL_BAUDRATE="9600"
$env:BASCULA_NOMBRE="bascula camionera"
```

### Opción 2: Editar el Código Directamente

Si prefieres editar el archivo `raspberry_bascula_client.py` directamente, busca estas líneas y modifícalas:

```python
# Para Windows, cambiar el puerto por defecto
if ES_WINDOWS:
    SERIAL_PORT = os.environ.get('SERIAL_PORT', 'COM1')  # Cambiar COM1 por tu puerto

# Nombre de la báscula (único identificador necesario)
BASCULA_NOMBRE = os.environ.get('BASCULA_NOMBRE', 'bascula camionera')
```

## 🚀 Ejecución

### Ejecución Manual

```cmd
cd C:\ruta\a\raspberry_105_bascula_camionera
python raspberry_bascula_client.py
```

### Ejecutar como Servicio de Windows

Para ejecutar automáticamente al iniciar Windows, puedes crear una tarea programada:

1. Abrir "Programador de tareas" (Task Scheduler)
2. Crear tarea básica
3. Configurar para ejecutar al inicio:
   - Programa: `python`
   - Argumentos: `C:\ruta\a\raspberry_105_bascula_camionera\raspberry_bascula_client.py`
   - Directorio de inicio: `C:\ruta\a\raspberry_105_bascula_camionera`

O usar un servicio como **NSSM (Non-Sucking Service Manager)**:

```cmd
# Descargar NSSM desde https://nssm.cc/download
# Instalar como servicio
nssm install BasculaCamionera python.exe "C:\ruta\a\raspberry_bascula_camionera\raspberry_bascula_client.py"
nssm set BasculaCamionera AppDirectory "C:\ruta\a\raspberry_105_bascula_camionera"
nssm start BasculaCamionera
```

## 📝 Preguntas Frecuentes

### ¿Qué información necesito configurar?

**Solo el nombre de la báscula y el puerto serial.** El sistema está simplificado para que solo necesites:
- Nombre de la báscula (ej: "bascula camionera")
- Puerto COM donde está conectado el reloj (ej: COM1)

**No se requiere:**
- ❌ IP del dispositivo
- ❌ Nombre de la computadora
- ❌ Información de red
- ❌ Identificadores adicionales

### ¿Debo usar el nombre "raspberry" aunque esté en Windows?

**No.** No necesitas ningún nombre de dispositivo. El sistema solo usa el nombre de la báscula para identificar las mediciones. Puedes usar cualquier nombre descriptivo para la báscula:

**Ejemplos:**
```cmd
set BASCULA_NOMBRE=bascula camionera
set BASCULA_NOMBRE=bascula transformacion
set BASCULA_NOMBRE=bascula especial
```

### ¿Cómo se identifican las básculas en el servidor?

El servidor identifica las básculas **únicamente por su nombre**. No necesita información del dispositivo. Por ejemplo:
- "bascula camionera" → Una báscula
- "bascula transformacion" → Otra báscula
- "bascula especial" → Otra báscula más

Cada nombre de báscula se maneja independientemente en el backend.

### ¿Cómo saber qué puerto COM usar?

1. Abrir "Administrador de dispositivos" (Device Manager)
2. Expandir "Puertos (COM y LPT)"
3. Buscar tu dispositivo serial/USB
4. Anotar el número COM (ej: COM1, COM2, COM3)

O usar PowerShell:
```powershell
[System.IO.Ports.SerialPort]::getportnames()
```

### ¿Cómo ejecutar en segundo plano?

Puedes usar `pythonw.exe` en lugar de `python.exe` para ejecutar sin ventana:

```cmd
pythonw raspberry_bascula_client.py
```

O crear un archivo batch (`.bat`) que ejecute el script:

```batch
@echo off
cd /d "C:\ruta\a\raspberry_105_bascula_camionera"
pythonw raspberry_bascula_client.py
```

## 🔍 Solución de Problemas

### Error: "No module named 'serial'"

Instalar la dependencia:
```cmd
pip install pyserial
```

### Error: "could not open port 'COM1'"

1. Verificar que el puerto COM existe y está disponible
2. Verificar permisos del usuario
3. Cerrar otros programas que usen el puerto
4. Verificar que el reloj digital esté conectado

### Error: "Permission denied" en puerto COM

1. Ejecutar CMD/PowerShell como Administrador
2. Verificar que ningún otro programa esté usando el puerto

### Los datos no se envían al servidor

1. Verificar conexión a Internet
2. Verificar que el servidor esté accesible:
```cmd
ping 68.183.155.4
```
3. Verificar credenciales de API en el código
4. Revisar los logs en `%USERPROFILE%\logs\bascula\bascula_camionera_client.log`

## 📊 Verificación de Funcionamiento

### Ver logs en tiempo real

Los logs se guardan en:
```
%USERPROFILE%\logs\bascula\bascula_camionera_client.log
```

Para verlos en tiempo real:
```cmd
powershell Get-Content "%USERPROFILE%\logs\bascula\bascula_camionera_client.log" -Wait -Tail 50
```

### Probar conexión al servidor

```cmd
curl -u laptop:beneficiob2 http://68.183.155.4:8000/api/v1/sensors/bascula/resumen/
```

## 📞 Soporte

Si tienes problemas, verifica:
1. ✅ Python instalado correctamente
2. ✅ Dependencias instaladas (`pyserial`, `requests`)
3. ✅ Puerto COM correcto y disponible
4. ✅ Conexión a Internet activa
5. ✅ Servidor API accesible
6. ✅ Logs para ver errores específicos

