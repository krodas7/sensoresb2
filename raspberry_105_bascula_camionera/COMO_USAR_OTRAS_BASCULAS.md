# 🔄 Cómo Usar el Código con Otras Básculas

Esta guía explica qué modificar para usar el mismo código con otras básculas (transformación, especial, etc.).

## ✨ Lo Único que Necesitas Cambiar

Para usar el código con otra báscula, **solo necesitas cambiar el nombre de la báscula**. Es así de simple.

---

## 📝 Opción 1: Modificar el Código Directamente

Abre el archivo `raspberry_bascula_client.py` y busca esta línea:

```python
# === Configuración de la báscula ===
BASCULA_NOMBRE = "bascula camionera"  # ← Cambiar solo esto
```

**Ejemplos:**

### Para Báscula de Transformación:
```python
BASCULA_NOMBRE = "bascula transformacion"
```

### Para Báscula Especial:
```python
BASCULA_NOMBRE = "bascula especial"
```

### Para cualquier otra báscula:
```python
BASCULA_NOMBRE = "bascula [tu-nombre-aqui]"
```

---

## 🔧 Opción 2: Usar Variable de Entorno (Recomendado)

En lugar de modificar el código cada vez, puedes usar una variable de entorno:

### En Linux/Raspberry Pi:
```bash
export BASCULA_NOMBRE="bascula transformacion"
python raspberry_bascula_client.py
```

### En Windows (CMD):
```cmd
set BASCULA_NOMBRE=bascula transformacion
python raspberry_bascula_client.py
```

### En Windows (PowerShell):
```powershell
$env:BASCULA_NOMBRE="bascula transformacion"
python raspberry_bascula_client.py
```

---

## 📋 Resumen de Cambios Necesarios

| Báscula | Valor a Cambiar |
|---------|----------------|
| **Báscula Camionera** | `BASCULA_NOMBRE = "bascula camionera"` |
| **Báscula Transformación** | `BASCULA_NOMBRE = "bascula transformacion"` |
| **Báscula Especial** | `BASCULA_NOMBRE = "bascula especial"` |

**Eso es todo.** No necesitas cambiar nada más.

---

## ⚙️ Configuración Adicional (Opcional)

Si la báscula está conectada a un puerto serial diferente, también puedes cambiarlo:

### Modificar el código:
```python
if ES_WINDOWS:
    SERIAL_PORT = os.environ.get('SERIAL_PORT', 'COM2')  # Cambiar COM1 por COM2
else:
    SERIAL_PORT = os.environ.get('SERIAL_PORT', '/dev/ttyUSB1')  # Cambiar puerto
```

### O usar variable de entorno:
```bash
# Linux
export SERIAL_PORT="/dev/ttyUSB1"

# Windows
set SERIAL_PORT=COM2
```

---

## 🔍 Verificación

Para verificar que todo funciona correctamente, revisa los logs. Deberías ver algo como:

```
============================================================
Cliente de Báscula Camionera - API Beneficio
============================================================
Sistema Operativo: Linux  (o Windows)
Báscula: bascula transformacion  ← Debe mostrar el nombre correcto
Puerto serial: /dev/ttyUSB0 - Baudrate: 9600
Enviando datos a: http://68.183.155.4:8000/api/v1/sensors/bascula/recibir/
============================================================
```

---

## 📦 Ejemplo Completo: Múltiples Básculas

Si tienes múltiples básculas conectadas a diferentes computadoras/dispositivos:

### Dispositivo 1 (Báscula Camionera):
```python
BASCULA_NOMBRE = "bascula camionera"
SERIAL_PORT = "COM1"  # o /dev/ttyUSB0
```

### Dispositivo 2 (Báscula Transformación):
```python
BASCULA_NOMBRE = "bascula transformacion"
SERIAL_PORT = "COM2"  # o /dev/ttyUSB1
```

### Dispositivo 3 (Báscula Especial):
```python
BASCULA_NOMBRE = "bascula especial"
SERIAL_PORT = "COM3"  # o /dev/ttyUSB2
```

Cada dispositivo puede ejecutar el mismo código con diferentes configuraciones.

---

## ✅ Checklist para Nueva Báscula

- [ ] Cambiar `BASCULA_NOMBRE` en el código o usar variable de entorno
- [ ] Verificar que el puerto serial sea correcto (si es diferente)
- [ ] Verificar que el baudrate sea correcto (por defecto 9600)
- [ ] Ejecutar el código y verificar los logs
- [ ] Verificar que los datos lleguen al servidor

---

## 🎯 Puntos Importantes

1. **El nombre debe ser único** - Cada báscula debe tener un nombre diferente
2. **El backend crea básculas automáticamente** - No necesitas configurar nada en el servidor
3. **Mismo código, diferentes configuraciones** - Puedes copiar el código y solo cambiar el nombre
4. **Funciona en cualquier plataforma** - Windows, Linux, Raspberry Pi, etc.

---

## 💡 Consejo

Si tienes muchas básculas, considera crear archivos de configuración separados o usar un script que lea la configuración desde un archivo JSON/YAML. Pero para la mayoría de casos, simplemente cambiar el nombre es suficiente.

