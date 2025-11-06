"""
Comando de Django para inicializar el sistema IoT de monitoreo de beneficio de café
Replica la configuración exacta del sistema api-beneficio
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.sensors.models import RaspberryPi, Recipiente, SensorTemperatura


class Command(BaseCommand):
    help = 'Inicializa el sistema IoT con todas las Raspberry Pis, Recipientes y Sensores de Temperatura'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limpiar',
            action='store_true',
            help='Elimina todos los datos existentes antes de crear nuevos',
        )

    def handle(self, *args, **options):
        if options['limpiar']:
            self.stdout.write(self.style.WARNING('🗑️  Limpiando datos existentes...'))
            SensorTemperatura.objects.all().delete()
            Recipiente.objects.all().delete()
            RaspberryPi.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✅ Datos limpiados'))

        self.stdout.write(self.style.SUCCESS('🚀 Iniciando configuración del sistema IoT...'))
        
        with transaction.atomic():
            # ============================================================================
            # 1. RASPBERRY PI 192.168.0.100 - PILAS DE FERMENTACIÓN
            # ============================================================================
            self.stdout.write(self.style.HTTP_INFO('\n📍 Configurando Raspberry Pi 100 - Pilas de Fermentación'))
            
            rasp_100, created = RaspberryPi.objects.get_or_create(
                ip_address='192.168.0.100',
                defaults={
                    'nombre': 'Raspberry-Fermentacion',
                    'ubicacion': 'Área de Fermentación',
                    'activa': True
                }
            )
            status = "✅ Creada" if created else "ℹ️  Ya existe"
            self.stdout.write(f"  {status}: {rasp_100.nombre} ({rasp_100.ip_address})")
            
            # Configuración de sensores HC-SR04 para fermentación
            # Basado en raspberry_100_fermentacion/raspberry_sensor_client.py
            sensores_fermentacion = [
                {"nombre": "Pila de Fermentación 1", "TRIG": 23, "ECHO": 24},  # Pin 16, Pin 18
                {"nombre": "Pila de Fermentación 2", "TRIG": 17, "ECHO": 27},  # Pin 11, Pin 13
                {"nombre": "Pila de Fermentación 3", "TRIG": 22, "ECHO": 5},   # Pin 15, Pin 29
                {"nombre": "Pila de Fermentación 4", "TRIG": 6, "ECHO": 13},   # Pin 31, Pin 33
                {"nombre": "Pila de Fermentación 5", "TRIG": 19, "ECHO": 26},  # Pin 35, Pin 37
                {"nombre": "Pila de Fermentación 6", "TRIG": 16, "ECHO": 20},  # Pin 36, Pin 38
            ]
            
            for sensor in sensores_fermentacion:
                recipiente, created = Recipiente.objects.get_or_create(
                    raspberry=rasp_100,
                    nombre=sensor["nombre"],
                    defaults={
                        'tipo': 'fermentacion',
                        'pin_trig': sensor["TRIG"],
                        'pin_echo': sensor["ECHO"],
                        'distancia_sensor': 30.0,
                        'profundidad': 220.0,
                        'distancia_vacia': 265.0,  # 0% lleno
                        'distancia_llena': 105.0,  # 100% lleno
                        'activo': True
                    }
                )
                status = "✅" if created else "ℹ️ "
                self.stdout.write(f"    {status} {sensor['nombre']} (TRIG={sensor['TRIG']}, ECHO={sensor['ECHO']})")
            
            # ============================================================================
            # 2. RASPBERRY PI 192.168.0.101 - PILAS DE SECADO
            # ============================================================================
            self.stdout.write(self.style.HTTP_INFO('\n📍 Configurando Raspberry Pi 101 - Pilas de Secado'))
            
            rasp_101, created = RaspberryPi.objects.get_or_create(
                ip_address='192.168.0.101',
                defaults={
                    'nombre': 'Raspberry-Secado',
                    'ubicacion': 'Área de Secado',
                    'activa': True
                }
            )
            status = "✅ Creada" if created else "ℹ️  Ya existe"
            self.stdout.write(f"  {status}: {rasp_101.nombre} ({rasp_101.ip_address})")
            
            # Configuración de sensores MAX6675 para pilas de secado
            # Basado en raspberry_101_secado/raspberry_temp_client.py
            # Solo 3 sensores están físicamente conectados
            sensores_secado = [
                {"nombre": "Horno", "CS": 14, "bus": 0, "device": 0},                    # Pin físico 8
                {"nombre": "Pila de Secado 5", "CS": 23, "bus": 0, "device": 1},         # Pin físico 16
                {"nombre": "Pila de Secado 6", "CS": 25, "bus": 0, "device": 2},         # Pin físico 22
            ]
            
            for sensor in sensores_secado:
                # Crear recipiente (aunque es temperatura, se guarda la config aquí)
                recipiente, created = Recipiente.objects.get_or_create(
                    raspberry=rasp_101,
                    nombre=sensor["nombre"],
                    defaults={
                        'tipo': 'secado',
                        'pin_cs': sensor["CS"],
                        'spi_bus': sensor["bus"],
                        'spi_device': sensor["device"],
                        'temp_min': -10.0,
                        'temp_max': 80.0,
                        'temp_warning': 50.0,
                        'activo': True
                    }
                )
                
                # También crear como SensorTemperatura para las mediciones
                sensor_temp, created_temp = SensorTemperatura.objects.get_or_create(
                    raspberry=rasp_101,
                    nombre=sensor["nombre"],
                    defaults={
                        'pin_cs': sensor["CS"],
                        'ubicacion': f'Pila de Secado - {sensor["nombre"]}',
                        'activo': True
                    }
                )
                status = "✅" if created else "ℹ️ "
                self.stdout.write(f"    {status} {sensor['nombre']} (CS={sensor['CS']})")
            
            # ============================================================================
            # 3. RASPBERRY PI 192.168.0.102 - GUARDIOLAS 1-2
            # ============================================================================
            self.stdout.write(self.style.HTTP_INFO('\n📍 Configurando Raspberry Pi 102 - Guardiolas 1-2'))
            
            rasp_102, created = RaspberryPi.objects.get_or_create(
                ip_address='192.168.0.102',
                defaults={
                    'nombre': 'Raspberry-Guardiolas-12',
                    'ubicacion': 'Área de Guardiolas 1-2',
                    'activa': True
                }
            )
            status = "✅ Creada" if created else "ℹ️  Ya existe"
            self.stdout.write(f"  {status}: {rasp_102.nombre} ({rasp_102.ip_address})")
            
            # Configuración de sensores MAX6675 para guardiolas
            # Basado en raspberry_102_guardiolas_12/raspberry_temp_client.py
            sensores_guardiolas_12 = [
                {"nombre": "Guardiola 1", "CS": 8, "bus": 0, "device": 0},   # GPIO 8
                {"nombre": "Guardiola 2", "CS": 7, "bus": 0, "device": 1},   # GPIO 7
            ]
            
            for sensor in sensores_guardiolas_12:
                sensor_temp, created = SensorTemperatura.objects.get_or_create(
                    raspberry=rasp_102,
                    nombre=sensor["nombre"],
                    defaults={
                        'pin_cs': sensor["CS"],
                        'ubicacion': f'Guardiola - {sensor["nombre"]}',
                        'activo': True
                    }
                )
                status = "✅" if created else "ℹ️ "
                self.stdout.write(f"    {status} {sensor['nombre']} (CS={sensor['CS']})")
            
            # ============================================================================
            # 4. RASPBERRY PI 192.168.0.103 - GUARDIOLAS 3-4
            # ============================================================================
            self.stdout.write(self.style.HTTP_INFO('\n📍 Configurando Raspberry Pi 103 - Guardiolas 3-4'))
            
            rasp_103, created = RaspberryPi.objects.get_or_create(
                ip_address='192.168.0.103',
                defaults={
                    'nombre': 'Raspberry-Guardiolas-34',
                    'ubicacion': 'Área de Guardiolas 3-4',
                    'activa': True
                }
            )
            status = "✅ Creada" if created else "ℹ️  Ya existe"
            self.stdout.write(f"  {status}: {rasp_103.nombre} ({rasp_103.ip_address})")
            
            # Configuración similar a guardiolas 1-2
            sensores_guardiolas_34 = [
                {"nombre": "Guardiola 3", "CS": 8, "bus": 0, "device": 0},   # GPIO 8
                {"nombre": "Guardiola 4", "CS": 7, "bus": 0, "device": 1},   # GPIO 7
            ]
            
            for sensor in sensores_guardiolas_34:
                sensor_temp, created = SensorTemperatura.objects.get_or_create(
                    raspberry=rasp_103,
                    nombre=sensor["nombre"],
                    defaults={
                        'pin_cs': sensor["CS"],
                        'ubicacion': f'Guardiola - {sensor["nombre"]}',
                        'activo': True
                    }
                )
                status = "✅" if created else "ℹ️ "
                self.stdout.write(f"    {status} {sensor['nombre']} (CS={sensor['CS']})")
        
        # ============================================================================
        # RESUMEN
        # ============================================================================
        self.stdout.write(self.style.SUCCESS('\n' + '='*80))
        self.stdout.write(self.style.SUCCESS('✅ SISTEMA IOT INICIALIZADO CORRECTAMENTE'))
        self.stdout.write(self.style.SUCCESS('='*80))
        
        total_raspberries = RaspberryPi.objects.count()
        total_recipientes = Recipiente.objects.count()
        total_sensores_temp = SensorTemperatura.objects.count()
        
        self.stdout.write(f'\n📊 Resumen del Sistema:')
        self.stdout.write(f'  • Raspberry Pis: {total_raspberries}')
        self.stdout.write(f'  • Recipientes (Fermentación/Secado): {total_recipientes}')
        self.stdout.write(f'  • Sensores de Temperatura (Guardiolas): {total_sensores_temp}')
        
        self.stdout.write(f'\n🎯 Configuración por Raspberry Pi:')
        for rasp in RaspberryPi.objects.all():
            recipientes_count = rasp.recipientes.count()
            sensores_count = rasp.sensores_temperatura.count()
            self.stdout.write(f'  • {rasp.nombre} ({rasp.ip_address}):')
            if recipientes_count > 0:
                self.stdout.write(f'    - {recipientes_count} recipientes')
            if sensores_count > 0:
                self.stdout.write(f'    - {sensores_count} sensores de temperatura')
        
        self.stdout.write(self.style.SUCCESS('\n🚀 El sistema está listo para recibir datos de las Raspberry Pis!'))
        self.stdout.write(self.style.WARNING('\n⚠️  Recuerda actualizar las IPs en los clientes de las Raspberry Pis'))
        self.stdout.write('   Cambiar API_BASE_URL a la nueva IP de sensoresb2')
        self.stdout.write('   Ejemplo: API_BASE_URL = "http://TU_IP:8000"')
        self.stdout.write('   Ejemplo: API_ENDPOINT = f"{API_BASE_URL}/api/v1/sensors/medicion/recibir/"')

