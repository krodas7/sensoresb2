#!/usr/bin/env python3
"""
Script para enviar datos de sensores de temperatura desde Raspberry Pi
al servidor Django del beneficio de café.

Instalación:
pip install requests

Uso:
python3 raspberry_sensor_client.py
"""

import requests
import json
import time
import random
from datetime import datetime
import logging

# Configuración
SERVER_URL = "http://192.168.0.21:8000/api/v1/sensors/data/"
STATUS_URL = "http://192.168.0.21:8000/api/v1/sensors/status/"

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TemperatureSensorClient:
    def __init__(self, server_url, status_url):
        self.server_url = server_url
        self.status_url = status_url
        self.session = requests.Session()
        
    def check_server_status(self):
        """Verificar si el servidor está disponible"""
        try:
            response = self.session.get(self.status_url, timeout=5)
            if response.status_code == 200:
                logger.info("✅ Servidor disponible")
                return True
            else:
                logger.error(f"❌ Servidor respondió con código: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error conectando al servidor: {e}")
            return False
    
    def send_temperature_data(self, sensor_id, temperature, location="Pila de Secado 1", status="OK"):
        """Enviar datos de temperatura al servidor"""
        data = {
            "sensor_id": sensor_id,
            "temperature": temperature,
            "timestamp": datetime.now().isoformat(),
            "location": location,
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
                logger.info(f"✅ Datos enviados: {sensor_id} = {temperature}°C")
                return True
            else:
                logger.error(f"❌ Error enviando datos: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Error de conexión: {e}")
            return False
    
    def simulate_sensor_reading(self, sensor_id, base_temp=25.0, variation=5.0):
        """Simular lectura de sensor MAX6675 (reemplazar con tu código real del sensor)"""
        # Simular variación de temperatura realista
        temp_variation = random.uniform(-variation, variation)
        temperature = base_temp + temp_variation
        
        # Simular ocasionalmente temperaturas altas (>40°C) para activar cronómetros
        if random.random() < 0.15:  # 15% de probabilidad
            temperature = random.uniform(40.0, 55.0)
        
        # Simular ocasionalmente termopar desconectado (NaN)
        if random.random() < 0.02:  # 2% de probabilidad
            return None
        
        # Redondear a 2 decimales como el MAX6675 real
        return round(temperature, 2)
    
    def run_continuous_monitoring(self, sensor_id, interval=30):
        """Ejecutar monitoreo continuo del sensor"""
        logger.info(f"🚀 Iniciando monitoreo del sensor {sensor_id}")
        logger.info(f"📡 Enviando datos cada {interval} segundos")
        logger.info(f"🌐 Servidor: {self.server_url}")
        
        while True:
            try:
                # Verificar estado del servidor
                if not self.check_server_status():
                    logger.warning("⚠️ Servidor no disponible, reintentando en 60 segundos...")
                    time.sleep(60)
                    continue
                
                # Leer temperatura del sensor
                temperature = self.simulate_sensor_reading(sensor_id)
                
                # Determinar estado basado en temperatura
                if temperature >= 40.0:
                    status = "WARNING"
                    logger.warning(f"🔥 Temperatura alta detectada: {temperature}°C")
                else:
                    status = "OK"
                
                # Enviar datos al servidor
                success = self.send_temperature_data(
                    sensor_id=sensor_id,
                    temperature=temperature,
                    location=f"Pila de Secado {sensor_id.split('_')[1] if '_' in sensor_id else '1'}",
                    status=status
                )
                
                if success:
                    logger.info(f"📊 {sensor_id}: {temperature}°C ({status})")
                else:
                    logger.error(f"❌ Fallo al enviar datos del sensor {sensor_id}")
                
                # Esperar antes de la siguiente lectura
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Monitoreo detenido por el usuario")
                break
            except Exception as e:
                logger.error(f"❌ Error inesperado: {e}")
                time.sleep(60)  # Esperar antes de reintentar

def main():
    """Función principal"""
    print("🌡️  Cliente de Sensor de Temperatura - Beneficio de Café")
    print("=" * 60)
    
    # Configuración del sensor
    SENSOR_ID = "PILA_1"  # Cambiar según tu sensor
    INTERVAL = 30  # Segundos entre lecturas
    
    # Crear cliente
    client = TemperatureSensorClient(SERVER_URL, STATUS_URL)
    
    # Verificar conexión inicial
    if not client.check_server_status():
        print("❌ No se puede conectar al servidor. Verifica que esté ejecutándose.")
        return
    
    print(f"✅ Conectado al servidor: {SERVER_URL}")
    print(f"🔧 Sensor ID: {SENSOR_ID}")
    print(f"⏱️  Intervalo: {INTERVAL} segundos")
    print("\nPresiona Ctrl+C para detener el monitoreo\n")
    
    # Iniciar monitoreo
    client.run_continuous_monitoring(SENSOR_ID, INTERVAL)

if __name__ == "__main__":
    main()
