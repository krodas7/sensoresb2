# 📦 Guía de Instalación y Despliegue

Esta guía explica cómo copiar y usar el código en diferentes dispositivos.

## 🎯 Respuesta Rápida

**Copia TODO el directorio completo** al dispositivo (Windows o Linux) y ejecuta los scripts desde los subdirectorios `linux/` o `windows/`.

## 📋 Estructura del Proyecto

```
raspberry_105_bascula_camionera/
├── raspberry_bascula_client.py  ← Código principal (multiplataforma)
├── requirements.txt              ← Dependencias (mismo para ambos)
├── README.md
│
├── linux/                        ← Scripts específicos Linux/Raspberry Pi
│   └── *.sh, *.service           ← Estos scripts referencian archivos de la raíz
│
└── windows/                      ← Scripts específicos Windows
    └── *.bat, *.ps1              ← Estos scripts referencian archivos de la raíz
```

## 🐧 Instalación en Linux/Raspberry Pi

### Paso 1: Copiar Todo el Directorio

```bash
# Copiar todo el directorio al dispositivo Linux/Raspberry Pi
scp -r raspberry_105_bascula_camionera/ usuario@192.168.0.105:/home/usuario/

# O clonar desde git si está en un repositorio
git clone [url-repositorio] /home/usuario/raspberry_105_bascula_camionera
```

### Paso 2: Ejecutar Script de Instalación

```bash
# Navegar al directorio completo
cd /home/usuario/raspberry_105_bascula_camionera

# Ejecutar script desde el subdirectorio linux/
cd linux
sudo bash install_bascula_camionera_service.sh
```

**Los scripts de `linux/` automáticamente detectan el directorio padre (raíz) donde está `raspberry_bascula_client.py`**

## 💻 Instalación en Windows

### Paso 1: Copiar Todo el Directorio

```cmd
REM Copiar todo el directorio a Windows
REM Ejemplo: C:\bascula\raspberry_105_bascula_camionera\
```

### Paso 2: Ejecutar Scripts

```cmd
REM Opción 1: Ejecutar directamente
cd C:\bascula\raspberry_105_bascula_camionera\windows
ejecutar_bascula.bat

REM Opción 2: Instalar como servicio
cd C:\bascula\raspberry_105_bascula_camionera\windows
powershell -ExecutionPolicy Bypass -File instalar_servicio_windows.ps1
```

**Los scripts de `windows/` automáticamente detectan el directorio padre donde está `raspberry_bascula_client.py`**

## ✅ Qué Copiar

### En Linux/Raspberry Pi:

```
✅ Copiar TODO:
- raspberry_bascula_client.py
- requirements.txt
- linux/ (todos los archivos)
- README.md (opcional, pero útil)

❌ NO necesitas:
- windows/ (solo si no es Windows)
```

### En Windows:

```
✅ Copiar TODO:
- raspberry_bascula_client.py
- requirements.txt
- windows/ (todos los archivos)
- README.md (opcional, pero útil)

❌ NO necesitas:
- linux/ (solo si no es Linux)
```

## 🔍 Cómo Funcionan los Scripts

Los scripts están diseñados para **detectar automáticamente** el directorio padre:

### Ejemplo: Script de Windows

```batch
REM ejecutar_bascula.bat
cd /d "%~dp0.."  ← Sube al directorio padre
python raspberry_bascula_client.py  ← Ejecuta el código de la raíz
```

### Ejemplo: Script de Linux

```bash
# install_bascula_camionera_service.sh
LINUX_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"  ← Directorio linux/
PROJECT_DIR="$(cd "$LINUX_DIR/.." && pwd)"  ← Directorio padre (raíz)
# Usa $PROJECT_DIR/raspberry_bascula_client.py
```

## 📝 Ejemplo Completo: Despliegue en Raspberry Pi

```bash
# 1. En tu máquina de desarrollo, comprimir el proyecto
cd /ruta/al/proyecto
tar -czf bascula.tar.gz raspberry_105_bascula_camionera/

# 2. Copiar a Raspberry Pi
scp bascula.tar.gz laptop@192.168.0.105:/home/laptop/

# 3. En Raspberry Pi, extraer
ssh laptop@192.168.0.105
cd /home/laptop
tar -xzf bascula.tar.gz

# 4. Instalar
cd raspberry_105_bascula_camionera/linux
sudo bash install_bascula_camionera_service.sh

# ✅ Listo! El servicio está corriendo
```

## 📝 Ejemplo Completo: Despliegue en Windows

```cmd
REM 1. Copiar carpeta completa a Windows (por red, USB, etc.)
REM Ejemplo: Copiar a C:\bascula\

REM 2. Abrir CMD o PowerShell en Windows

REM 3. Instalar dependencias
cd C:\bascula\raspberry_105_bascula_camionera
pip install -r requirements.txt

REM 4. Ejecutar (opción 1: directo)
cd windows
ejecutar_bascula.bat

REM O instalar como servicio (opción 2)
cd windows
powershell -ExecutionPolicy Bypass -File instalar_servicio_windows.ps1
```

## ❓ Preguntas Frecuentes

### ¿Puedo copiar solo algunos archivos?

**No recomendado.** Los scripts esperan encontrar `raspberry_bascula_client.py` en el directorio padre. Si cambias la estructura, tendrás que modificar las rutas en los scripts.

### ¿Puedo cambiar el nombre del directorio?

**Sí**, puedes renombrar el directorio principal. Los scripts detectan automáticamente las rutas relativas, así que funcionará igual.

**Ejemplo:**
```bash
# Cambiar nombre está bien
mv raspberry_105_bascula_camionera mi_bascula
cd mi_bascula/linux
sudo bash install_bascula_camionera_service.sh  # Funciona igual
```

### ¿Debo copiar también los archivos .md de documentación?

**Opcional pero recomendado.** Los archivos `.md` son solo documentación y no son necesarios para que el código funcione, pero son útiles para referencia.

### ¿Puedo tener el código en diferentes ubicaciones en cada dispositivo?

**Sí**, cada dispositivo puede tener el código en diferentes rutas. Los scripts ajustan automáticamente las rutas.

**Ejemplo:**
- Raspberry Pi: `/home/laptop/bascula/raspberry_105_bascula_camionera/`
- Windows PC: `C:\Programas\Bascula\raspberry_105_bascula_camionera\`

Ambos funcionarán correctamente.

## 🎯 Resumen

1. ✅ **Copia TODO el directorio** (incluyendo subdirectorios linux/ o windows/)
2. ✅ **Mantén la estructura** de directorios
3. ✅ **Ejecuta scripts desde subdirectorios** (linux/ o windows/)
4. ✅ **Los scripts detectan automáticamente** las rutas correctas

