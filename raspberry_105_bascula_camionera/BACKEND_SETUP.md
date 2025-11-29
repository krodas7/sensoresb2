# 🔧 Instrucciones para Configurar el Backend - Básculas

## ⚠️ IMPORTANTE: Configuración del Backend

Antes de usar el cliente de báscula, necesitas modificar el backend Django para que pueda recibir y almacenar los datos de las básculas. 

**✨ Enfoque Simplificado:** El sistema está diseñado para que el cliente solo envíe el **nombre de la báscula** y el **peso**. El servidor se encarga del resto automáticamente. No se requiere información del dispositivo (IP, nombre de computadora, etc.).

Sigue estas instrucciones cuidadosamente.

---

## 🔧 Paso 1: Agregar Modelos en `backend/apps/sensors/models.py`

Agrega los siguientes modelos al final del archivo `backend/apps/sensors/models.py`, después de la clase `MedicionTemperatura`:

```python
class Bascula(models.Model):
    """Modelo para representar una báscula"""
    raspberry = models.ForeignKey(RaspberryPi, on_delete=models.CASCADE, related_name='basculas')
    nombre = models.CharField(max_length=100)  # Ej: "bascula camionera", "bascula transformacion", "bascula especial"
    ubicacion = models.CharField(max_length=200, blank=True, null=True)
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Báscula"
        verbose_name_plural = "Básculas"
        ordering = ['raspberry', 'nombre']
        unique_together = ['raspberry', 'nombre']
    
    def __str__(self):
        return f"{self.raspberry.nombre} - {self.nombre}"


class MedicionBascula(models.Model):
    """Modelo para almacenar las mediciones de peso de las básculas"""
    bascula = models.ForeignKey(Bascula, on_delete=models.CASCADE, related_name='mediciones')
    peso_quintales = models.FloatField()  # Peso en quintales
    timestamp = models.DateTimeField(auto_now_add=True)
    raspberry_ip = models.GenericIPAddressField(blank=True, null=True)  # Opcional - no se requiere
    
    class Meta:
        verbose_name = "Medición de Báscula"
        verbose_name_plural = "Mediciones de Báscula"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['bascula', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.bascula} - {self.peso_quintales} quintales ({self.timestamp})"
```

---

## 📝 Paso 2: Actualizar Imports en `backend/apps/sensors/serializers.py`

En la parte superior del archivo, agrega los nuevos modelos a los imports:

```python
from .models import (
    Sensor, RaspberryPi, Recipiente, Medicion, 
    SensorTemperatura, MedicionTemperatura,
    Bascula, MedicionBascula  # Agregar estas líneas
)
```

Agrega los siguientes serializers al final del archivo `backend/apps/sensors/serializers.py`:

```python
class BasculaSerializer(serializers.ModelSerializer):
    """Serializer para Básculas"""
    raspberry_nombre = serializers.CharField(source='raspberry.nombre', read_only=True)
    raspberry_ip = serializers.CharField(source='raspberry.ip_address', read_only=True)
    
    class Meta:
        model = Bascula
        fields = [
            'id', 'raspberry', 'raspberry_nombre', 'raspberry_ip', 'nombre',
            'ubicacion', 'activa', 'fecha_creacion'
        ]
        read_only_fields = ['fecha_creacion']


class MedicionBasculaSerializer(serializers.ModelSerializer):
    """Serializer para Mediciones de Báscula"""
    bascula_nombre = serializers.CharField(source='bascula.nombre', read_only=True)
    raspberry_nombre = serializers.CharField(source='bascula.raspberry.nombre', read_only=True)
    
    class Meta:
        model = MedicionBascula
        fields = [
            'id', 'bascula', 'bascula_nombre', 'raspberry_nombre',
            'peso_quintales', 'timestamp', 'raspberry_ip'
        ]
        read_only_fields = ['timestamp']


class BasculaCreateSerializer(serializers.Serializer):
    """Serializer para recibir datos de báscula"""
    bascula_nombre = serializers.CharField()  # Único campo requerido: nombre de la báscula
    peso_quintales = serializers.FloatField()  # Peso en quintales
    tipo = serializers.CharField(default='bascula', required=False)
    
    def validate_peso_quintales(self, value):
        """Valida que el peso sea positivo"""
        if value < 0:
            raise serializers.ValidationError("El peso debe ser un valor positivo")
        return value
```

---

## 🎯 Paso 3: Agregar Views en `backend/apps/sensors/views.py`

Agrega los siguientes imports al inicio del archivo si no están:

```python
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
```

Agrega los siguientes modelos a los imports existentes:

```python
from .models import (
    Sensor, RaspberryPi, Recipiente, Medicion,
    SensorTemperatura, MedicionTemperatura,
    Bascula, MedicionBascula  # Agregar estas líneas
)
```

Agrega los siguientes serializers a los imports existentes:

```python
from .serializers import (
    # ... serializers existentes ...
    BasculaSerializer, MedicionBasculaSerializer, BasculaCreateSerializer  # Agregar estas líneas
)
```

Agrega las siguientes vistas al final del archivo `backend/apps/sensors/views.py`, antes del final:

```python
# === Vistas para Básculas ===

class BasculaListCreateView(generics.ListCreateAPIView):
    """Lista y crea Básculas"""
    queryset = Bascula.objects.all()
    serializer_class = BasculaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['raspberry', 'activa']
    search_fields = ['nombre', 'ubicacion']
    ordering = ['raspberry', 'nombre']


class BasculaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualiza y elimina una Báscula"""
    queryset = Bascula.objects.all()
    serializer_class = BasculaSerializer
    permission_classes = [IsAuthenticated]


class MedicionBasculaListView(generics.ListAPIView):
    """Lista las mediciones de básculas"""
    queryset = MedicionBascula.objects.all()
    serializer_class = MedicionBasculaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['bascula']
    search_fields = ['bascula__nombre']
    ordering = ['-timestamp']


@api_view(['POST'])
@permission_classes([AllowAny])
def recibir_mediciones_bascula(request):
    """
    Endpoint para recibir mediciones de báscula.
    Formato esperado (simplificado - solo se requiere el nombre de la báscula):
    {
        "bascula_nombre": "bascula camionera",
        "peso_quintales": 39.50,
        "tipo": "bascula"  # Opcional
    }
    
    Nota: No se requiere información del dispositivo (raspberry, IP, etc.)
    El servidor solo necesita el nombre de la báscula y el peso.
    """
    try:
        print(f"DEBUG: Recibiendo datos de báscula: {request.data}")
        serializer = BasculaCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"DEBUG: Serializer inválido: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        bascula_nombre = serializer.validated_data['bascula_nombre']
        peso_quintales = serializer.validated_data['peso_quintales']
        
        # Crear o buscar una Raspberry Pi genérica para todas las básculas
        # Esto permite mantener la estructura de datos existente sin requerir IP específica
        raspberry, created = RaspberryPi.objects.get_or_create(
            ip_address='0.0.0.0',  # IP genérica para básculas
            defaults={
                'nombre': 'Sistema-Basculas',
                'ubicacion': 'Sistema de básculas',
                'activa': True
            }
        )
        
        # Actualizar última conexión
        raspberry.ultima_conexion = timezone.now()
        raspberry.save()
    
        # Buscar o crear la báscula por nombre (único identificador necesario)
        bascula, created = Bascula.objects.get_or_create(
            raspberry=raspberry,
            nombre=bascula_nombre,
            defaults={
                'ubicacion': f'Ubicación de {bascula_nombre}',
                'activa': True
            }
        )
        
        # Crear medición de báscula
        medicion = MedicionBascula.objects.create(
            bascula=bascula,
            peso_quintales=peso_quintales,
            raspberry_ip=None  # No se requiere IP específica
        )
        
        response_data = {
            'bascula_nombre': bascula_nombre,
            'peso_quintales': peso_quintales,
            'medicion_creada': MedicionBasculaSerializer(medicion).data,
            'timestamp': timezone.now()
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"DEBUG: Error general: {e}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def resumen_basculas(request):
    """Obtiene un resumen de las últimas mediciones por báscula"""
    resumen = []
    for bascula in Bascula.objects.filter(activa=True):
        ultima_medicion = MedicionBascula.objects.filter(
            bascula=bascula
        ).order_by('-timestamp').first()
        
        total_mediciones = MedicionBascula.objects.filter(bascula=bascula).count()
        
        resumen.append({
            'bascula': bascula.nombre,
            'raspberry': bascula.raspberry.nombre,
            'ultima_medicion': ultima_medicion.timestamp if ultima_medicion else None,
            'peso_actual': ultima_medicion.peso_quintales if ultima_medicion else None,
            'total_mediciones': total_mediciones
        })
    
    return Response(resumen, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def estadisticas_basculas(request):
    """Obtiene estadísticas de las mediciones de básculas"""
    from django.db.models import Avg, Max, Min, Count
    
    estadisticas = []
    for bascula in Bascula.objects.filter(activa=True):
        mediciones = MedicionBascula.objects.filter(bascula=bascula)
        
        if mediciones.exists():
            stats = mediciones.aggregate(
                promedio=Avg('peso_quintales'),
                maximo=Max('peso_quintales'),
                minimo=Min('peso_quintales'),
                total=Count('id')
            )
            
            estadisticas.append({
                'bascula': bascula.nombre,
                'raspberry': bascula.raspberry.nombre,
                'peso_promedio': round(stats['promedio'], 2) if stats['promedio'] else None,
                'peso_maximo': round(stats['maximo'], 2) if stats['maximo'] else None,
                'peso_minimo': round(stats['minimo'], 2) if stats['minimo'] else None,
                'total_mediciones': stats['total']
            })
    
    return Response(estadisticas, status=status.HTTP_200_OK)
```

---

## 🔗 Paso 4: Agregar URLs en `backend/apps/sensors/urls.py`

Agrega las siguientes rutas al final del array `urlpatterns` en `backend/apps/sensors/urls.py`:

```python
    # === Básculas endpoints ===
    path('bascula/', views.BasculaListCreateView.as_view(), name='bascula-list'),
    path('bascula/<int:pk>/', views.BasculaDetailView.as_view(), name='bascula-detail'),
    
    # === Mediciones de báscula endpoints ===
    path('bascula/medicion/', views.MedicionBasculaListView.as_view(), name='medicion-bascula-list'),
    path('bascula/recibir/', views.recibir_mediciones_bascula, name='recibir-bascula'),
    path('bascula/resumen/', views.resumen_basculas, name='resumen-basculas'),
    path('bascula/estadisticas/', views.estadisticas_basculas, name='estadisticas-basculas'),
```

---

## 🗄️ Paso 5: Crear y Aplicar Migraciones

```bash
# Crear migraciones
cd backend
python manage.py makemigrations sensors

# Aplicar migraciones
python manage.py migrate sensors
```

---

## ✅ Paso 6: Verificar que Todo Funciona

### Probar el Endpoint Manualmente

```bash
# Probar recepción de datos (formato simplificado)
curl -X POST http://68.183.155.4:8000/api/v1/sensors/bascula/recibir/ \
  -u laptop:beneficiob2 \
  -H "Content-Type: application/json" \
  -d '{
    "bascula_nombre": "bascula camionera",
    "peso_quintales": 39.50
  }'

# Verificar resumen
curl -u laptop:beneficiob2 http://68.183.155.4:8000/api/v1/sensors/bascula/resumen/

# Verificar estadísticas
curl -u laptop:beneficiob2 http://68.183.155.4:8000/api/v1/sensors/bascula/estadisticas/
```

---

## 📊 Estructura de Datos

### Formato de Envío (Simplificado)

**Solo se requiere el nombre de la báscula y el peso:**

```json
{
    "bascula_nombre": "bascula camionera",
    "peso_quintales": 39.50,
    "tipo": "bascula"  // Opcional
}
```

**Nota importante:** No se requiere información del dispositivo (raspberry, IP, etc.). Solo el nombre de la báscula es suficiente para identificar y almacenar las mediciones.

### Respuesta del Servidor

```json
{
    "bascula_nombre": "bascula camionera",
    "peso_quintales": 39.50,
    "medicion_creada": {
        "id": 1,
        "bascula": 1,
        "bascula_nombre": "bascula camionera",
        "raspberry_nombre": "Sistema-Basculas",
        "peso_quintales": 39.50,
        "timestamp": "2024-01-15T10:30:00Z",
        "raspberry_ip": null
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔄 Reutilización del Código

Este código está diseñado para ser reutilizado con diferentes básculas. Para usar con otras básculas, simplemente cambia el valor de `BASCULA_NOMBRE` en `raspberry_bascula_client.py`:

- `"bascula camionera"` (actual)
- `"bascula transformacion"`
- `"bascula especial"`

El backend creará automáticamente las básculas cuando reciba datos con nombres diferentes.

## ✨ Ventajas del Enfoque Simplificado

1. **Simplicidad:** Solo se requiere el nombre de la báscula y el peso
2. **Multiplataforma:** Funciona en Windows, Linux, Raspberry Pi sin configuración adicional
3. **Sin dependencias de red:** No requiere conocer la IP del dispositivo
4. **Fácil implementación:** El cliente solo envía lo esencial
5. **Escalable:** Fácil agregar nuevas básculas solo cambiando el nombre

---

## ✅ Resumen de Endpoints Creados

Una vez modificado el backend, estarán disponibles los siguientes endpoints:

1. **POST** `/api/v1/sensors/bascula/recibir/` - Recibir datos de báscula
2. **GET** `/api/v1/sensors/bascula/` - Listar básculas
3. **GET** `/api/v1/sensors/bascula/<id>/` - Detalle de báscula
4. **GET** `/api/v1/sensors/bascula/medicion/` - Listar mediciones
5. **GET** `/api/v1/sensors/bascula/resumen/` - Resumen de básculas
6. **GET** `/api/v1/sensors/bascula/estadisticas/` - Estadísticas de básculas

Todos los endpoints requieren autenticación excepto los marcados con `@permission_classes([AllowAny])` que son:
- `/api/v1/sensors/bascula/recibir/`
- `/api/v1/sensors/bascula/resumen/`
- `/api/v1/sensors/bascula/estadisticas/`

---

## 📝 Notas Importantes

- Asegúrate de hacer backup de la base de datos antes de aplicar las migraciones
- Verifica que todos los imports estén correctos antes de ejecutar el servidor
- Si tienes errores, revisa los logs del servidor Django para más detalles
- Los endpoints públicos (`@permission_classes([AllowAny])`) están así para facilitar la recepción de datos desde las Raspberry Pi, considera agregar autenticación por IP o tokens en producción

