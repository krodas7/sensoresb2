"""
Views for sensors
"""

from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from django.db import models

from .models import (
    Sensor, RaspberryPi, Recipiente, Medicion, 
    SensorTemperatura, MedicionTemperatura
)
from .serializers import (
    SensorSerializer, SensorListSerializer, RaspberryPiSerializer,
    RecipienteSerializer, MedicionSerializer, MedicionCreateSerializer,
    SensorTemperaturaSerializer, MedicionTemperaturaSerializer,
    TemperaturaCreateSerializer
)


class SensorListCreateView(generics.ListCreateAPIView):
    """Sensor list and create view"""
    queryset = Sensor.objects.all()
    permission_classes = [AllowAny]  # Make it public to avoid 401 errors
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sensor_type', 'is_active', 'area']
    search_fields = ['code', 'description', 'location']
    ordering_fields = ['code', 'created_at', 'last_reading_time']
    ordering = ['code']
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SensorListSerializer
        return SensorSerializer


class SensorDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Sensor detail view"""
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def sensor_status(request):
    """Get sensor status summary"""
    total_sensors = Sensor.objects.count()
    active_sensors = Sensor.objects.filter(is_active=True).count()
    online_sensors = sum(1 for sensor in Sensor.objects.filter(is_active=True) if sensor.is_online)
    
    return Response({
        'total': total_sensors,
        'active': active_sensors,
        'online': online_sensors,
        'offline': active_sensors - online_sensors
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_sensor_data(request):
    """Get recent sensor data without authentication"""
    try:
        # Obtener datos del cache (datos reales del Raspberry Pi)
        cached_data = cache.get('sensor_data', [])
        
        # Si no hay datos en cache, devolver datos simulados
        if not cached_data:
            cached_data = [
                {
                    'sensor_id': 'PILA_1',
                    'temperature': 25.5,
                    'timestamp': '2025-09-23T18:55:12.186154',
                    'location': 'Pila de Secado 1',
                    'status': 'OK'
                }
            ]
        
        return Response({
            'status': 'success',
            'data': cached_data,
            'count': len(cached_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error getting sensor data: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def receive_sensor_data(request):
    """Receive sensor data from Raspberry Pi"""
    try:
        data = request.data
        
        # Log the received data
        print(f"📡 Received sensor data: {data}")
        
        # Extract sensor information
        sensor_id = data.get('sensor_id', 'UNKNOWN')
        temperature = data.get('temperature', 0)
        timestamp = data.get('timestamp', None)
        location = data.get('location', f'Sensor {sensor_id}')
        sensor_status = data.get('status', 'OK')
        
        # Crear objeto de datos del sensor
        sensor_data = {
            'sensor_id': sensor_id,
            'temperature': temperature,
            'timestamp': timestamp,
            'location': location,
            'status': sensor_status
        }
        
        # Guardar en cache (mantener solo los últimos 10 registros)
        cached_data = cache.get('sensor_data', [])
        cached_data.insert(0, sensor_data)  # Agregar al inicio
        cached_data = cached_data[:10]      # Mantener solo 10 registros
        cache.set('sensor_data', cached_data, timeout=3600)  # 1 hora
        
        print(f"🌡️ Sensor {sensor_id}: {temperature}°C at {timestamp}")
        print(f"💾 Datos guardados en cache: {len(cached_data)} registros")
        
        return Response({
            'status': 'success',
            'message': 'Data received successfully',
            'sensor_id': sensor_id,
            'temperature': temperature
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error receiving sensor data: {str(e)}")
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================================================
# ENDPOINTS PARA SISTEMA DE MONITOREO IoT (RASPBERRY PI)
# ============================================================================

# === Vistas para Raspberry Pi ===

class RaspberryPiListCreateView(generics.ListCreateAPIView):
    """Lista y crea Raspberry Pis"""
    queryset = RaspberryPi.objects.all()
    serializer_class = RaspberryPiSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['activa', 'ubicacion']
    search_fields = ['nombre', 'ip_address', 'ubicacion']
    ordering_fields = ['nombre', 'fecha_creacion', 'ultima_conexion']
    ordering = ['nombre']


class RaspberryPiDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualiza y elimina Raspberry Pi"""
    queryset = RaspberryPi.objects.all()
    serializer_class = RaspberryPiSerializer
    permission_classes = [IsAuthenticated]


# === Vistas para Recipientes ===

class RecipienteListCreateView(generics.ListCreateAPIView):
    """Lista y crea Recipientes"""
    queryset = Recipiente.objects.select_related('raspberry').all()
    serializer_class = RecipienteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['raspberry', 'activo', 'tipo']
    search_fields = ['nombre', 'raspberry__nombre']
    ordering_fields = ['nombre', 'fecha_creacion']
    ordering = ['raspberry', 'nombre']


class RecipienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualiza y elimina Recipiente"""
    queryset = Recipiente.objects.select_related('raspberry').all()
    serializer_class = RecipienteSerializer
    permission_classes = [IsAuthenticated]


# === Vistas para Mediciones ===

class MedicionListView(generics.ListAPIView):
    """Lista mediciones con filtros"""
    queryset = Medicion.objects.select_related('recipiente__raspberry').all()
    serializer_class = MedicionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['recipiente', 'recipiente__raspberry', 'raspberry_ip', 'estado']
    search_fields = ['recipiente__nombre', 'recipiente__raspberry__nombre']
    ordering_fields = ['timestamp', 'porcentaje_llenado', 'distancia_cm']
    ordering = ['-timestamp']


class MedicionDetailView(generics.RetrieveAPIView):
    """Detalle de una medición"""
    queryset = Medicion.objects.select_related('recipiente__raspberry').all()
    serializer_class = MedicionSerializer
    permission_classes = [IsAuthenticated]


@api_view(['POST'])
@permission_classes([AllowAny])
def recibir_mediciones_raspberry(request):
    """
    Endpoint para recibir mediciones de distancia desde Raspberry Pi
    Formato esperado:
    {
        "raspberry_ip": "192.168.0.100",
        "mediciones": [
            {
                "recipiente": "Pila de Fermentación 1",
                "distancia": "45.5"
            }
        ]
    }
    """
    try:
        print(f"DEBUG: Recibiendo datos de distancia: {request.data}")
        serializer = MedicionCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"DEBUG: Serializer inválido: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        raspberry_ip = serializer.validated_data['raspberry_ip']
        mediciones_data = serializer.validated_data['mediciones']
        
        # Buscar o crear la Raspberry Pi
        raspberry, created = RaspberryPi.objects.get_or_create(
            ip_address=raspberry_ip,
            defaults={
                'nombre': f'Raspberry-{raspberry_ip}',
                'ubicacion': 'Ubicación por definir',
                'activa': True
            }
        )
        
        # Actualizar última conexión
        raspberry.ultima_conexion = timezone.now()
        raspberry.save()
    
        mediciones_creadas = []
        errores = []
        
        for medicion_data in mediciones_data:
            try:
                # Buscar el recipiente
                recipiente = Recipiente.objects.get(
                    raspberry=raspberry,
                    nombre=medicion_data['recipiente']
                )
                
                # Calcular porcentaje
                distancia = float(medicion_data['distancia'])
                porcentaje = Medicion.calcular_porcentaje(
                    distancia, 
                    recipiente.distancia_sensor, 
                    recipiente.profundidad,
                    recipiente.tipo,
                    recipiente.distancia_vacia,
                    recipiente.distancia_llena
                )
                
                # Determinar estado
                estado = medicion_data.get('estado', None)
                if not estado:
                    estado = Medicion.determinar_estado(porcentaje)
                
                # Crear medición
                medicion = Medicion.objects.create(
                    recipiente=recipiente,
                    distancia_cm=distancia,
                    porcentaje_llenado=porcentaje,
                    estado=estado,
                    raspberry_ip=raspberry_ip
                )
                
                mediciones_creadas.append(medicion)
                
            except Recipiente.DoesNotExist:
                error_msg = f"Recipiente '{medicion_data['recipiente']}' no encontrado"
                errores.append(error_msg)
            except ValueError as e:
                error_msg = f"Error en distancia: {str(e)}"
                errores.append(error_msg)
            except Exception as e:
                error_msg = f"Error inesperado: {str(e)}"
                errores.append(error_msg)
    
        # Respuesta
        response_data = {
            'raspberry_ip': raspberry_ip,
            'mediciones_creadas': len(mediciones_creadas),
            'errores': errores,
            'timestamp': timezone.now()
        }
        
        if mediciones_creadas:
            response_data['mediciones'] = MedicionSerializer(mediciones_creadas, many=True).data
        
        status_code = status.HTTP_201_CREATED if mediciones_creadas else status.HTTP_400_BAD_REQUEST
        return Response(response_data, status=status_code)
        
    except Exception as e:
        print(f"DEBUG: Error general: {e}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === Vistas para Sensores de Temperatura ===

class SensorTemperaturaListCreateView(generics.ListCreateAPIView):
    """Lista y crea sensores de temperatura"""
    queryset = SensorTemperatura.objects.select_related('raspberry').all()
    serializer_class = SensorTemperaturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['raspberry', 'activo']
    search_fields = ['nombre', 'ubicacion']
    ordering = ['raspberry', 'nombre']


class SensorTemperaturaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualiza y elimina sensor de temperatura"""
    queryset = SensorTemperatura.objects.select_related('raspberry').all()
    serializer_class = SensorTemperaturaSerializer
    permission_classes = [IsAuthenticated]


class MedicionTemperaturaListView(generics.ListAPIView):
    """Lista mediciones de temperatura"""
    queryset = MedicionTemperatura.objects.select_related('sensor__raspberry').all()
    serializer_class = MedicionTemperaturaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sensor', 'estado']
    search_fields = ['sensor__nombre']
    ordering = ['-timestamp']


@api_view(['POST'])
@permission_classes([AllowAny])
def recibir_mediciones_temperatura(request):
    """
    Endpoint para recibir mediciones de temperatura desde Raspberry Pi
    Formato esperado:
    {
        "raspberry_ip": "192.168.0.102",
        "mediciones": [
            {
                "sensor": "Guardiola 1",
                "temperatura": "25.5",
                "estado": "OK"
            }
        ],
        "tipo": "temperatura"
    }
    """
    try:
        print(f"DEBUG: Recibiendo datos de temperatura: {request.data}")
        serializer = TemperaturaCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"DEBUG: Serializer inválido: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        raspberry_ip = serializer.validated_data['raspberry_ip']
        mediciones_data = serializer.validated_data['mediciones']
        
        # Buscar o crear la Raspberry Pi
        raspberry, created = RaspberryPi.objects.get_or_create(
            ip_address=raspberry_ip,
            defaults={
                'nombre': f'Raspberry-{raspberry_ip}',
                'ubicacion': 'Ubicación por definir',
                'activa': True
            }
        )
        
        # Actualizar última conexión
        raspberry.ultima_conexion = timezone.now()
        raspberry.save()
    
        mediciones_creadas = []
        errores = []
        
        for medicion_data in mediciones_data:
            try:
                sensor_nombre = medicion_data['sensor']
                
                # Buscar sensor de temperatura (guardiolas)
                sensor = None
                try:
                    sensor = SensorTemperatura.objects.get(
                        raspberry=raspberry,
                        nombre=sensor_nombre
                    )
                except SensorTemperatura.DoesNotExist:
                    # Si no existe, buscar en recipientes de secado
                    try:
                        recipiente = Recipiente.objects.get(
                            raspberry=raspberry,
                            nombre=sensor_nombre,
                            tipo='secado'
                        )
                        
                        # Crear sensor temporal para pilas de secado
                        sensor, created = SensorTemperatura.objects.get_or_create(
                            raspberry=raspberry,
                            nombre=sensor_nombre,
                            defaults={
                                'pin_cs': recipiente.pin_cs or 8,
                                'ubicacion': f'Pila de Secado - {sensor_nombre}',
                                'activo': True
                            }
                        )
                    except Recipiente.DoesNotExist:
                        raise SensorTemperatura.DoesNotExist(f"Sensor '{sensor_nombre}' no encontrado")
                
                # Crear medición de temperatura
                temperatura = float(medicion_data['temperatura'])
                estado = medicion_data['estado']
                
                medicion = MedicionTemperatura.objects.create(
                    sensor=sensor,
                    temperatura=temperatura,
                    estado=estado,
                    raspberry_ip=raspberry_ip
                )
                
                mediciones_creadas.append(medicion)
                
            except (SensorTemperatura.DoesNotExist, Recipiente.DoesNotExist) as e:
                error_msg = f"Sensor '{medicion_data['sensor']}' no encontrado: {str(e)}"
                errores.append(error_msg)
            except ValueError as e:
                error_msg = f"Error en temperatura: {str(e)}"
                errores.append(error_msg)
            except Exception as e:
                error_msg = f"Error inesperado: {str(e)}"
                errores.append(error_msg)
    
        # Respuesta
        response_data = {
            'raspberry_ip': raspberry_ip,
            'mediciones_creadas': len(mediciones_creadas),
            'errores': errores,
            'timestamp': timezone.now()
        }
        
        if mediciones_creadas:
            response_data['mediciones'] = MedicionTemperaturaSerializer(mediciones_creadas, many=True).data
        
        status_code = status.HTTP_201_CREATED if mediciones_creadas else status.HTTP_400_BAD_REQUEST
        return Response(response_data, status=status_code)
        
    except Exception as e:
        print(f"DEBUG: Error general: {e}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === Endpoints de Resumen y Estadísticas ===

@api_view(['GET'])
@permission_classes([AllowAny])
def resumen_mediciones(request):
    """Obtiene un resumen de las últimas mediciones por recipiente"""
    resumen = []
    for recipiente in Recipiente.objects.filter(activo=True):
        ultima_medicion = Medicion.objects.filter(
            recipiente=recipiente
        ).order_by('-timestamp').first()
        
        total_mediciones = Medicion.objects.filter(recipiente=recipiente).count()
        
        resumen.append({
            'recipiente': recipiente.nombre,
            'tipo': recipiente.tipo,
            'raspberry': recipiente.raspberry.nombre,
            'ultima_medicion': ultima_medicion.timestamp if ultima_medicion else None,
            'porcentaje_actual': ultima_medicion.porcentaje_llenado if ultima_medicion else None,
            'distancia_actual': ultima_medicion.distancia_cm if ultima_medicion else None,
            'estado_actual': ultima_medicion.estado if ultima_medicion else None,
            'total_mediciones': total_mediciones,
            'activo': recipiente.activo
        })
    
    return Response(resumen)


@api_view(['GET'])
@permission_classes([AllowAny])
def estadisticas_mediciones(request):
    """Obtiene estadísticas de las mediciones"""
    dias = int(request.GET.get('dias', 7))
    fecha_desde = timezone.now() - timedelta(days=dias)
    
    total_mediciones = Medicion.objects.filter(timestamp__gte=fecha_desde).count()
    recipientes_activos = Recipiente.objects.filter(activo=True).count()
    raspberries_activas = RaspberryPi.objects.filter(activa=True).count()
    
    ultimas_mediciones = []
    for recipiente in Recipiente.objects.filter(activo=True):
        ultima = Medicion.objects.filter(recipiente=recipiente).order_by('-timestamp').first()
        if ultima:
            ultimas_mediciones.append({
                'recipiente': recipiente.nombre,
                'tipo': recipiente.tipo,
                'raspberry': recipiente.raspberry.nombre,
                'porcentaje': ultima.porcentaje_llenado,
                'distancia': ultima.distancia_cm,
                'estado': ultima.estado,
                'timestamp': ultima.timestamp
            })
    
    return Response({
        'periodo_dias': dias,
        'total_mediciones': total_mediciones,
        'recipientes_activos': recipientes_activos,
        'raspberries_activas': raspberries_activas,
        'ultimas_mediciones': ultimas_mediciones,
        'fecha_consulta': timezone.now()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def resumen_fermentacion(request):
    """Obtiene resumen de mediciones de fermentación"""
    dias = int(request.GET.get('dias', 7))
    fecha_desde = timezone.now() - timedelta(days=dias)
    
    recipientes_fermentacion = Recipiente.objects.filter(
        tipo='fermentacion',
        activo=True
    )
    
    resumen = []
    for recipiente in recipientes_fermentacion:
        ultima_medicion = Medicion.objects.filter(
            recipiente=recipiente,
            timestamp__gte=fecha_desde
        ).order_by('-timestamp').first()
        
        total_mediciones = Medicion.objects.filter(
            recipiente=recipiente,
            timestamp__gte=fecha_desde
        ).count()
        
        resumen.append({
            'recipiente': recipiente.nombre,
            'raspberry': recipiente.raspberry.nombre,
            'raspberry_ip': recipiente.raspberry.ip_address,
            'tipo': recipiente.tipo,
            'pin_trig': recipiente.pin_trig,
            'pin_echo': recipiente.pin_echo,
            'ultima_medicion': ultima_medicion.timestamp if ultima_medicion else None,
            'porcentaje_actual': ultima_medicion.porcentaje_llenado if ultima_medicion else None,
            'distancia_actual': ultima_medicion.distancia_cm if ultima_medicion else None,
            'estado_actual': ultima_medicion.estado if ultima_medicion else None,
            'total_mediciones': total_mediciones,
            'activo': recipiente.activo,
            'parametros': {
                'distancia_vacia': recipiente.distancia_vacia,
                'distancia_llena': recipiente.distancia_llena,
                'rango_total': recipiente.distancia_vacia - recipiente.distancia_llena
            }
        })
    
    return Response(resumen)


@api_view(['GET'])
@permission_classes([AllowAny])
def resumen_secado(request):
    """Obtiene resumen de mediciones de secado"""
    dias = int(request.GET.get('dias', 7))
    fecha_desde = timezone.now() - timedelta(days=dias)
    
    recipientes_secado = Recipiente.objects.filter(
        tipo='secado',
        activo=True
    )
    
    resumen = []
    for recipiente in recipientes_secado:
        ultima_medicion = Medicion.objects.filter(
            recipiente=recipiente,
            timestamp__gte=fecha_desde
        ).order_by('-timestamp').first()
        
        total_mediciones = Medicion.objects.filter(
            recipiente=recipiente,
            timestamp__gte=fecha_desde
        ).count()
        
        resumen.append({
            'recipiente': recipiente.nombre,
            'raspberry': recipiente.raspberry.nombre,
            'raspberry_ip': recipiente.raspberry.ip_address,
            'tipo': recipiente.tipo,
            'ultima_medicion': ultima_medicion.timestamp if ultima_medicion else None,
            'porcentaje_actual': ultima_medicion.porcentaje_llenado if ultima_medicion else None,
            'distancia_actual': ultima_medicion.distancia_cm if ultima_medicion else None,
            'total_mediciones': total_mediciones,
            'activo': recipiente.activo,
            'parametros': {
                'distancia_sensor': recipiente.distancia_sensor,
                'profundidad': recipiente.profundidad,
                'max_distancia': recipiente.distancia_sensor + recipiente.profundidad
            }
        })
    
    return Response(resumen)


@api_view(['GET'])
@permission_classes([AllowAny])
def resumen_temperaturas(request):
    """Obtiene resumen de las mediciones de temperatura (Guardiolas)"""
    dias = int(request.GET.get('dias', 7))
    fecha_desde = timezone.now() - timedelta(days=dias)
    
    total_mediciones = MedicionTemperatura.objects.filter(timestamp__gte=fecha_desde).count()
    sensores_activos = SensorTemperatura.objects.filter(activo=True).count()
    raspberries_activas = RaspberryPi.objects.filter(activa=True).count()
    
    ultimas_mediciones = []
    for sensor in SensorTemperatura.objects.filter(activo=True):
        ultima = MedicionTemperatura.objects.filter(sensor=sensor).order_by('-timestamp').first()
        if ultima:
            ultimas_mediciones.append({
                'sensor': sensor.nombre,
                'raspberry': sensor.raspberry.nombre,
                'raspberry_ip': sensor.raspberry.ip_address,
                'pin_cs': sensor.pin_cs,
                'temperatura': ultima.temperatura,
                'estado': ultima.estado,
                'timestamp': ultima.timestamp
            })
    
    return Response({
        'periodo_dias': dias,
        'total_mediciones': total_mediciones,
        'sensores_activos': sensores_activos,
        'raspberries_activas': raspberries_activas,
        'ultimas_mediciones': ultimas_mediciones,
        'fecha_consulta': timezone.now()
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def estadisticas_temperaturas(request):
    """Obtiene estadísticas de las mediciones de temperatura"""
    dias = int(request.GET.get('dias', 7))
    fecha_desde = timezone.now() - timedelta(days=dias)
    
    total_mediciones = MedicionTemperatura.objects.filter(timestamp__gte=fecha_desde).count()
    sensores_activos = SensorTemperatura.objects.filter(activo=True).count()
    
    # Estadísticas por estado
    estados_stats = {}
    for estado in ['OK', 'WARNING', 'ERROR']:
        count = MedicionTemperatura.objects.filter(
            estado=estado,
            timestamp__gte=fecha_desde
        ).count()
        estados_stats[estado] = count
    
    # Temperaturas promedio por sensor
    temperaturas_promedio = []
    for sensor in SensorTemperatura.objects.filter(activo=True):
        promedio = MedicionTemperatura.objects.filter(
            sensor=sensor,
            timestamp__gte=fecha_desde
        ).aggregate(
            temp_promedio=models.Avg('temperatura'),
            temp_min=models.Min('temperatura'),
            temp_max=models.Max('temperatura')
        )
        
        if promedio['temp_promedio'] is not None:
            temperaturas_promedio.append({
                'sensor': sensor.nombre,
                'raspberry': sensor.raspberry.nombre,
                'temperatura_promedio': round(promedio['temp_promedio'], 2),
                'temperatura_min': round(promedio['temp_min'], 2),
                'temperatura_max': round(promedio['temp_max'], 2)
            })
    
    return Response({
        'periodo_dias': dias,
        'total_mediciones': total_mediciones,
        'sensores_activos': sensores_activos,
        'estados_stats': estados_stats,
        'temperaturas_promedio': temperaturas_promedio,
        'fecha_consulta': timezone.now()
    })
