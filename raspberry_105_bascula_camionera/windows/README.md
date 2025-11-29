# 💻 Cliente de Báscula para Windows

## 🎯 Directorio Portable

Este directorio es **completamente independiente**. Solo necesitas:
1. Copiar este directorio completo a tu PC Windows
2. Instalar dependencias
3. Ejecutar

No necesitas copiar nada más del proyecto.

---

## 📦 Instrucciones de Instalación Rápida

### ⚡ Inicio Rápido (3 pasos)

1. **Copiar este directorio completo** a tu computadora Windows
2. **Instalar dependencias:**
   ```cmd
   cd C:\ruta\donde\copiaste\windows
   pip install -r requirements.txt
   ```
3. **Ejecutar:**
   ```cmd
   ejecutar_bascula.bat
   ```

¡Listo! La aplicación se abrirá con interfaz gráfica.

---

## 📋 Requisitos

- **Windows** (7, 8, 10, 11)
- **Python 3.7 o superior** - [Descargar Python](https://www.python.org/downloads/)
  - ⚠️ **IMPORTANTE:** Durante la instalación, marca "Add Python to PATH"
- **Puerto COM** donde está conectado el reloj digital
- **Conexión a Internet** para enviar datos al servidor

---

## 🚀 Formas de Ejecutar

### Opción 1: Ejecutar Directamente (Más Fácil) ⭐

**Doble clic en:** `ejecutar_bascula.bat`

O desde CMD:
```cmd
cd C:\ruta\a\windows
ejecutar_bascula.bat
```

### Opción 2: Ejecutar con PowerShell

```powershell
cd C:\ruta\a\windows
.\ejecutar_bascula.ps1
```

### Opción 3: Ejecutar Python Directamente

```cmd
cd C:\ruta\a\windows
python raspberry_bascula_gui.py
```

### Opción 4: Instalar como Servicio de Windows

Para que se ejecute automáticamente al iniciar Windows:

```powershell
cd C:\ruta\a\windows
.\instalar_servicio_windows.ps1
```

**Requisito:** Necesitas NSSM instalado. [Descargar NSSM](https://nssm.cc/download)

---

## ⚙️ Configuración

### Configurar Báscula y Puerto Serial

La aplicación tiene **selectores en la interfaz gráfica**:

1. **Selector de Báscula:**
   - "bascula camionera"
   - "bascula transformacion"
   - "bascula especial"

2. **Selector de Puerto Serial:**
   - Lista automáticamente los puertos COM disponibles
   - Botón "🔄 Refrescar Puertos" para actualizar la lista

### Guardado Automático

La configuración se guarda automáticamente en `bascula_config.json` en el mismo directorio.

**La configuración persiste entre reinicios** - cuando vuelvas a abrir la aplicación, tendrá la última configuración guardada.

---

## 📁 Archivos Incluidos

```
windows/
├── README.md                          ← Esta guía
├── raspberry_bascula_gui.py          ← Aplicación principal (GUI)
├── requirements.txt                   ← Dependencias Python
├── ejecutar_bascula.bat              ← Script para ejecutar fácilmente
├── ejecutar_bascula.ps1              ← Script PowerShell
├── instalar_servicio_windows.ps1     ← Instalador de servicio
├── WINDOWS_SETUP.md                  ← Guía detallada (opcional)
└── bascula_config.json               ← Configuración (se crea automáticamente)
```

---

## 🎯 Uso de la Aplicación

### Interfaz Gráfica

La aplicación muestra:

1. **Configuración** (arriba):
   - Selector de báscula
   - Selector de puerto COM
   - Botón para refrescar puertos

2. **Estados de Conexión:**
   - Serial: ✓/✗ Conectado/Desconectado
   - Servidor: ✓/✗ Conectado/Desconectado

3. **Último Peso Recibido:**
   - Peso actual del reloj
   - Estado (estable/moviéndose)

4. **Último Peso Enviado:**
   - Peso enviado al servidor
   - Fecha/hora del envío
   - Estado (éxito/error)

5. **Estadísticas:**
   - Contador de envíos exitosos
   - Contador de errores

6. **Registro de Actividad:**
   - Historial de eventos en tiempo real

### Botones

- **▶ Iniciar Monitoreo** - Comienza a leer del reloj y enviar datos
- **⏸ Detener Monitoreo** - Detiene el monitoreo

---

## 🔧 Instalación de Dependencias

### Primera vez:

```cmd
cd C:\ruta\a\windows
pip install -r requirements.txt
```

### Si hay errores:

```cmd
# Actualizar pip primero
python -m pip install --upgrade pip

# Instalar dependencias
pip install -r requirements.txt
```

---

## 🔍 Verificar Puerto COM

Para ver qué puertos COM están disponibles:

**En CMD:**
```cmd
mode
```

**En PowerShell:**
```powershell
[System.IO.Ports.SerialPort]::getportnames()
```

**En Administrador de Dispositivos:**
1. Presiona `Win + X`
2. Selecciona "Administrador de dispositivos"
3. Expande "Puertos (COM y LPT)"
4. Busca tu dispositivo serial

---

## ⚙️ Configuración Manual (Opcional)

Puedes editar `ejecutar_bascula.bat` para cambiar valores por defecto:

```batch
set SERIAL_PORT=COM1
set BASCULA_NOMBRE=bascula camionera
set SERIAL_BAUDRATE=9600
```

Pero es más fácil usar los selectores en la interfaz gráfica.

---

## 📊 ¿Qué Hace la Aplicación?

1. **Lee datos del reloj digital** conectado al puerto COM
2. **Detecta cuando el peso está estable** (termina en "G")
3. **Envía el peso al servidor** cuando cambia
4. **Muestra todo en tiempo real** en la interfaz gráfica

---

## ❓ Problemas Comunes

### Error: "No module named 'serial'"

**Solución:**
```cmd
pip install pyserial requests
```

### Error: "could not open port 'COM1'"

**Soluciones:**
1. Verificar que el puerto COM existe: `mode`
2. Verificar que ningún otro programa lo está usando
3. Cerrar la aplicación y volver a abrirla
4. Probar con otro puerto COM

### La aplicación no muestra el puerto COM que necesito

**Solución:**
1. Conectar el reloj digital al puerto COM
2. Clic en "🔄 Refrescar Puertos" en la aplicación
3. O cerrar y volver a abrir la aplicación

### Error al enviar datos al servidor

**Verificar:**
1. Conexión a Internet activa
2. Que el servidor esté accesible: `ping 68.183.155.4`
3. Ver el registro de actividad en la aplicación para más detalles

---

## 📝 Notas Importantes

- **La configuración se guarda automáticamente** - No necesitas hacer nada
- **Funciona sin Internet** - Lee del reloj, pero no puede enviar datos
- **Los selectores se deshabilitan** mientras está corriendo el monitoreo
- **Para cambiar configuración** - Detén el monitoreo, cambia los selectores, reinicia

---

## 🎯 Resumen Rápido

1. ✅ Copiar directorio `windows/` a tu PC Windows
2. ✅ Ejecutar: `pip install -r requirements.txt`
3. ✅ Ejecutar: `ejecutar_bascula.bat`
4. ✅ Seleccionar báscula y puerto COM en la interfaz
5. ✅ Clic en "Iniciar Monitoreo"

**¡Eso es todo!** La configuración se guarda automáticamente para la próxima vez.

---

## 📞 Información Técnica

- **Servidor API:** http://68.183.155.4:8000
- **Endpoint:** `/api/v1/sensors/bascula/recibir/`
- **Baudrate por defecto:** 9600
- **Formato del reloj:** "3950G    " (peso estable) o "3950m    " (peso moviéndose)

---

## 🔄 Actualización

Si recibes una nueva versión:

1. **Respaldar configuración:**
   ```cmd
   copy bascula_config.json bascula_config.json.backup
   ```

2. **Reemplazar archivos** (excepto `bascula_config.json`)

3. **Instalar dependencias actualizadas:**
   ```cmd
   pip install -r requirements.txt --upgrade
   ```

La configuración guardada se mantiene intacta.

