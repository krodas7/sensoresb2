#!/usr/bin/env python3
"""
Script de configuración rápida para Raspberry Pi
Configura automáticamente la IP del servidor y otros parámetros
"""

import os
import sys
import socket

def get_local_ip():
    """Obtener la IP local de la computadora"""
    try:
        # Conectar a una dirección externa para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "192.168.1.100"  # IP por defecto

def configure_scripts():
    """Configurar los scripts con la IP correcta"""
    server_ip = get_local_ip()
    
    print("🍓 Configuración de Scripts para Raspberry Pi")
    print("=" * 50)
    print(f"🌐 IP del servidor detectada: {server_ip}")
    
    # Configurar real_sensor_integration.py
    print("\n📝 Configurando real_sensor_integration.py...")
    
    script_content = f'''#!/usr/bin/env python3
"""
Script de integración para sensor MAX6675 real
Configurado automáticamente para IP: {server_ip}
"""

import requests
import json
import time
import math
import spidev
from datetime import datetime
import logging

# Configuración
SERVER_URL = "http://{server_ip}:8000/api/v1/sensors/data/"
SENSOR_ID = "PILA_1"  # Cambiar según tu sensor
INTERVAL = 30  # Segundos entre lecturas

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MAX6675TemperatureSensor:
    def __init__(self, sensor_id, server_url, bus=0, device=0):
        self.sensor_id = sensor_id
        self.server_url = server_url
        self.session = requests.Session()
        
        # Configurar SPI para MAX6675
        self.bus = bus
        self.device = device
        self.spi = None
        self.setup_spi()
        
    def setup_spi(self):
        """Configurar comunicación SPI con MAX6675"""
        try:
            self.spi = spidev.SpiDev()
            self.spi.open(self.bus, self.device)  # /dev/spidev0.0
            self.spi.max_speed_hz = 500000       # 0.5 MHz es suficiente para MAX6675
            self.spi.mode = 0                    # CPOL=0, CPHA=0
            logger.info("✅ SPI configurado correctamente para MAX6675")
        except Exception as e:
            logger.error(f"❌ Error configurando SPI: {{e}}")
            self.spi = None
    
    def read_celsius(self):
        """Leer temperatura del sensor MAX6675"""
        if not self.spi:
            logger.error("SPI no configurado")
            return None
            
        try:
            # MAX6675 entrega 16 bits por lectura
            raw = self.spi.readbytes(2)        # [MSB, LSB]
            val = (raw[0] << 8) | raw[1]
            
            # Bit D2 (0x0004) = 1 indica termopar abierto
            if val & 0x0004:
                logger.warning("⚠️ Termopar abierto o desconectado")
                return None
                
            # Bits D15..D3 contienen la temperatura con resolución 0.25°C
            temperature = (val >> 3) * 0.25
            return round(temperature, 2)
            
        except Exception as e:
            logger.error(f"Error leyendo MAX6675: {{e}}")
            return None
    
    def read_temperature(self):
        """Leer temperatura del sensor MAX6675"""
        return self.read_celsius()
    
    def send_data_to_server(self, temperature, status="OK"):
        """Enviar datos al servidor"""
        data = {{
            "sensor_id": self.sensor_id,
            "temperature": temperature,
            "timestamp": datetime.now().isoformat(),
            "location": f"Pila de Secado {{self.sensor_id.split('_')[1] if '_' in self.sensor_id else '1'}}",
            "status": status
        }}
        
        try:
            response = self.session.post(
                self.server_url,
                json=data,
                headers={{'Content-Type': 'application/json'}},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Datos enviados: {{self.sensor_id}} = {{temperature}}°C")
                return True
            else:
                logger.error(f"❌ Error: {{response.status_code}} - {{response.text}}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error de conexión: {{e}}")
            return False
    
    def run_monitoring(self, interval=30):
        """Ejecutar monitoreo continuo"""
        logger.info(f"🚀 Iniciando monitoreo del sensor MAX6675 - {{self.sensor_id}}")
        logger.info(f"📡 Intervalo: {{interval}} segundos")
        logger.info(f"🌐 Servidor: {{self.server_url}}")
        
        while True:
            try:
                # Leer temperatura del MAX6675
                temperature = self.read_temperature()
                
                if temperature is None:
                    logger.warning("⚠️ No se pudo leer la temperatura (termopar desconectado?)")
                    time.sleep(5)  # Esperar menos tiempo si hay error
                    continue
                
                # Determinar estado basado en temperatura
                if temperature >= 40.0:
                    status = "WARNING"
                    logger.warning(f"🔥 Temperatura alta detectada: {{temperature}}°C")
                else:
                    status = "OK"
                
                # Mostrar lectura en consola
                print(f"🌡️ {{self.sensor_id}}: {{temperature}}°C ({{status}})")
                
                # Enviar datos al servidor
                self.send_data_to_server(temperature, status)
                
                # Esperar antes de la siguiente lectura
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Monitoreo detenido por el usuario")
                break
            except Exception as e:
                logger.error(f"❌ Error inesperado: {{e}}")
                time.sleep(60)  # Esperar más tiempo si hay error crítico
    
    def cleanup(self):
        """Cerrar conexión SPI"""
        if self.spi:
            self.spi.close()
            logger.info("🔌 Conexión SPI cerrada")

def main():
    """Función principal"""
    print("🌡️  Sensor MAX6675 - Beneficio de Café")
    print("=" * 50)
    
    # Crear sensor
    sensor = MAX6675TemperatureSensor(SENSOR_ID, SERVER_URL)
    
    # Verificar conexión al servidor
    try:
        status_url = SERVER_URL.replace('/data/', '/status/')
        response = requests.get(status_url, timeout=5)
        if response.status_code == 200:
            print("✅ Servidor disponible")
        else:
            print("❌ Servidor no disponible")
            return
    except Exception as e:
        print(f"❌ No se puede conectar al servidor: {{e}}")
        print("💡 Verifica que la IP del servidor sea correcta")
        return
    
    print(f"🔧 Sensor: {{SENSOR_ID}}")
    print(f"📡 SPI: Bus {{sensor.bus}}, Device {{sensor.device}}")
    print(f"⏱️  Intervalo: {{INTERVAL}} segundos")
    print(f"🌐 Servidor: {{SERVER_URL}}")
    print("\\nPresiona Ctrl+C para detener\\n")
    
    try:
        # Iniciar monitoreo
        sensor.run_monitoring(INTERVAL)
    finally:
        # Limpiar recursos
        sensor.cleanup()

if __name__ == "__main__":
    main()
'''
    
    with open('real_sensor_integration.py', 'w') as f:
        f.write(script_content)
    
    print("✅ Script configurado correctamente")
    print(f"🌐 Servidor: http://{server_ip}:8000")
    print("🚀 Listo para copiar al Raspberry Pi")

if __name__ == "__main__":
    configure_scripts()
