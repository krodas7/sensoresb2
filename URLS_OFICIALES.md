# 🌐 URLs Oficiales del Proyecto Beneficio

**Última actualización:** 19 de Octubre, 2025

---

## ✅ PUERTO OFICIAL DEL FRONTEND: 3000

### Frontend (React + Vite)
**URL OFICIAL:** http://localhost:3000

- Esta es la URL ÚNICA y OFICIAL del frontend
- Configurada permanentemente en `frontend/vite.config.ts`
- **NO usar puerto 5173** (puerto por defecto de Vite)
- **NO usar ningún otro puerto**

### Backend (Django)
**URL OFICIAL:** http://localhost:8000

- API REST: http://localhost:8000/api/v1/
- Django Admin: http://localhost:8000/admin/
- API Docs (Swagger): http://localhost:8000/api/docs/
- Health Check: http://localhost:8000/api/v1/health/

---

## 🔑 Credenciales

**Usuario:** admin  
**Contraseña:** admin123  
**Email:** admin@beneficio.com

---

## 🚀 Comandos para Levantar el Proyecto

### Terminal 1 - Backend
```bash
cd /Users/krodas7/Desktop/beneficio/backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=beneficio.settings_local python manage.py runserver
```

### Terminal 2 - Frontend
```bash
cd /Users/krodas7/Desktop/beneficio/frontend
npm run dev
```

**El frontend SIEMPRE levantará en puerto 3000**

---

## 📝 Páginas Principales

Todas estas URLs usan el puerto 3000:

- **Login:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/
- **Empleados:** http://localhost:3000/employees
- **Asistencia:** http://localhost:3000/attendance
- **Lotes:** http://localhost:3000/lots
- **Integración de Lotes:** http://localhost:3000/lot-integration
- **Pesos de Envío (CON SISTEMA DE PESAJE):** http://localhost:3000/shipping-weights
- **Fermentación:** http://localhost:3000/fermentation
- **Temperaturas:** http://localhost:3000/temperature-monitor
- **Catación:** http://localhost:3000/cupping
- **Reportes:** http://localhost:3000/reports
- **Usuarios:** http://localhost:3000/users
- **Inventario:** http://localhost:3000/inventory
- **Proveedores:** http://localhost:3000/suppliers
- **Ocupación:** http://localhost:3000/occupation
- **Gestiones:** http://localhost:3000/gestions
- **Báscula:** http://localhost:3000/scale

---

## ⚠️ IMPORTANTE

1. **SIEMPRE** usa http://localhost:3000 para el frontend
2. **NUNCA** uses http://localhost:5173 (es el puerto por defecto de Vite, NO lo usamos)
3. Si ves contenido en otro puerto, **cierra el navegador y vuelve a abrir** http://localhost:3000
4. El backend **SIEMPRE** corre en puerto 8000
5. Asegúrate de tener el proyecto **beneficio** corriendo, NO otros proyectos Django

---

## 🔧 Verificar Servicios

```bash
# Ver qué puertos están activos
lsof -i :3000 -i :8000

# Verificar frontend
curl http://localhost:3000

# Verificar backend
curl http://localhost:8000/api/v1/health/
```

---

## 📦 Configuración Técnica

### Frontend
- **Puerto:** 3000 (configurado en `vite.config.ts`)
- **HMR Port:** 3001
- **Proxy API:** Redirige `/api` a `http://localhost:8000`

### Backend
- **Puerto:** 8000 (por defecto de Django)
- **Settings:** `beneficio.settings_local` (desarrollo local)
- **Base de datos:** SQLite (`backend/db.sqlite3`)

---

**✅ Puerto 3000 es el puerto OFICIAL y ÚNICO para el frontend**

