# 🔐 Credenciales de Acceso - Sistema de Beneficio

## ✅ Sistema Activo y Configurado

---

## 🌐 Acceso al Frontend

**URL**: http://localhost:5173

### Credenciales de Login

```
Usuario:    admin
Contraseña: admin123
```

**Rol**: Superusuario (acceso completo a todos los módulos)

---

## 🔧 Acceso al Backend API

**URL Base**: http://localhost:8002/api/v1/

### Para obtener Token JWT:

```bash
curl -X POST http://localhost:8002/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci...",
  "user": { ... },
  "expires_in": 1800
}
```

### Token JWT Actual (válido por 30 minutos):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYxODk4ODMxLCJpYXQiOjE3NjE4NzAwMzEsImp0aSI6IjExZjFhNjRlNzk1YjQ2MGE4MTMwMzdjZjc2Nzk1ZjQ3IiwidXNlcl9pZCI6NX0.UtDGH11oZHkWVnZDp1q7GdJswdp-Cj2Kn7x3NsE8uPw
```

### Usar el Token:

```bash
TOKEN="eyJhbGci..."

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/api/v1/sensors/
```

---

## 🔑 Django Admin

**URL**: http://localhost:8002/admin/

```
Usuario:    admin
Contraseña: admin123
```

---

## 📡 API Externa de Sensores

**URL**: http://localhost:8000/api/

### Autenticación Basic Auth:

```
Usuario:    laptop
Contraseña: beneficiob2
```

### Ejemplo de uso:

```bash
curl -u laptop:beneficiob2 \
  http://localhost:8000/api/temperatura/resumen/
```

---

## 🧪 Probar el Sistema

### 1. Login desde Frontend

1. Abrir http://localhost:5173
2. Usar credenciales: **admin / admin123**
3. Acceder al dashboard

### 2. Login desde API (curl)

```bash
curl -X POST http://localhost:8001/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. Verificar Datos en Tiempo Real

**Temperatura:**
```bash
TOKEN="<tu-token-jwt>"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/api/v1/fermentation/temperatures/real-time/
```

**Fermentación:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/api/v1/fermentation/real-time/
```

---

## 👤 Información del Usuario Admin

```json
{
  "id": 5,
  "username": "admin",
  "email": "admin@beneficio.com",
  "first_name": "Admin",
  "last_name": "User",
  "role": "invitado",
  "status": "active",
  "is_active": true,
  "is_staff": true,
  "is_superuser": true
}
```

**Permisos:**
- ✅ Acceso completo al admin de Django
- ✅ Acceso a todos los endpoints de la API
- ✅ Puede crear/editar/eliminar cualquier recurso
- ✅ Acceso a todos los módulos del frontend

---

## 🔄 Renovar Token JWT (si expira)

El token expira en 30 minutos. Para renovarlo:

```bash
curl -X POST http://localhost:8001/api/v1/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "<tu-refresh-token>"
  }'
```

---

## 🆘 Solución de Problemas

### "Credenciales inválidas"

Si las credenciales no funcionan, resetear el usuario:

```bash
cd /Users/krodas7/Desktop/sensoresb2/beneficio/backend
source venv/bin/activate
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
User = get_user_model()

user = User.objects.get(username='admin')
user.set_password('admin123')
user.is_active = True
user.save()
print("✅ Password actualizado")
exit()
```

### "Token expirado"

Obtener nuevo token haciendo login nuevamente en:
- Frontend: http://localhost:5173/login
- API: POST http://localhost:8001/api/v1/auth/login/

### Frontend no conecta con Backend

Verificar que el archivo `frontend/src/services/api.ts` tenga:
```typescript
const API_URL = 'http://localhost:8001/api/v1'  // Puerto 8001 ✅
```

---

## 📝 Notas Importantes

1. **Seguridad**: Estas credenciales son para desarrollo local. En producción usar credenciales más seguras.

2. **Token JWT**: Los tokens expiran en 30 minutos. El frontend renueva automáticamente usando el refresh token.

3. **Roles**: El usuario admin tiene rol "invitado" pero es superuser, por lo que tiene acceso completo.

4. **CORS**: El backend está configurado para aceptar peticiones desde http://localhost:5173

5. **Persistencia**: El token se guarda en localStorage del navegador.

---

## ✅ Checklist de Acceso

- [x] Frontend accesible en puerto 5173
- [x] Backend accesible en puerto 8001
- [x] API externa accesible en puerto 8000
- [x] Usuario admin creado y activo
- [x] Credenciales funcionando correctamente
- [x] Token JWT generándose correctamente
- [x] Frontend apuntando al puerto correcto (8001)
- [x] Integración completa funcional

---

**Sistema listo para usar** ✅

**Credenciales principales:**
- **Usuario**: admin
- **Contraseña**: admin123

**URL de acceso:**
- http://localhost:5173

---

**Última actualización**: 31 de Octubre, 2025  
**Estado**: OPERATIVO ✅

