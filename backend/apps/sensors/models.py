"""
Sensor models for IoT devices
"""

from django.db import models
from apps.areas.models import Area


class Sensor(models.Model):
    """Sensor model for IoT devices"""
    
    SENSOR_TYPES = [
        ('temperature', 'Temperatura'),
        ('humidity', 'Humedad'),
        ('ph', 'pH'),
        ('pressure', 'Presión'),
        ('distance', 'Distancia'),
        ('other', 'Otro'),
    ]
    
    code = models.CharField(max_length=50, unique=True, verbose_name='Código')
    sensor_type = models.CharField(max_length=20, choices=SENSOR_TYPES, verbose_name='Tipo')
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='sensors', verbose_name='Área')
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    last_reading_time = models.DateTimeField(null=True, blank=True, verbose_name='Última Lectura')
    last_reading_value = models.FloatField(null=True, blank=True, verbose_name='Último Valor')
    location = models.CharField(max_length=200, blank=True, verbose_name='Ubicación')
    description = models.TextField(blank=True, verbose_name='Descripción')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Sensor'
        verbose_name_plural = 'Sensores'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} ({self.get_sensor_type_display()}) - {self.area.name}"
    
    @property
    def is_online(self):
        """Check if sensor is online (has recent readings)"""
        if not self.last_reading_time:
            return False
        
        from django.utils import timezone
        from datetime import timedelta
        
        # Consider sensor offline if no reading in last 5 minutes
        threshold = timezone.now() - timedelta(minutes=5)
        return self.last_reading_time > threshold
    
    @property
    def status(self):
        """Get sensor status"""
        if not self.is_active:
            return 'inactive'
        elif not self.is_online:
            return 'offline'
        else:
            return 'online'


class RaspberryPi(models.Model):
    """Modelo para representar una Raspberry Pi"""
    nombre = models.CharField(max_length=100, unique=True)
    ip_address = models.GenericIPAddressField()
    ubicacion = models.CharField(max_length=200, blank=True, null=True)
    activa = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_conexion = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Raspberry Pi"
        verbose_name_plural = "Raspberry Pis"
        ordering = ['nombre']
    
    def __str__(self):
        return f"{self.nombre} ({self.ip_address})"


class Recipiente(models.Model):
    """Modelo para representar un recipiente de medición (Pilas de Fermentación/Secado)"""
    TIPO_RECIPIENTE = [
        ('fermentacion', 'Pila de Fermentación'),
        ('secado', 'Pila de Secado'),
    ]
    
    raspberry = models.ForeignKey(RaspberryPi, on_delete=models.CASCADE, related_name='recipientes')
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_RECIPIENTE, default='fermentacion')
    
    # Campos para sensores de distancia (HC-SR04 - fermentación y secado)
    pin_trig = models.IntegerField(blank=True, null=True)
    pin_echo = models.IntegerField(blank=True, null=True)
    distancia_sensor = models.FloatField(default=30.0)  # Distancia desde el sensor al fondo (cm)
    profundidad = models.FloatField(default=220.0)  # Profundidad útil (cm)
    
    # Parámetros para fermentación (cálculo de llenado mejorado)
    distancia_vacia = models.FloatField(default=268.0)  # Distancia cuando está vacía (0%)
    distancia_llena = models.FloatField(default=118.0)  # Distancia cuando está llena (100%)
    
    # Campos para sensores de temperatura (MAX6675 - solo si el recipiente tiene sensor de temp)
    pin_cs = models.IntegerField(blank=True, null=True)  # Pin CS para MAX6675
    spi_bus = models.IntegerField(default=0, blank=True, null=True)  # Bus SPI
    spi_device = models.IntegerField(default=0, blank=True, null=True)  # Device SPI
    temp_min = models.FloatField(default=-10.0)  # Temperatura mínima esperada (°C)
    temp_max = models.FloatField(default=80.0)   # Temperatura máxima esperada (°C)
    temp_warning = models.FloatField(default=50.0)  # Temperatura de advertencia (°C)
    
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Recipiente"
        verbose_name_plural = "Recipientes"
        ordering = ['raspberry', 'nombre']
        unique_together = ['raspberry', 'nombre']
    
    def __str__(self):
        return f"{self.raspberry.nombre} - {self.nombre}"
    
    @property
    def max_distancia(self):
        """Calcula la distancia máxima (sensor + profundidad)"""
        return self.distancia_sensor + self.profundidad


class Medicion(models.Model):
    """Modelo para almacenar las mediciones de distancia/llenado"""
    ESTADO_LLENADO = [
        ('Vacío', 'Vacío (0-10%)'),
        ('Llenando', 'Llenando (11-75%)'),
        ('Lleno', 'Lleno (76-100%)'),
    ]
    
    recipiente = models.ForeignKey(Recipiente, on_delete=models.CASCADE, related_name='mediciones')
    distancia_cm = models.FloatField()
    porcentaje_llenado = models.FloatField()
    estado = models.CharField(max_length=20, choices=ESTADO_LLENADO, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    raspberry_ip = models.GenericIPAddressField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Medición"
        verbose_name_plural = "Mediciones"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['recipiente', '-timestamp']),
            models.Index(fields=['-timestamp']),
            models.Index(fields=['estado', '-timestamp']),
        ]
    
    def __str__(self):
        estado_str = f" - {self.estado}" if self.estado else ""
        return f"{self.recipiente} - {self.porcentaje_llenado}%{estado_str} ({self.timestamp})"
    
    @classmethod
    def determinar_estado(cls, porcentaje):
        """Determina el estado de llenado basado en el porcentaje"""
        if porcentaje <= 10.0:
            return 'Vacío'
        elif porcentaje <= 75.0:
            return 'Llenando'
        else:
            return 'Lleno'
    
    @classmethod
    def calcular_porcentaje(cls, distancia, distancia_sensor, profundidad, tipo_recipiente='fermentacion', 
                           distancia_vacia=None, distancia_llena=None):
        """Calcula el porcentaje de llenado basado en la distancia"""
        
        if tipo_recipiente == 'fermentacion' and distancia_vacia is not None and distancia_llena is not None:
            # Cálculo para pilas de fermentación con nuevos parámetros
            # 265cm = 0% (completamente vacía)
            # 105cm = 100% (completamente llena)
            rango_total = distancia_vacia - distancia_llena  # 160cm
            
            if distancia >= distancia_vacia:
                return 0.0  # Vacío
            elif distancia <= distancia_llena:
                return 100.0  # Lleno
            else:
                porcentaje = ((distancia_vacia - distancia) / rango_total) * 100
                return round(porcentaje, 2)
        else:
            # Cálculo tradicional para pilas de secado
            max_distancia = distancia_sensor + profundidad
            
            if distancia >= max_distancia:
                return 0.0
            elif distancia <= distancia_sensor:
                return 100.0
            else:
                porcentaje = ((max_distancia - distancia) / profundidad) * 100
                return round(porcentaje, 2)


class SensorTemperatura(models.Model):
    """Modelo para representar un sensor de temperatura (Guardiolas)"""
    ESTADOS_TEMPERATURA = [
        ('OK', 'Normal'),
        ('WARNING', 'Alerta'),
        ('ERROR', 'Error'),
    ]
    
    raspberry = models.ForeignKey(RaspberryPi, on_delete=models.CASCADE, related_name='sensores_temperatura')
    nombre = models.CharField(max_length=100)
    pin_cs = models.IntegerField()  # Pin Chip Select
    ubicacion = models.CharField(max_length=200, blank=True, null=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Sensor de Temperatura"
        verbose_name_plural = "Sensores de Temperatura"
        ordering = ['raspberry', 'nombre']
        unique_together = ['raspberry', 'nombre']
    
    def __str__(self):
        return f"{self.raspberry.nombre} - {self.nombre}"


class MedicionTemperatura(models.Model):
    """Modelo para almacenar las mediciones de temperatura (Guardiolas)"""
    ESTADOS_TEMPERATURA = [
        ('OK', 'Normal'),
        ('WARNING', 'Alerta'),
        ('ERROR', 'Error'),
    ]
    
    sensor = models.ForeignKey(SensorTemperatura, on_delete=models.CASCADE, related_name='mediciones')
    temperatura = models.FloatField()  # Temperatura en Celsius
    estado = models.CharField(max_length=10, choices=ESTADOS_TEMPERATURA, default='OK')
    timestamp = models.DateTimeField(auto_now_add=True)
    raspberry_ip = models.GenericIPAddressField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Medición de Temperatura"
        verbose_name_plural = "Mediciones de Temperatura"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['sensor', '-timestamp']),
            models.Index(fields=['-timestamp']),
            models.Index(fields=['estado', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.sensor} - {self.temperatura}°C ({self.estado}) - {self.timestamp}"
    
    @classmethod
    def determinar_estado(cls, temperatura):
        """Determina el estado basado en la temperatura"""
        if temperatura <= -10.0:
            return 'ERROR'
        elif temperatura >= 40.0:
            return 'WARNING'
        else:
            return 'OK'
