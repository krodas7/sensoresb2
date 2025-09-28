# Sistema de Logs - Beneficio de Café

## 📋 Descripción General

El Sistema de Logs es un módulo independiente que registra y monitorea todas las actividades de los usuarios en el sistema de Beneficio de Café. Proporciona un historial completo de movimientos, registros, ediciones y cualquier acción realizada por los usuarios.

## 🏗️ Arquitectura

### Backend (Django)
- **Modelos**: `UserActivityLog`, `LogFilter`, `LogExport`
- **Serializers**: Para API REST y validación de datos
- **Views**: Endpoints para CRUD, estadísticas y exportación
- **Utils**: Funciones utilitarias para crear logs automáticamente

### Frontend (React)
- **Hook**: `useLogs` para manejo de estado y API calls
- **Componente**: `Logs.tsx` para la interfaz de usuario
- **Tracker**: `logTracker.ts` para tracking automático en módulos

## 📊 Características Principales

### 1. **Registro Automático de Actividades**
- ✅ Operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
- ✅ Autenticación (Login/Logout)
- ✅ Operaciones de archivos (Subir, Descargar, Exportar)
- ✅ Generación de reportes
- ✅ Búsquedas y filtros
- ✅ Navegación entre módulos
- ✅ Errores del sistema
- ✅ Eventos del sistema

### 2. **Categorización de Logs**
- 🔐 **Autenticación**: Login, logout, intentos fallidos
- 👥 **Gestión de Usuarios**: Creación, modificación de usuarios
- ⏰ **Asistencias**: Registro de asistencias
- ☕ **Cataciones**: Operaciones de catación comercial
- 📦 **Pesos de Envío**: Operaciones de pesaje
- 🔗 **Integraciones**: Operaciones de integración de lotes
- 📊 **Reportes**: Generación y descarga de reportes
- 🌡️ **Temperaturas**: Monitoreo de sensores
- 🏢 **Ocupación**: Gestión de ocupación de áreas
- 📋 **Lotes**: Gestión de lotes
- 🔄 **Fermentación**: Control de fermentación
- 👷 **Empleados**: Gestión de empleados
- 📍 **Áreas**: Gestión de áreas
- 📡 **Sensores**: Operaciones de sensores
- ⚙️ **Sistema**: Eventos generales del sistema

### 3. **Niveles de Log**
- 🔵 **INFO**: Información general
- 🟡 **WARNING**: Advertencias
- 🔴 **ERROR**: Errores del sistema
- 🟢 **SUCCESS**: Operaciones exitosas
- ⚫ **DEBUG**: Información de depuración

### 4. **Filtrado y Búsqueda Avanzada**
- 🔍 Búsqueda por texto libre
- 🎯 Filtros por nivel, categoría, acción, módulo
- 👤 Filtros por usuario
- 📅 Filtros por rango de fechas
- 💾 Filtros guardados personalizados
- 📊 Estadísticas en tiempo real

### 5. **Exportación y Reportes**
- 📄 Exportación a CSV
- 📊 Estadísticas del sistema
- 📈 Métricas de salud del sistema
- 📋 Reportes de actividad por usuario

## 🚀 Uso del Sistema

### Acceso al Módulo
1. Navegar a **Logs** en el menú lateral
2. El sistema mostrará el historial de actividades
3. Usar filtros para encontrar eventos específicos

### Crear un Log Manual
```typescript
import logTracker from '../utils/logTracker'

// Ejemplo: Crear log personalizado
await logTracker.track({
  level: 'info',
  category: 'system',
  action: 'create',
  message: 'Operación personalizada realizada',
  description: 'Descripción detallada de la operación',
  module: 'MiModulo',
  object_type: 'MiObjeto',
  object_id: '123',
  metadata: { additionalData: 'valor' }
})
```

### Tracking Automático en Módulos
```typescript
import logTracker from '../utils/logTracker'

// Ejemplo: Tracking en operaciones CRUD
const handleCreateItem = async (itemData) => {
  try {
    // Crear el item
    const newItem = await createItem(itemData)
    
    // Track automáticamente
    await logTracker.trackCRUD('create', 'Item', newItem.id, 'MiModulo', 
      `Nuevo item creado: ${newItem.name}`)
    
    toast.success('Item creado exitosamente')
  } catch (error) {
    // Track error
    await logTracker.trackError(error, 'MiModulo', 'Error al crear item')
    toast.error('Error al crear item')
  }
}
```

## 📁 Estructura de Archivos

```
backend/
├── apps/logs/
│   ├── models.py          # Modelos de base de datos
│   ├── serializers.py     # Serializers para API
│   ├── views.py           # Views y endpoints
│   ├── urls.py            # Configuración de URLs
│   ├── admin.py           # Configuración de admin
│   └── utils.py           # Funciones utilitarias

frontend/src/
├── hooks/
│   └── useLogs.ts         # Hook para manejo de logs
├── pages/
│   └── Logs.tsx           # Componente principal
└── utils/
    └── logTracker.ts      # Utilidades de tracking
```

## 🔧 Configuración

### Backend
1. La app `logs` ya está agregada a `INSTALLED_APPS`
2. Las migraciones ya están aplicadas
3. Las URLs ya están configuradas en `/api/v1/logs/`

### Frontend
1. El módulo ya está agregado al menú lateral
2. La ruta ya está configurada en `App.tsx`
3. El hook `useLogs` está disponible para uso

## 📊 API Endpoints

### Logs
- `GET /api/v1/logs/` - Listar logs con filtros
- `POST /api/v1/logs/create/` - Crear nuevo log
- `GET /api/v1/logs/stats/` - Estadísticas de logs
- `GET /api/v1/logs/filter-options/` - Opciones de filtros

### Filtros
- `GET /api/v1/logs/filters/` - Listar filtros guardados
- `POST /api/v1/logs/filters/` - Crear filtro
- `GET /api/v1/logs/filters/{id}/` - Obtener filtro
- `PUT /api/v1/logs/filters/{id}/` - Actualizar filtro
- `DELETE /api/v1/logs/filters/{id}/` - Eliminar filtro

### Exportación
- `GET /api/v1/logs/exports/` - Listar exportaciones
- `POST /api/v1/logs/export/` - Exportar logs

## 🎯 Ejemplos de Uso

### 1. Tracking de Autenticación
```typescript
// En el componente de Login
const handleLogin = async (credentials) => {
  try {
    const user = await login(credentials)
    await logTracker.trackAuth('login', true, user.username, 'Login exitoso')
  } catch (error) {
    await logTracker.trackAuth('login', false, credentials.username, 'Credenciales inválidas')
  }
}
```

### 2. Tracking de Operaciones de Archivos
```typescript
// En componente de Reportes
const handleDownloadReport = async (reportId) => {
  try {
    const file = await downloadReport(reportId)
    await logTracker.trackFileOperation('download', file.name, 'Reports', true)
  } catch (error) {
    await logTracker.trackFileOperation('download', `report-${reportId}`, 'Reports', false, error.message)
  }
}
```

### 3. Tracking de Búsquedas
```typescript
// En cualquier módulo con búsqueda
const handleSearch = async (query, filters) => {
  const results = await searchItems(query, filters)
  await logTracker.trackSearch(query, 'MiModulo', results.length, filters)
}
```

## 🔍 Monitoreo y Mantenimiento

### Estadísticas Disponibles
- Total de logs registrados
- Logs por nivel (INFO, WARNING, ERROR, SUCCESS, DEBUG)
- Logs por categoría
- Logs por usuario
- Logs por módulo
- Estado de salud del sistema (24h, 7d, 30d)

### Limpieza de Logs
- Los logs se almacenan indefinidamente
- Considerar implementar limpieza automática para logs antiguos
- Los logs de ERROR y WARNING deben mantenerse por más tiempo

### Performance
- Los logs se crean de forma asíncrona para no afectar la UX
- Los errores de logging no interrumpen el flujo normal
- Paginación implementada para listados grandes

## 🚨 Consideraciones de Seguridad

- Los logs contienen información sensible (IPs, user agents)
- Solo usuarios autenticados pueden ver logs
- Considerar implementar roles específicos para acceso a logs
- Los logs de autenticación son especialmente sensibles

## 📈 Métricas y KPIs

El sistema proporciona métricas útiles para:
- **Monitoreo de Salud**: Errores y advertencias en tiempo real
- **Actividad de Usuarios**: Patrones de uso del sistema
- **Performance**: Tiempos de operaciones y errores
- **Auditoría**: Trazabilidad completa de acciones
- **Seguridad**: Detección de actividades sospechosas

## 🔮 Futuras Mejoras

- [ ] Alertas automáticas para errores críticos
- [ ] Dashboard de métricas en tiempo real
- [ ] Integración con sistemas de monitoreo externos
- [ ] Logs estructurados (JSON) para mejor análisis
- [ ] Machine Learning para detección de anomalías
- [ ] Retención automática de logs con políticas
- [ ] Logs de performance y métricas de tiempo

---

**¡El Sistema de Logs está completamente implementado y listo para usar!** 🎉

Cualquier actividad en el sistema será registrada automáticamente, proporcionando una auditoría completa y herramientas de monitoreo para el sistema de Beneficio de Café.
