#!/usr/bin/env python3
"""
Cliente MQTT para Raspberry Pi
Envía datos de sensores al broker MQTT del backend.

Instalación:
sudo pip3 install paho-mqtt

Uso:
python3 raspberry_mqtt_client.py
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import logging
from datetime import datetime

# Configuración
MQTT_BROKER = "192.168.0.21"  # IP del backend
MQTT_PORT = 1883
MQTT_USERNAME = None  # Si tienes autenticación
MQTT_PASSWORD = None  # Si tienes autenticación

# Configuración del sensor
SENSOR_ID = 1  # ID del sensor en la base de datos
AREA_TYPE = "guardiola-1"  # Tipo de área
AREA_ID = 1  # ID del área
SENSOR_TYPE = "temperature"  # temperature, humidity, ph

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RaspberryMQTTClient:
    def __init__(self, broker, port=1883, username=None, password=None):
        self.broker = broker
        self.port = port
        self.username = username
        self.password = password
        self.client = None
        self.is_connected = False
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback cuando se conecta al broker"""
        if rc == 0:
            self.is_connected = True
            logger.info("✅ Conectado al broker MQTT")
        else:
            self.is_connected = False
            logger.error(f"❌ Error de conexión: {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback cuando se desconecta del broker"""
        self.is_connected = False
        logger.warning("⚠️ Desconectado del broker MQTT")
    
    def on_publish(self, client, userdata, mid):
        """Callback cuando publica un mensaje"""
        logger.debug(f"📤 Mensaje publicado: {mid}")
    
    def connect(self):
        """Conectar al broker MQTT"""
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_publish = self.on_publish
        
        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)
        
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            time.sleep(1)  # Esperar a que se conecte
            return self.is_connected
        except Exception as e:
            logger.error(f"❌ Error conectando: {e}")
            return False
    
    def disconnect(self):
        """Desconectar del broker"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("👋 Desconectado del broker")
    
    def publish_sensor_reading(self, sensor_id, area_type, value, unit="°C"):
        """Publicar lectura de sensor"""
        if not self.is_connected:
            logger.error("❌ No conectado al broker")
            return False
        
        topic = f"beneficio/{area_type}/sensor/{sensor_id}/{SENSOR_TYPE}"
        
        payload = {
            "v": value,
            "u": unit,
            "t": datetime.now().isoformat(),
            "s": "OK"
        }
        
        try:
            result = self.client.publish(topic, json.dumps(payload), qos=1)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"📤 Enviado: {topic} = {value}{unit}")
                return True
            else:
                logger.error(f"❌ Error publicando: {result.rc}")
                return False
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            return False
    
    def read_real_sensor(self):
        """
        Lee el sensor real (MAX6675, DHT22, etc.)
        Reemplazar con tu código real del sensor
        """
        # CÓDIGO EJEMPLO PARA MAX6675:
        # import max6675
        # cs = 8
        # sck = 11
        # so = 9
        # sensor = max6675.MAX6675(sck, cs, so)
        # temp = sensor.read_temp()
        # return temp
        
        # SIMULACIÓN (eliminar cuando uses sensor real)
        base_temp = 25.0
        variation = random.uniform(-3, 3)
        temp = base_temp + variation
        
        # Simular ocasionalmente temperatura alta
        if random.random() < 0.1:
            temp = random.uniform(40, 55)
        
        return round(temp, 2)
    
    def run_continuous_monitoring(self, sensor_id, area_type, interval=30):
        """Monitoreo continuo del sensor"""
        logger.info(f"🚀 Iniciando monitoreo del sensor {sensor_id}")
        logger.info(f"📍 Área: {area_type}")
        logger.info(f"📡 Enviando cada {interval} segundos")
        
        while True:
            try:
                if not self.is_connected:
                    logger.warning("⚠️ No conectado, reintentando...")
                    self.connect()
                    time.sleep(5)
                    continue
                
                # Leer sensor
                temperature = self.read_real_sensor()
                
                # Publicar al broker MQTT
                success = self.publish_sensor_reading(
                    sensor_id=sensor_id,
                    area_type=area_type,
                    value=temperature,
                    unit="°C"
                )
                
                if success:
                    status = "WARNING" if temperature >= 40 else "OK"
                    logger.info(f"📊 Sensor {sensor_id}: {temperature}°C ({status})")
                else:
                    logger.error(f"❌ Error enviando datos")
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                logger.info("🛑 Detenido por el usuario")
                break
            except Exception as e:
                logger.error(f"❌ Error: {e}")
                time.sleep(5)

def main():
    print("🌡️  Cliente MQTT Raspberry Pi - Beneficio de Café")
    print("=" * 60)
    
    # Crear cliente MQTT
    client = RaspberryMQTTClient(
        broker=MQTT_BROKER,
        port=MQTT_PORT,
        username=MQTT_USERNAME,
        password=MQTT_PASSWORD
    )
    
    # Conectar al broker
    if not client.connect():
        print(f"❌ No se pudo conectar al broker: {MQTT_BROKER}:{MQTT_PORT}")
        return
    
    print(f"✅ Conectado al broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"🔧 Sensor ID: {SENSOR_ID}")
    print(f"📍 Área: {AREA_TYPE}")
    print(f"⏱️  Intervalo: 30 segundos")
    print("\nPresiona Ctrl+C para detener\n")
    
    # Iniciar monitoreo
    try:
        client.run_continuous_monitoring(SENSOR_ID, AREA_TYPE, interval=30)
    finally:
        client.disconnect()

if __name__ == "__main__":
    main()

