# 🍒 Módulo de Recepción de Cereza

## 📋 Descripción

Módulo para registrar la entrada de café cereza con **detección automática de peso mediante OCR** (Reconocimiento Óptico de Caracteres). El sistema extrae automáticamente el peso de fotos de básculas o relojes digitales.

---

## ✨ Características

### 🎯 Funcionalidades Principales

1. **Selección rápida de proveedor**
   - Lista de proveedores activos
   - Filtrado inteligente

2. **Captura de foto inteligente**
   - Tomar foto directamente con la cámara del dispositivo
   - Cargar foto existente desde archivo
   - Previsualización antes de enviar

3. **OCR Automático**
   - Extracción automática del peso de la foto
   - Pre-procesamiento de imagen para mayor precisión
   - Soporta múltiples formatos: qq, lbs, decimales
   - Confianza del OCR mostrada en %

4. **Ingreso manual como fallback**
   - Si OCR falla, permite ingresar peso manualmente
   - Corrección manual posterior si es necesario

5. **Registro completo**
   - Calidad de cereza (Excelente, Bueno, Regular, Deficiente)
   - Observaciones
   - Timestamp automático

---

## 🚀 Cómo Usar

### 1. Acceder al Módulo

1. Inicia sesión en http://localhost:5173
2. Click en **"Recepción Cereza"** en el menú lateral (ícono de cámara)

### 2. Registrar una Recepción

#### Paso 1: Seleccionar Proveedor
- En el formulario, selecciona el proveedor de la lista desplegable

#### Paso 2: Capturar Foto de la Báscula
Tienes dos opciones:

**Opción A: Tomar Foto con Cámara**
1. Click en **"Tomar Foto"**
2. Autoriza el acceso a la cámara
3. Enfoca la báscula/reloj digital
4. Click en **"Capturar"**

**Opción B: Subir Foto Existente**
1. Click en **"Seleccionar Archivo"**
2. Selecciona la foto de tu dispositivo

#### Paso 3: Completar Información
- **Calidad:** Selecciona la calidad de la cereza
- **Observaciones:** Agrega notas adicionales si es necesario

#### Paso 4: Registrar
- Click en **"Registrar Recepción"**
- El sistema procesará la foto con OCR
- Verás una notificación con el peso extraído
- La recepción aparecerá en la lista de "Recepciones Recientes"

### 3. Revisar Recepciones

En el panel derecho verás:
- **Código de recepción** (generado automáticamente)
- **Proveedor**
- **Peso en quintales (qq) y libras (lbs)**
- **Calidad y estado**
- **Indicador de OCR procesado** (✓ o ✗)
- **Confianza del OCR en %**

---

## 🔧 API Endpoints

### Listar y Crear Recepciones
```bash
# Listar todas
GET /api/v1/cherry-reception/

# Filtrar por proveedor
GET /api/v1/cherry-reception/?supplier=1

# Filtrar por estado
GET /api/v1/cherry-reception/?status=pending

# Crear nueva recepción
POST /api/v1/cherry-reception/
Content-Type: multipart/form-data

{
  "supplier": 1,
  "scale_image": <archivo>,
  "quality": "good",
  "observations": "Cereza de excelente calidad"
}
```

### Detalle de Recepción
```bash
# Obtener detalles
GET /api/v1/cherry-reception/{id}/

# Actualizar
PUT /api/v1/cherry-reception/{id}/

# Eliminar
DELETE /api/v1/cherry-reception/{id}/
```

### Procesamiento OCR
```bash
# Procesar OCR manualmente
POST /api/v1/cherry-reception/{id}/process-ocr/

# Actualizar peso manualmente
PATCH /api/v1/cherry-reception/{id}/update-weight/
{
  "weight_qq": 45.5
}
```

### Estadísticas
```bash
# Obtener estadísticas generales
GET /api/v1/cherry-reception/stats/

# Estadísticas por rango de fechas
GET /api/v1/cherry-reception/stats/?date_from=2025-01-01&date_to=2025-12-31
```

---

## 💡 Consejos para Mejores Resultados con OCR

### 📸 Al Tomar la Foto:

1. **Iluminación:**
   - Buena luz natural o artificial
   - Evitar sombras sobre los números

2. **Enfoque:**
   - Acércate lo suficiente para que los números sean grandes
   - Asegúrate de que la imagen esté nítida
   - Los números deben ocupar al menos 1/3 de la foto

3. **Ángulo:**
   - Toma la foto de frente (perpendicular)
   - Evita ángulos inclinados

4. **Contraste:**
   - Mejor si la báscula tiene números negros sobre fondo claro
   - O números claros sobre fondo oscuro

### 🎯 Formatos Reconocidos:

El OCR puede detectar:
- `45.50 qq`
- `45.50 QUINTALES`
- `4550 lbs`
- `4550 LIBRAS`
- `45.5` (asume quintales)

### ⚠️ Si OCR Falla:

El sistema marca automáticamente que requiere corrección manual:
- Verás el indicador ✗ en la lista
- Puedes usar el endpoint `/update-weight/` para corregir
- O editar directamente en el admin de Django

---

## 📊 Modelos de Datos

### CherryReception

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `reception_code` | String | Código único (auto-generado) |
| `supplier` | FK | Proveedor asociado |
| `received_by` | FK | Usuario que recibe |
| `weight_qq` | Decimal | Peso en quintales |
| `weight_lbs` | Decimal | Peso en libras (auto-calculado) |
| `quality` | String | Excelente/Bueno/Regular/Deficiente |
| `scale_image` | Image | Foto de la báscula |
| `ocr_raw_text` | Text | Texto extraído por OCR |
| `ocr_confidence` | Decimal | Confianza del OCR (0-100%) |
| `ocr_processed` | Boolean | Si se procesó con OCR |
| `manual_correction` | Boolean | Si se corrigió manualmente |
| `status` | String | pending/processing/completed/rejected |
| `observations` | Text | Notas adicionales |

---

## 🔐 Permisos

El módulo utiliza los permisos estándar del sistema:
- **Superusuario/Admin:** Acceso completo
- **Pesador:** Crear y ver recepciones
- **Operador:** Ver recepciones
- **Invitado:** Solo lectura

---

## 🧪 Ejemplo de Uso en Python

```python
from apps.cherry_reception.models import CherryReception
from apps.cherry_reception.ocr_service import ScaleOCRService

# Procesar OCR en una recepción existente
reception = CherryReception.objects.get(id=1)
result = ScaleOCRService.extract_weight_from_image(reception.scale_image.path)

print(f"Peso detectado: {result['weight']} qq")
print(f"Confianza: {result['confidence']}%")
print(f"Texto OCR: {result['raw_text']}")
```

---

## 📈 Estadísticas Disponibles

El endpoint `/stats/` proporciona:
- Total de recepciones
- Peso total en qq y lbs
- Promedio de peso por recepción
- Recepciones por proveedor (top 10)
- Recepciones por estado
- Recepciones por calidad
- Tasa de éxito del OCR

---

## 🎨 Integración con Proveedores

El módulo está completamente integrado con el módulo de Proveedores:
- ✅ Solo muestra proveedores activos
- ✅ Filtra por tipo de café (cereza)
- ✅ Actualiza estadísticas del proveedor automáticamente
- ✅ Historial de entregas por proveedor

---

## 🚀 Próximas Mejoras Sugeridas

1. **Notificaciones automáticas** cuando OCR tiene baja confianza
2. **Dashboard de recepciones** con gráficos
3. **Exportación a PDF** de comprobantes de recepción
4. **Integración con lotes** para trazabilidad completa
5. **App móvil** nativa para mejor experiencia de cámara
6. **ML/AI** para mejorar precisión del OCR con el tiempo

---

## 📝 Notas Técnicas

### Tecnologías Utilizadas:
- **Backend:** Django REST Framework
- **OCR:** Tesseract OCR 5.5 + pytesseract
- **Procesamiento de imagen:** Pillow (PIL)
- **Frontend:** React + TypeScript
- **Captura de foto:** MediaDevices Web API

### Requisitos del Sistema:
- ✅ Tesseract OCR instalado (ya configurado)
- ✅ pytesseract==0.3.10
- ✅ Pillow==10.1.0
- ✅ Navegador con soporte de MediaDevices API

---

## ✅ Todo Listo

El módulo está **100% funcional** y listo para usar. Accede a:

**http://localhost:5173/cherry-reception**

Y empieza a registrar tus recepciones de cereza con OCR automático! 🎉

---

**Desarrollado para el Sistema de Beneficio de Café** ☕

