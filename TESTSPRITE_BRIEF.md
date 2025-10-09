# 🎯 BRIEF EJECUTIVO PARA TESTSPRITE

## **PROYECTO: Sistema de Gestión de Beneficio de Café**

### **Stack:**
- Frontend: React 18 + TypeScript + Vite (Puerto 5173)
- Backend: Django 4.2 + DRF (Puerto 8000)
- DB: SQLite (dev)

### **Credenciales de Prueba:**
```
Username: admin
Password: admin123
```

---

## **OBJETIVO:**
Auditar el proyecto completo e identificar:
1. ⚡ **Problemas de rendimiento** (re-renders, memory leaks, bundle size)
2. 🐛 **Bugs y errores** (funcionalidad, validaciones, edge cases)
3. 🔒 **Vulnerabilidades de seguridad** (auth, permisos, inputs)
4. 📝 **Código mejorable** (duplicación, imports no usados, tipos)
5. 🎨 **Problemas de UX** (estados de carga, errores, feedback)

---

## **MÓDULOS PRINCIPALES A PROBAR:**

### **Críticos (Prioridad Alta):**
1. **Login/Auth** - `/` - Autenticación JWT
2. **Pesos de Envío** - `/shipping-weights` - Sistema de pesaje complejo
3. **Integración de Lotes** - `/integration` - Lógica de negocio crítica
4. **Usuarios** - `/users` - Sistema de permisos
5. **Reportes** - `/reports` - Generación de PDFs

### **Importantes (Prioridad Media):**
6. **Dashboard** - `/` - Métricas y gráficos
7. **Cupping** - `/cupping` - Evaluación de café
8. **Empleados** - `/employees` - CRUD básico
9. **Lotes** - `/lots` - Gestión de lotes
10. **Temperaturas** - `/temperatures` - Monitoreo

### **Secundarios (Prioridad Baja):**
11. **Proveedores** - `/suppliers`
12. **Asistencia** - `/attendance`
13. **Ocupación** - `/occupation`
14. **Fermentación** - `/fermentation`

---

## **FLUJOS CRÍTICOS A VALIDAR:**

### **1. Flujo de Pesaje (MÁS IMPORTANTE):**
```
1. Login → Dashboard
2. Ir a "Pesos Envío"
3. Seleccionar integración existente
4. Crear nueva partida
5. Registrar múltiples pesajes con diferentes taras
6. Verificar cálculos automáticos (peso neto, tara total)
7. Finalizar pesaje
8. Generar reporte PDF
9. Verificar guardado en historial
```

### **2. Flujo de Permisos:**
```
1. Login como admin
2. Ir a "Usuarios"
3. Crear nuevo usuario
4. Asignar rol y permisos
5. Logout
6. Login con nuevo usuario
7. Verificar acceso restringido a módulos
```

### **3. Flujo de Integración:**
```
1. Ir a "Cupping"
2. Crear evaluación comercial
3. Aprobar lote
4. Ir a "Integración de Lotes"
5. Seleccionar lotes aprobados
6. Crear integración
7. Verificar suma de quintales
```

---

## **RESTRICCIONES CRÍTICAS:**

### ❌ **NO MODIFICAR:**
- Lógica de cálculo de pesos/taras
- Sistema de permisos
- Flujos de usuario establecidos
- Estructura de base de datos
- Generación de PDFs

### ✅ **SÍ OPTIMIZAR:**
- Rendimiento (re-renders, bundle size)
- Manejo de errores
- Validaciones de formularios
- Código duplicado
- Tipos TypeScript
- Estados de carga

---

## **PROBLEMAS CONOCIDOS A VERIFICAR:**

1. **Bundle size grande** (>1MB) - Necesita code splitting
2. **Imports no utilizados** en ShippingWeights.tsx
3. **Re-renders** en formularios complejos
4. **Módulo logs** deshabilitado (no es problema, es intencional)
5. **Warnings de TypeScript** en algunos archivos

---

## **MÉTRICAS OBJETIVO:**

- ⚡ Tiempo de carga: < 3s
- 📦 Bundle principal: < 500KB
- 🚀 API response: < 200ms
- ❌ Errores de consola: 0
- ⚠️ Warnings React: 0

---

## **FORMATO DE REPORTE:**

Para cada problema:
```
[SEVERIDAD] Módulo - Descripción breve
Impacto: ...
Solución: ...
Prioridad: 1-5
```

---

## **ENTREGABLE:**

1. Lista priorizada de problemas
2. Recomendaciones de arreglos
3. Métricas de rendimiento
4. Plan de acción sugerido

**IMPORTANTE:** Mantener la funcionalidad actual intacta.
