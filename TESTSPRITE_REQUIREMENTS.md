# 📋 REQUERIMIENTOS PARA TESTSPRITE - BENEFICIO

## 🎯 **OBJETIVO PRINCIPAL**
Realizar una auditoría completa del proyecto **Beneficio** (sistema de gestión de beneficio de café) para identificar problemas, bugs, mejoras de rendimiento y optimizaciones **SIN AFECTAR LA LÓGICA ACTUAL DEL PROYECTO**.

---

## 🏗️ **ARQUITECTURA DEL PROYECTO**

### **Stack Tecnológico:**
- **Frontend**: React 18.2 + TypeScript + Vite 5.0 + Tailwind CSS
- **Backend**: Django 4.2.7 + Django REST Framework 3.14
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Estado**: Zustand 4.4.7
- **Routing**: React Router DOM 6.20.1
- **Validación**: Zod 3.22.4 + React Hook Form 7.48.2
- **Gráficos**: Recharts 2.15.4
- **PDFs**: jsPDF 3.0.3 + jsPDF-AutoTable 5.0.2
- **Notificaciones**: React Hot Toast 2.6.0
- **Iconos**: Heroicons 2.2.0 + Lucide React 0.294.0

### **Puertos:**
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000

---

## 📦 **MÓDULOS DEL SISTEMA**

### **1. Dashboard** (`/`)
- Monitoreo en tiempo real
- Métricas de sensores
- Gráficos de temperatura
- Estado de lotes activos
- Tarjeta de pesaje activo

### **2. Usuarios** (`/users`)
- CRUD completo de usuarios
- Sistema de permisos y roles
- Gestión de perfiles
- Asignación de módulos

### **3. Empleados** (`/employees`)
- CRUD de empleados
- Gestión de información personal
- Asignación de ocupaciones

### **4. Proveedores** (`/suppliers`)
- CRUD de proveedores
- Gestión de contactos
- Información de ubicación

### **5. Lotes** (`/lots`)
- Gestión de lotes de café
- Seguimiento de estado
- Información de calidad

### **6. Integración de Lotes** (`/integration`)
- Selección de lotes aprobados de cupping
- Creación dinámica de integraciones
- Cálculo automático de quintales
- Gestión de clientes y destinos

### **7. Cupping** (`/cupping`)
- Formulario de evaluación comercial
- Sistema de puntuación
- Análisis de calidad
- Historial de cuppings

### **8. Temperaturas** (`/temperatures`)
- Monitoreo de sensores
- Gráficos en tiempo real
- Alertas de temperatura
- Vista compacta/expandida

### **9. Fermentación** (`/fermentation`)
- Control de tanques
- Simulación de volumen/pH
- Gestión de lotes en fermentación
- Visualización de estado

### **10. Asistencia** (`/attendance`)
- Registro de asistencia
- Reporte por departamento
- Gestión de horarios

### **11. Ocupación** (`/occupation`)
- Gestión de ocupaciones
- Asignación de empleados
- Estructura organizacional

### **12. Pesos de Envío** (`/shipping-weights`)
- Sistema de pesaje por partidas
- Integración con lotes
- Cálculo de tara (yute/nylon)
- Generación de reportes detallados
- Historial de envíos
- Métricas de precisión

### **13. Reportes** (`/reports`)
- Generación de reportes en PDF
- Vista previa de reportes
- Búsqueda y filtros
- Estadísticas de reportes
- Tag "Nuevo" para reportes recientes

### **14. Logs** (`/logs`) - *Temporalmente deshabilitado en CI*
- Registro de actividades
- Filtros avanzados
- Exportación de datos
- Estadísticas de uso

---

## 🔍 **ÁREAS A AUDITAR**

### **1. FUNCIONALIDAD Y LÓGICA**
- ✅ Verificar que todos los módulos funcionen correctamente
- ✅ Validar flujos de usuario (crear, editar, eliminar)
- ✅ Comprobar cálculos automáticos (pesos, taras, quintales)
- ✅ Verificar persistencia de datos en localStorage
- ✅ Validar integración frontend-backend

### **2. RENDIMIENTO**
- ⚡ Identificar componentes con re-renders innecesarios
- ⚡ Detectar memory leaks
- ⚡ Optimizar llamadas a API
- ⚡ Revisar tamaño de bundles (actualmente >1MB)
- ⚡ Analizar tiempo de carga inicial

### **3. SEGURIDAD**
- 🔒 Validar autenticación JWT
- 🔒 Verificar protección de rutas
- 🔒 Revisar permisos de usuario
- 🔒 Validar sanitización de inputs
- 🔒 Comprobar CORS configuration

### **4. CÓDIGO Y ARQUITECTURA**
- 📝 Detectar código duplicado
- 📝 Identificar imports no utilizados
- 📝 Revisar tipos TypeScript
- 📝 Validar estructura de hooks
- 📝 Comprobar manejo de errores

### **5. UX/UI**
- 🎨 Verificar responsividad
- 🎨 Validar estados de carga
- 🎨 Comprobar mensajes de error
- 🎨 Revisar accesibilidad
- 🎨 Validar feedback visual

### **6. BACKEND**
- 🔧 Validar serializers
- 🔧 Revisar queries N+1
- 🔧 Comprobar índices de base de datos
- 🔧 Validar manejo de excepciones
- 🔧 Revisar configuración de CORS

---

## 🚫 **RESTRICCIONES IMPORTANTES**

### **NO MODIFICAR:**
1. ❌ Lógica de negocio existente
2. ❌ Estructura de base de datos
3. ❌ Flujos de usuario establecidos
4. ❌ Sistema de permisos
5. ❌ Cálculos de pesos y taras
6. ❌ Integración de lotes
7. ❌ Generación de reportes PDF

### **SOLO OPTIMIZAR/ARREGLAR:**
1. ✅ Rendimiento y velocidad
2. ✅ Bugs y errores
3. ✅ Memory leaks
4. ✅ Código duplicado
5. ✅ Imports no utilizados
6. ✅ Tipos TypeScript
7. ✅ Manejo de errores
8. ✅ Validaciones de formularios
9. ✅ Estados de carga
10. ✅ Mensajes de error

---

## 📊 **MÉTRICAS ESPERADAS**

### **Frontend:**
- ✅ Tiempo de carga inicial: < 3s
- ✅ Tamaño de bundle principal: < 500KB
- ✅ First Contentful Paint: < 1.5s
- ✅ Time to Interactive: < 3.5s
- ✅ Sin errores de consola
- ✅ Sin warnings de React

### **Backend:**
- ✅ Tiempo de respuesta API: < 200ms
- ✅ Sin queries N+1
- ✅ Índices en campos frecuentes
- ✅ Manejo correcto de errores
- ✅ Validación de datos

---

## 🎯 **CASOS DE USO CRÍTICOS A PROBAR**

### **1. Flujo de Pesaje Completo:**
1. Seleccionar integración
2. Crear partida
3. Registrar múltiples pesajes
4. Calcular tara automáticamente
5. Generar reporte final
6. Guardar en historial

### **2. Flujo de Cupping:**
1. Crear nueva sesión de cupping
2. Evaluar múltiples muestras
3. Calcular puntuación total
4. Aprobar/rechazar lotes
5. Integrar lotes aprobados

### **3. Flujo de Usuario:**
1. Login con credenciales
2. Navegar por módulos
3. Crear/editar registros
4. Generar reportes
5. Logout

### **4. Sistema de Permisos:**
1. Asignar rol a usuario
2. Configurar permisos de módulo
3. Validar acceso restringido
4. Verificar acciones permitidas

---

## 🔧 **CONFIGURACIÓN ACTUAL**

### **Variables de Entorno:**
```bash
# Backend
DEBUG=True
SECRET_KEY=<configurado>
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
```

### **Usuarios de Prueba:**
```
Admin:
- Username: admin
- Password: admin123

Demo:
- Username: demo
- Password: demo123
```

---

## 📝 **FORMATO DE REPORTE ESPERADO**

### **Para cada problema encontrado:**
1. **Severidad**: Crítico / Alto / Medio / Bajo
2. **Categoría**: Funcionalidad / Rendimiento / Seguridad / Código
3. **Módulo afectado**: Nombre del módulo
4. **Descripción**: Explicación clara del problema
5. **Impacto**: Cómo afecta al usuario/sistema
6. **Solución propuesta**: Cómo arreglarlo sin afectar lógica
7. **Prioridad**: 1-5 (1 = más urgente)

### **Ejemplo:**
```
Severidad: Alto
Categoría: Rendimiento
Módulo: ShippingWeights
Descripción: Re-renders innecesarios en cada cambio de input
Impacto: Lag en el formulario de pesaje
Solución: Usar useMemo/useCallback para optimizar
Prioridad: 2
```

---

## ✅ **ENTREGABLES ESPERADOS**

1. **Reporte de Auditoría Completo**
   - Lista de problemas encontrados
   - Clasificación por severidad
   - Recomendaciones priorizadas

2. **Plan de Acción**
   - Problemas a arreglar inmediatamente
   - Optimizaciones recomendadas
   - Mejoras futuras

3. **Métricas de Rendimiento**
   - Tiempos de carga
   - Tamaño de bundles
   - Uso de memoria
   - Queries de base de datos

---

## 🎯 **OBJETIVO FINAL**

Obtener un proyecto:
- ✅ **Más rápido**: Mejor rendimiento
- ✅ **Más estable**: Sin bugs críticos
- ✅ **Más limpio**: Código optimizado
- ✅ **Más seguro**: Validaciones correctas
- ✅ **Más mantenible**: Mejor estructura

**SIN CAMBIAR** la funcionalidad actual que ya está probada y funcionando.

---

## 📞 **INFORMACIÓN ADICIONAL**

- **Proyecto**: Sistema de Gestión de Beneficio de Café
- **Versión**: 1.0.0
- **Estado**: Desarrollo activo
- **CI/CD**: GitHub Actions configurado
- **Repositorio**: git@github.com:krodas7/beneficiob2.git
