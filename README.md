# ☕ Sistema de Beneficio de Café

Un sistema integral para la gestión y control de procesos en un beneficio de café, desarrollado con Django REST Framework y React.

## 🚀 Características Principales

- **Gestión de Usuarios**: Sistema completo de roles y permisos
- **Monitoreo IoT**: Integración con sensores de temperatura y humedad
- **Control de Procesos**: Fermentación, catación, y control de calidad
- **Reportes**: Generación automática de reportes en PDF
- **Logs de Actividad**: Auditoría completa del sistema
- **Interfaz Moderna**: UI responsive con Tailwind CSS

## 📋 Requisitos

- Python 3.9+
- Node.js 18+
- PostgreSQL (producción)
- Redis (opcional, para tareas asíncronas)

## 🛠️ Instalación

### Backend

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/beneficio-cafe.git
cd beneficio-cafe/backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar base de datos
python manage.py migrate
python manage.py init_roles

# Crear superusuario
python manage.py createsuperuser

# Ejecutar servidor
python manage.py runserver
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

## 🌐 Acceso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/v1/
- **Documentación API**: http://localhost:8000/api/docs/
- **Admin Django**: http://localhost:8000/admin/

## 👥 Roles del Sistema

- **Superusuario**: Acceso completo a todos los módulos
- **Administrador**: Gestión de usuarios y reportes
- **Catador**: Módulo de catación y evaluación
- **Pesador**: Control de pesos e integraciones
- **Operador**: Módulos básicos de producción
- **Supervisor**: Supervisión de procesos
- **Invitado**: Acceso de solo lectura

## 📊 Módulos Disponibles

### Gestión
- **Usuarios**: Gestión completa con permisos
- **Empleados**: Control de personal
- **Proveedores**: Gestión de proveedores

### Producción
- **Lotes**: Control de lotes de café
- **Catación**: Evaluación de calidad
- **Fermentación**: Control de procesos
- **Pesos Envío**: Control de embarques

### Monitoreo
- **Temperaturas**: Sensores IoT en tiempo real
- **Ocupación**: Control de tanques
- **Dashboard**: Métricas y KPIs

### Reportes y Logs
- **Reportes**: Generación automática en PDF
- **Logs**: Auditoría de actividades
- **Notificaciones**: Alertas del sistema

## 🔧 Configuración

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Backend
DEBUG=True
SECRET_KEY=tu-clave-secreta
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
```

### Base de Datos

Para producción, configurar PostgreSQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'beneficio_cafe',
        'USER': 'usuario',
        'PASSWORD': 'contraseña',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

## 🧪 Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📦 Despliegue

### Docker

```bash
# Construir y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Producción

```bash
# Backend
python manage.py collectstatic
python manage.py migrate
gunicorn beneficio.wsgi:application

# Frontend
npm run build
# Servir archivos estáticos con nginx
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit cambios (`git commit -m 'feat: agregar nueva característica'`)
4. Push al branch (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Documentación**: [SYSTEM_DOCUMENTATION.md](SYSTEM_DOCUMENTATION.md)
- **API Docs**: `/api/docs/`
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/beneficio-cafe/issues)

## 🙏 Agradecimientos

- Django REST Framework
- React y TypeScript
- Tailwind CSS
- Heroicons
- Todos los contribuidores

---

**Desarrollado con ❤️ para la industria del café**