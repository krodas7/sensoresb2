# 🧪 GUÍA DE PRUEBA - BENEFICIO

## 🌐 **ACCESO AL SISTEMA**

### **URLs:**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000/api/v1
- **Admin Django:** http://localhost:8000/admin

### **Credenciales:**
```
Username: admin
Password: admin123
```

---

## ✅ **ARREGLOS APLICADOS - QUÉ PROBAR**

### **1. Lazy Loading y Code Splitting** ⚡
**Qué probar:**
- Abre http://localhost:5173
- Observa la velocidad de carga inicial (debería ser ~1-2s)
- Navega entre módulos
- Observa que cada página carga rápido con un spinner

**Resultado esperado:**
- ✅ Carga inicial muy rápida
- ✅ Spinner de "Cargando..." al cambiar de página
- ✅ Sin delays largos

---

### **2. React Router v7 Flags** 🔧
**Qué probar:**
- Abre la consola del navegador (F12)
- Navega por diferentes módulos
- Revisa la consola

**Resultado esperado:**
- ✅ Sin warnings de React Router
- ✅ Sin mensajes de "Future Flag Warning"

---

### **3. Botón Editar en Fermentación** 🔧
**Qué probar:**
1. Login con admin/admin123
2. Ve a "Fermentación" en el menú
3. Click en botón "Editar" de cualquier tanque

**Resultado esperado:**
- ✅ Modal de edición se abre correctamente
- ✅ Puedes editar los valores
- ✅ Puedes guardar cambios

---

### **4. Generación de Reportes** 📄
**Qué probar:**
1. Ve a "Reportes"
2. Click en "Generar Nuevo Reporte"
3. Selecciona tipo de reporte
4. Selecciona fechas (inicio y fin)
5. Click en "Generar Reporte"

**Resultado esperado:**
- ✅ Modal NO se cierra si faltan datos
- ✅ Muestra error si fechas están vacías
- ✅ Genera reporte si todo está correcto
- ✅ Modal se cierra después de generar

---

### **5. Rutas Alias** 🛣️
**Qué probar:**
- Navega manualmente a: http://localhost:5173/temperaturas
- Navega manualmente a: http://localhost:5173/integration

**Resultado esperado:**
- ✅ `/temperaturas` muestra página de Temperaturas
- ✅ `/integration` muestra página de Integración
- ✅ Sin errores 404

---

### **6. Backend APIs** 🔌
**Qué probar:**
Ejecuta el script de tests:
```bash
./test_backend_manual.sh
```

**Resultado esperado:**
- ✅ 12/12 tests pasan (100%)
- ✅ Todos los endpoints responden
- ✅ Autenticación funciona

---

## 🎯 **FLUJOS CRÍTICOS A PROBAR**

### **Flujo 1: Login → Dashboard**
1. Abre http://localhost:5173
2. Login con admin/admin123
3. Observa el dashboard

**Resultado esperado:**
- ✅ Login rápido
- ✅ Redirección automática
- ✅ Dashboard carga en <2s
- ✅ Métricas visibles

---

### **Flujo 2: Sistema de Pesaje**
1. Ve a "Pesos Envío"
2. Click en "Seleccionar Integración"
3. Selecciona una integración
4. Click en "Comenzar Pesaje"
5. Crea una partida
6. Registra un pesaje

**Resultado esperado:**
- ✅ Todo funciona sin errores
- ✅ Cálculos de tara correctos
- ✅ Peso neto calculado automáticamente

---

### **Flujo 3: Gestión de Usuarios**
1. Ve a "Usuarios"
2. Click en "Nuevo Usuario"
3. Llena el formulario
4. Guarda el usuario
5. Edita el usuario
6. Elimina el usuario

**Resultado esperado:**
- ✅ CRUD completo funciona
- ✅ Sin errores en consola
- ✅ Feedback visual correcto

---

### **Flujo 4: Cupping**
1. Ve a "Cupping"
2. Crea nueva sesión
3. Evalúa una muestra
4. Aprueba el lote

**Resultado esperado:**
- ✅ Formulario funciona
- ✅ Puntuación se calcula
- ✅ Lote se aprueba

---

### **Flujo 5: Integración de Lotes**
1. Ve a "Integración de Lotes"
2. Selecciona lotes aprobados
3. Crea integración
4. Verifica suma de quintales

**Resultado esperado:**
- ✅ Lotes se seleccionan
- ✅ Suma automática funciona
- ✅ Integración se guarda

---

## 📊 **MÉTRICAS A VERIFICAR**

### **Rendimiento:**
- ⚡ Carga inicial: < 2s
- ⚡ Navegación entre páginas: < 500ms
- ⚡ Sin lag en formularios
- ⚡ Gráficos se renderizan rápido

### **Consola del Navegador:**
- ✅ Sin errores rojos
- ✅ Sin warnings de React Router
- ✅ Sin warnings de React
- ⚠️ Algunos warnings de ERR_EMPTY_RESPONSE pueden aparecer (normal en dev)

### **Funcionalidad:**
- ✅ Todos los botones funcionan
- ✅ Todos los modales abren/cierran
- ✅ Todos los formularios validan
- ✅ Todas las rutas funcionan

---

## 🔍 **CÓMO VERIFICAR LOS ARREGLOS**

### **1. Verificar Bundle Size:**
```bash
cd frontend
npm run build
# Busca el tamaño del bundle principal
# Debería ser ~205KB
```

### **2. Verificar Lazy Loading:**
- Abre DevTools (F12)
- Ve a Network tab
- Navega entre páginas
- Observa que cada página carga su propio chunk

### **3. Verificar Backend:**
```bash
./test_backend_manual.sh
# Debería mostrar 12/12 ✓
```

### **4. Verificar Frontend:**
- Abre http://localhost:5173
- Abre consola (F12)
- Navega por todos los módulos
- Verifica que no haya errores

---

## 🎯 **CHECKLIST DE PRUEBA**

### **Funcionalidades Core:**
- [ ] Login/Logout funciona
- [ ] Dashboard carga rápido
- [ ] Usuarios CRUD funciona
- [ ] Empleados CRUD funciona
- [ ] Lotes se gestionan correctamente
- [ ] Cupping funciona
- [ ] Integración de lotes funciona
- [ ] Sistema de pesaje funciona
- [ ] Reportes se generan
- [ ] Fermentación: botón Editar funciona ✨ (NUEVO)

### **Rendimiento:**
- [ ] Carga inicial < 2s ✨ (MEJORADO)
- [ ] Sin lag en navegación
- [ ] Formularios responden rápido
- [ ] Sin errores en consola

### **Backend:**
- [ ] Health check funciona
- [ ] Login API funciona
- [ ] Todos los endpoints responden
- [ ] Autenticación JWT funciona

---

## 🚨 **SI ENCUENTRAS PROBLEMAS**

### **Problema: Página no carga**
```bash
# Reiniciar servicios
pkill -f vite
pkill -f runserver
./run_local.sh
```

### **Problema: Errores en consola**
```bash
# Limpiar cache
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### **Problema: Backend no responde**
```bash
# Verificar backend
curl http://localhost:8000/api/v1/health/
```

---

## ✅ **RESUMEN**

**Todo está listo para probar:**
- 🟢 Frontend: http://localhost:5173
- 🟢 Backend: http://localhost:8000
- 🟢 Credenciales: admin/admin123
- 🟢 Arreglos aplicados: 7/8 (87%)
- 🟢 Backend tests: 12/12 (100%)

**¡Prueba el sistema y verifica las mejoras!** 🎉
