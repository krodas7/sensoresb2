# 📋 Sistema de Beneficio de Café - Documentación Completa

## 🏗️ Arquitectura del Sistema

### Backend (Django REST Framework)
- **Framework**: Django 4.2.7 + Django REST Framework
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Autenticación**: JWT (JSON Web Tokens)
- **Documentación API**: Swagger/OpenAPI 3.0
- **Tareas Asíncronas**: Celery + Redis

### Frontend (React + TypeScript)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Estado**: Zustand
- **UI**: Tailwind CSS + Heroicons
- **HTTP Client**: Axios
- **Notificaciones**: react-hot-toast

## 📁 Estructura del Proyecto

```
beneficio/
├── backend/                    # API Django
│   ├── apps/                   # Módulos de la aplicación
│   │   ├── core/              # Autenticación, usuarios, permisos
│   │   ├── areas/             # Gestión de áreas
│   │   ├── sensors/           # Sensores IoT
│   │   ├── temperatures/      # Monitoreo de temperaturas
│   │   ├── occupation/        # Ocupación de tanques
│   │   ├── lots/              # Gestión de lotes
│   │   ├── fermentation/      # Control de fermentación
│   │   ├── cupping/           # Catación de café
│   │   ├── employees/         # Gestión de empleados
│   │   ├── attendance/        # Control de asistencia
│   │   ├── reports/           # Generación de reportes
│   │   └── logs/              # Sistema de logs
│   ├── beneficio/             # Configuración del proyecto
│   └── requirements.txt       # Dependencias Python
├── frontend/                  # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── pages/             # Páginas principales
│   │   ├── hooks/             # Hooks personalizados
│   │   ├── services/          # Servicios API
│   │   ├── stores/            # Estado global (Zustand)
│   │   └── utils/             # Utilidades
│   └── package.json           # Dependencias Node.js
└── docker-compose.yml         # Orquestación de contenedores
```

## 🔌 API Endpoints

### Autenticación (`/api/v1/auth/`)
- `POST /login/` - Inicio de sesión
- `POST /logout/` - Cerrar sesión
- `POST /refresh/` - Renovar token
- `GET /me/` - Información del usuario actual

### Usuarios y Permisos (`/api/v1/`)
- `GET /users/` - Lista de usuarios
- `POST /users/` - Crear usuario
- `GET /users/{id}/` - Detalle de usuario
- `PUT /users/{id}/` - Actualizar usuario
- `DELETE /users/{id}/` - Eliminar usuario
- `GET /users/{id}/permissions/` - Permisos del usuario
- `GET /users/{id}/check-permission/` - Verificar permiso específico

### Roles y Permisos
- `GET /roles/` - Lista de roles
- `POST /roles/` - Crear rol
- `GET /permissions/` - Lista de permisos
- `POST /permissions/` - Crear permiso
- `GET /profiles/` - Perfiles de usuario
- `POST /initialize-roles/` - Inicializar roles por defecto

### Sensores (`/api/v1/sensors/`)
- `GET /` - Lista de sensores
- `POST /` - Crear sensor
- `POST /receive/` - Recibir datos de sensor
- `GET /status/` - Estado de sensores
- `GET /latest/` - Últimos datos

### Temperaturas (`/api/v1/temperatures/`)
- `GET /readings/` - Lecturas de temperatura
- `POST /readings/` - Crear lectura
- `GET /sensors/` - Sensores de temperatura

### Lotes (`/api/v1/lots/`)
- `GET /` - Lista de lotes
- `POST /` - Crear lote
- `GET /{id}/` - Detalle de lote
- `PUT /{id}/` - Actualizar lote
- `DELETE /{id}/` - Eliminar lote

### Catación (`/api/v1/cupping/`)
- `GET /` - Listas de catación
- `POST /` - Crear catación
- `GET /{id}/` - Detalle de catación
- `PUT /{id}/` - Actualizar catación

### Empleados (`/api/v1/employees/`)
- `GET /` - Lista de empleados
- `POST /` - Crear empleado
- `GET /{id}/` - Detalle de empleado
- `PUT /{id}/` - Actualizar empleado
- `DELETE /{id}/` - Eliminar empleado

### Reportes (`/api/v1/reports/`)
- `GET /` - Lista de reportes
- `POST /` - Crear reporte
- `POST /generate/` - Generar reporte
- `GET /stats/` - Estadísticas de reportes
- `GET /{id}/download/` - Descargar reporte
- `GET /{id}/data/` - Datos del reporte

### Logs (`/api/v1/logs/`)
- `GET /` - Lista de logs
- `POST /create/` - Crear log
- `GET /stats/` - Estadísticas de logs
- `GET /filter-options/` - Opciones de filtro

## 🔐 Sistema de Permisos

### Roles del Sistema
1. **Superusuario** - Acceso completo a todos los módulos
2. **Administrador** - Gestión de usuarios, reportes y configuración
3. **Catador** - Módulo de catación y evaluación de calidad
4. **Pesador** - Módulos de pesos, integraciones y envíos
5. **Operador** - Módulos básicos de producción y operación
6. **Supervisor** - Supervisión de procesos y acceso a reportes
7. **Invitado** - Acceso de solo lectura a módulos básicos

### Tipos de Permisos
- **view** - Ver/consultar información
- **create** - Crear nuevos registros
- **edit** - Modificar registros existentes
- **delete** - Eliminar registros
- **export** - Exportar datos
- **admin** - Administrar módulo

### Módulos del Sistema
- dashboard, usuarios, empleados, proveedores
- catacion, integracion_lotes, pesos_envio
- temperaturas, fermentacion, ocupacion
- reportes, logs, configuracion

## 🎨 Componentes Frontend

### Páginas Principales
- `Dashboard.tsx` - Panel principal con métricas
- `Login.tsx` - Página de autenticación
- `Users.tsx` - Gestión de usuarios con permisos
- `Employees.tsx` - Gestión de empleados
- `Suppliers.tsx` - Gestión de proveedores
- `Cupping.tsx` - Módulo de catación
- `LotIntegration.tsx` - Integración de lotes
- `ShippingWeights.tsx` - Pesos de envío
- `TemperatureMonitor.tsx` - Monitoreo de temperaturas
- `Fermentation.tsx` - Control de fermentación
- `Reports.tsx` - Generación de reportes
- `Logs.tsx` - Sistema de logs

### Componentes Reutilizables
- `Layout.tsx` - Layout principal con sidebar
- `PermissionManager.tsx` - Gestión de permisos
- `PermissionGuard.tsx` - Protección de rutas
- `ProtectedRoute.tsx` - Rutas protegidas

### Hooks Personalizados
- `usePermissions.ts` - Verificación de permisos
- `usePermissionsEnhanced.ts` - Permisos con backend
- `useAuthStore.ts` - Estado de autenticación
- `useReports.ts` - Gestión de reportes
- `useLogs.ts` - Sistema de logs

## 🗄️ Modelos de Base de Datos

### Core (Autenticación y Permisos)
- `User` - Usuarios del sistema
- `UserRole` - Roles del sistema
- `ModulePermission` - Permisos por módulo
- `UserProfile` - Perfiles extendidos
- `Parameter` - Parámetros del sistema
- `Event` - Eventos de auditoría
- `Alert` - Alertas del sistema

### Sensores y Monitoreo
- `Sensor` - Sensores IoT
- `TemperatureReading` - Lecturas de temperatura
- `Area` - Áreas del beneficio
- `Occupation` - Ocupación de tanques

### Producción
- `Lot` - Lotes de café
- `Fermentation` - Procesos de fermentación
- `Cupping` - Evaluaciones de catación
- `CuppingSample` - Muestras de catación

### Gestión
- `Employee` - Empleados
- `Attendance` - Asistencia
- `Report` - Reportes generados
- `UserActivityLog` - Logs de actividad

## 🔧 Configuración y Despliegue

### Variables de Entorno
```bash
# Backend
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
```

### Comandos de Desarrollo
```bash
# Backend
cd backend
source venv/bin/activate
python manage.py runserver
python manage.py migrate
python manage.py init_roles

# Frontend
cd frontend
npm install
npm run dev
```

### Comandos de Producción
```bash
# Backend
python manage.py collectstatic
python manage.py migrate
gunicorn beneficio.wsgi:application

# Frontend
npm run build
```

## 📊 Características Principales

### ✅ Implementado
- ✅ Sistema de autenticación JWT
- ✅ Gestión completa de usuarios y permisos
- ✅ CRUD para todos los módulos principales
- ✅ Sistema de reportes con PDF
- ✅ Logs de actividad del sistema
- ✅ Monitoreo de sensores IoT
- ✅ Interfaz responsive y moderna
- ✅ Sistema de notificaciones
- ✅ Protección de rutas basada en permisos

### 🚀 Próximas Características
- 🔄 Integración completa con sensores reales
- 📱 Aplicación móvil
- 📈 Dashboard con gráficos en tiempo real
- 🔔 Notificaciones push
- 🌐 API pública para integraciones

## 🐛 Solución de Problemas

### Errores Comunes
1. **Error 401 Unauthorized**: Verificar token JWT
2. **Error 404 Not Found**: Verificar URL del endpoint
3. **Error 500 Internal Server Error**: Revisar logs del backend
4. **CORS Error**: Verificar configuración CORS en Django

### Logs y Debugging
- Backend: `backend/logs/django.log`
- Frontend: Consola del navegador
- API Docs: `http://localhost:8000/api/docs/`

## 📝 Notas de Desarrollo

### Convenciones de Código
- **Backend**: PEP 8, Docstrings
- **Frontend**: ESLint, Prettier, TypeScript strict
- **Commits**: Conventional Commits
- **Branches**: Git Flow

### Testing
- Backend: Django TestCase
- Frontend: Jest + React Testing Library
- E2E: Cypress (pendiente)

## 🤝 Contribución

1. Fork el repositorio
2. Crear branch para feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'feat: agregar nueva característica'`)
4. Push al branch (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📞 Soporte

- **Documentación**: Este archivo
- **API Docs**: `/api/docs/`
- **Issues**: GitHub Issues
- **Contacto**: [Tu email]

---

**Versión**: 1.0.0  
**Última actualización**: Septiembre 2025  
**Estado**: En desarrollo activo
