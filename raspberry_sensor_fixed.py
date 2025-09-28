#!/usr/bin/env python3
"""
Script corregido para sensor MAX6675 en Raspberry Pi
Beneficio de Café - Sistema de Monitoreo de Temperatura
"""

import requests
import time
import spidev
from datetime import datetime
import logging
import sys

# ⚠️ CONFIGURACIÓN - CAMBIAR ESTA IP POR LA DE TU COMPUTADORA ⚠️
SERVER_URL = "http://192.168.0.16:8000/api/v1/sensors/data/"
SENSOR_ID = "PILA_1"  # Cambiar según tu sensor
INTERVAL = 30  # Segundos entre lecturas

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('/tmp/sensor.log')
    ]
)
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
            return True
        except Exception as e:
            logger.error(f"❌ Error configurando SPI: {e}")
            logger.error("💡 Asegúrate de que SPI esté habilitado: sudo raspi-config")
            self.spi = None
            return False
    
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
            logger.error(f"Error leyendo MAX6675: {e}")
            return None
    
    def read_temperature(self):
        """Leer temperatura del sensor MAX6675"""
        return self.read_celsius()
    
    def send_data_to_server(self, temperature, status="OK"):
        """Enviar datos al servidor"""
        data = {
            "sensor_id": self.sensor_id,
            "temperature": temperature,
            "timestamp": datetime.now().isoformat(),
            "location": f"Pila de Secado {self.sensor_id.split('_')[1] if '_' in self.sensor_id else '1'}",
            "status": status
        }
        
        try:
            response = self.session.post(
                self.server_url,
                json=data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Datos enviados: {self.sensor_id} = {temperature}°C")
                return True
            else:
                logger.error(f"❌ Error: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error de conexión: {e}")
            return False
    
    def test_server_connection(self):
        """Probar conexión al servidor"""
        try:
            status_url = self.server_url.replace('/data/', '/status/')
            response = requests.get(status_url, timeout=5)
            if response.status_code == 200:
                logger.info("✅ Servidor disponible")
                return True
            else:
                logger.error(f"❌ Servidor no disponible: {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"❌ No se puede conectar al servidor: {e}")
            return False
    
    def run_monitoring(self, interval=30):
        """Ejecutar monitoreo continuo"""
        logger.info(f"🚀 Iniciando monitoreo del sensor MAX6675 - {self.sensor_id}")
        logger.info(f"📡 Intervalo: {interval} segundos")
        logger.info(f"🌐 Servidor: {self.server_url}")
        
        consecutive_errors = 0
        max_consecutive_errors = 5
        
        while True:
            try:
                # Leer temperatura del MAX6675
                temperature = self.read_temperature()
                
                if temperature is None:
                    consecutive_errors += 1
                    logger.warning(f"⚠️ No se pudo leer la temperatura (intento {consecutive_errors}/{max_consecutive_errors})")
                    
                    if consecutive_errors >= max_consecutive_errors:
                        logger.error("❌ Demasiados errores consecutivos. Verifica el sensor.")
                        time.sleep(60)  # Esperar más tiempo
                        consecutive_errors = 0
                    else:
                        time.sleep(5)  # Esperar menos tiempo si hay error
                    continue
                
                # Resetear contador de errores si la lectura fue exitosa
                consecutive_errors = 0
                
                # Determinar estado basado en temperatura
                if temperature >= 40.0:
                    status = "WARNING"
                    logger.warning(f"🔥 Temperatura alta detectada: {temperature}°C")
                else:
                    status = "OK"
                
                # Mostrar lectura en consola
                print(f"🌡️ {self.sensor_id}: {temperature}°C ({status}) - {datetime.now().strftime('%H:%M:%S')}")
                
                # Enviar datos al servidor
                success = self.send_data_to_server(temperature, status)
                
                if not success:
                    logger.warning("⚠️ No se pudieron enviar los datos al servidor")
                
                # Esperar antes de la siguiente lectura
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Monitoreo detenido por el usuario")
                break
            except Exception as e:
                consecutive_errors += 1
                logger.error(f"❌ Error inesperado: {e}")
                if consecutive_errors >= max_consecutive_errors:
                    logger.error("❌ Demasiados errores consecutivos. Reiniciando en 60 segundos...")
                    time.sleep(60)
                    consecutive_errors = 0
                else:
                    time.sleep(30)  # Esperar menos tiempo si hay error
    
    def cleanup(self):
        """Cerrar conexión SPI"""
        if self.spi:
            self.spi.close()
            logger.info("🔌 Conexión SPI cerrada")

def check_dependencies():
    """Verificar que las dependencias estén instaladas"""
    try:
        import spidev
        import requests
        logger.info("✅ Dependencias disponibles")
        return True
    except ImportError as e:
        logger.error(f"❌ Dependencia faltante: {e}")
        logger.error("💡 Instala con: pip install spidev requests")
        return False

def main():
    """Función principal"""
    print("🌡️  Sensor MAX6675 - Beneficio de Café")
    print("=" * 50)
    
    # Verificar dependencias
    if not check_dependencies():
        return
    
    # Crear sensor
    sensor = MAX6675TemperatureSensor(SENSOR_ID, SERVER_URL)
    
    # Verificar que SPI esté configurado
    if not sensor.spi:
        logger.error("❌ No se pudo configurar SPI")
        logger.error("💡 Habilita SPI: sudo raspi-config -> Interface Options -> SPI -> Enable")
        return
    
    # Verificar conexión al servidor
    if not sensor.test_server_connection():
        logger.error("💡 Verifica que la IP del servidor sea correcta")
        logger.error(f"💡 IP actual: {SERVER_URL}")
        return
    
    print(f"🔧 Sensor: {SENSOR_ID}")
    print(f"📡 SPI: Bus {sensor.bus}, Device {sensor.device}")
    print(f"⏱️  Intervalo: {INTERVAL} segundos")
    print(f"🌐 Servidor: {SERVER_URL}")
    print("\nPresiona Ctrl+C para detener\n")
    
    try:
        # Iniciar monitoreo
        sensor.run_monitoring(INTERVAL)
    finally:
        # Limpiar recursos
        sensor.cleanup()

if __name__ == "__main__":
    main()
