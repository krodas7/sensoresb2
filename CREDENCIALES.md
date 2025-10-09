# 🔐 CREDENCIALES DE ACCESO - BENEFICIO

## 🌐 **URLs de Acceso**

### **Frontend (Aplicación Web)**
```
http://localhost:5173
```

### **Backend (API)**
```
http://localhost:8000
```

### **Admin de Django**
```
http://localhost:8000/admin
```

### **Documentación de API (Swagger)**
```
http://localhost:8000/api/schema/swagger-ui/
```

---

## 👤 **CREDENCIALES DE USUARIO**

### **👑 Usuario Administrador (Acceso Completo)**
```
Username: admin
Password: admin123
Email: admin@beneficio.com
```
**Permisos:**
- ✅ Acceso total al sistema
- ✅ Gestión de usuarios
- ✅ Configuración de permisos
- ✅ Acceso al panel de administración de Django
- ✅ Todos los módulos disponibles

### **👨‍💼 Usuario Demo (Acceso Limitado)**
```
Username: demo
Password: demo123
Email: demo@beneficio.com
```
**Permisos:**
- ✅ Acceso de lectura a la mayoría de módulos
- ⚠️ Sin acceso al panel de administración
- ⚠️ Permisos limitados de edición

---

## 📋 **MÓDULOS DISPONIBLES**

### **✅ Módulos Principales:**
1. **Dashboard** - `/` - Monitoreo general
2. **Usuarios** - `/users` - Gestión de usuarios
3. **Empleados** - `/employees` - Gestión de personal
4. **Proveedores** - `/suppliers` - Administración de proveedores
5. **Lotes** - `/lots` - Gestión de lotes de café
6. **Integración** - `/integration` - Integración de lotes
7. **Cupping** - `/cupping` - Análisis de café
8. **Temperaturas** - `/temperatures` - Monitoreo de sensores
9. **Fermentación** - `/fermentation` - Control de tanques
10. **Asistencia** - `/attendance` - Registro de asistencia
11. **Ocupación** - `/occupation` - Gestión de espacios
12. **Pesos Envío** - `/shipping-weights` - Sistema de pesaje
13. **Reportes** - `/reports` - Generación de reportes
14. **Logs** - `/logs` - Sistema de logs (con configuración local)

---

## 🚀 **INICIO RÁPIDO**

### **1. Acceder al Sistema:**
1. Abre tu navegador
2. Ve a: `http://localhost:5173`
3. Ingresa las credenciales del **admin**
4. ¡Listo! Ya puedes usar el sistema

### **2. Explorar Módulos:**
- Usa el menú lateral para navegar
- Cada módulo tiene su propia funcionalidad
- El Dashboard muestra un resumen general

### **3. Probar Funcionalidades:**
- **Crear usuarios**: `/users` → Botón "Nuevo Usuario"
- **Gestionar empleados**: `/employees` → CRUD completo
- **Sistema de pesaje**: `/shipping-weights` → Integración y pesaje
- **Generar reportes**: `/reports` → Crear nuevo reporte

---

## 🔧 **COMANDOS ÚTILES**

### **Detener Servicios:**
```bash
# Encontrar procesos
ps aux | grep -E "(runserver|vite)"

# Matar procesos
pkill -f runserver
pkill -f vite
```

### **Reiniciar Servicios:**
```bash
# Backend
cd backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=beneficio.settings_local python manage.py runserver

# Frontend
cd frontend
npm run dev
```

### **Usar Script Automático:**
```bash
./run_local.sh
```

---

## 🛠️ **CONFIGURACIÓN ACTUAL**

### **Backend:**
- ✅ Django corriendo en puerto 8000
- ✅ Base de datos: SQLite (db.sqlite3)
- ✅ Configuración: `settings_local.py` (con logs)
- ✅ Migraciones aplicadas
- ✅ Usuarios creados

### **Frontend:**
- ✅ Vite corriendo en puerto 5173
- ✅ Hot Module Replacement (HMR) activo
- ✅ Conectado al backend en localhost:8000
- ✅ Todas las rutas configuradas

---

## 📞 **SOPORTE**

### **Problemas Comunes:**

**❌ Error: "Cannot connect to backend"**
- Verifica que el backend esté corriendo en puerto 8000
- Revisa la configuración en `frontend/src/services/api.ts`

**❌ Error: "Invalid credentials"**
- Usa las credenciales exactas de este documento
- Verifica que no haya espacios extra

**❌ Error: "Module not found"**
- Ejecuta `npm install` en el directorio frontend
- Ejecuta `pip install -r requirements.txt` en backend

---

## 🎉 **¡PROYECTO LISTO!**

El sistema está completamente funcional y listo para usar.

**Credenciales principales:**
- **Username:** `admin`
- **Password:** `admin123`

**URL de acceso:**
- **Frontend:** http://localhost:5173

**¡Disfruta del sistema!** 🚀
