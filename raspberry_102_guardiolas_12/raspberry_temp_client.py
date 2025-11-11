#!/usr/bin/env python3
"""
Cliente de sensores de temperatura para Raspberry Pi - Guardiolas 1-2 y Pilas 7-9
API Beneficio - Sistema de monitoreo automático
Raspberry Pi: 192.168.0.102
Sensores: Guardiolas 1-2 y Pilas de Secado 7, 8 y 9 (MAX6675)
"""

import RPi.GPIO as GPIO
import time
import requests
import json
from datetime import datetime
import logging
import spidev
import math
import socket

# Configurar logging
# Configurar directorio de logs
import os
log_dir = os.environ.get('LOG_DIR', '/var/log/guardiolas-12')
try:
    os.makedirs(log_dir, exist_ok=True)
except PermissionError:
    fallback_dir = os.path.expanduser("~/logs/guardiolas-12")
    os.makedirs(fallback_dir, exist_ok=True)
    print(f"[guardiolas-12] Advertencia: no se pudo crear {log_dir}, usando {fallback_dir}")
    log_dir = fallback_dir
log_file = os.path.join(log_dir, 'guardiolas_12_temp_client.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configurar el modo de numeración de pines
GPIO.setmode(GPIO.BCM)

# === Configuración de sensores MAX6675 - Guardiolas y Pilas ===
# Conexiones: VCC→3.3V, GND→Ground, SCK→GPIO11, SO→GPIO9, CS→GPIO (ver mapa)
SENSORES_TEMP = {
    "Guardiola 1": {"CS": 8, "bus": 0, "device": 0},     # Pin físico 24
    "Guardiola 2": {"CS": 7, "bus": 0, "device": 1},     # Pin físico 26
    "Pila de Secado 7": {"CS": 17, "bus": 0, "device": 2},  # Pin físico 11
    "Pila de Secado 8": {"CS": 27, "bus": 0, "device": 3},  # Pin físico 13
    "Pila de Secado 9": {"CS": 22, "bus": 0, "device": 4},  # Pin físico 15
}

# === Configuración de la API ===
# API pública del sistema sensoresb2
API_BASE_URL = "http://68.183.155.4:8000"  # IP pública del servidor sensoresb2
API_ENDPOINT = f"{API_BASE_URL}/api/v1/sensors/temperatura/recibir/"  # Endpoint para temperatura
API_USERNAME = "laptop"
API_PASSWORD = "beneficiob2"

# Intervalo entre mediciones (en segundos)
INTERVALO_MEDICION = 30  # 30 segundos

# Configurar SPI
spi = None

def setup_spi():
    """Configurar comunicación SPI para MAX6675"""
    global spi
    try:
        spi = spidev.SpiDev()
        spi.open(0, 0)  # Bus 0, Device 0
        spi.max_speed_hz = 500000  # 0.5 MHz es suficiente para MAX6675
        spi.mode = 0  # CPOL=0, CPHA=0
        logger.info("✅ SPI configurado correctamente para MAX6675")
        return True
    except Exception as e:
        logger.error(f"❌ Error configurando SPI: {e}")
        return False

def leer_temperatura_max6675(cs_pin, bus=0, device=0):
    """Lee la temperatura del sensor MAX6675"""
    try:
        # Configurar pin CS como salida
        GPIO.setup(cs_pin, GPIO.OUT)
        
        # Activar CS (bajo)
        GPIO.output(cs_pin, GPIO.LOW)
        time.sleep(0.001)  # Esperar 1ms
        
        # Leer 2 bytes desde SPI
        raw = spi.readbytes(2)  # [MSB, LSB]
        
        # Desactivar CS (alto)
        GPIO.output(cs_pin, GPIO.HIGH)
        
        # Combinar bytes
        val = (raw[0] << 8) | raw[1]
        
        # Verificar bit D2 (0x0004) - indica termopar abierto
        if val & 0x0004:
            logger.warning("⚠️ Termopar abierto o desconectado")
            return None
        
        # Extraer temperatura (bits D15..D3 con resolución 0.25°C)
        temperatura = (val >> 3) * 0.25
        
        return round(temperatura, 2)
        
    except Exception as e:
        logger.error(f"Error leyendo temperatura: {e}")
        return None

def obtener_mediciones_temperatura():
    """Obtiene las mediciones de todos los sensores de temperatura"""
    mediciones = []
    
    for nombre, config in SENSORES_TEMP.items():
        try:
            temperatura = leer_temperatura_max6675(
                config["CS"], 
                config["bus"], 
                config["device"]
            )
            
            if temperatura is None:
                logger.error(f"{nombre}: Error en la lectura")
                continue
            
            # Determinar estado basado en temperatura
            if temperatura >= 40.0:
                estado = "WARNING"
                logger.warning(f"{nombre}: Temperatura alta detectada: {temperatura}°C")
            elif temperatura <= -10.0:
                estado = "ERROR"
                logger.error(f"{nombre}: Temperatura muy baja: {temperatura}°C")
            else:
                estado = "OK"
            
            mediciones.append({
                "sensor": nombre,
                "temperatura": str(temperatura),
                "estado": estado
            })
            
            logger.info(f"{nombre}: Temperatura = {temperatura}°C | Estado = {estado}")
            
        except Exception as e:
            logger.error(f"{nombre}: Error inesperado - {e}")
    
    return mediciones

def enviar_datos_a_api(mediciones):
    """Envía las mediciones de temperatura a la API del servidor"""
    if not mediciones:
        logger.warning("No hay mediciones de temperatura para enviar")
        return False
    
    # Obtener la IP de esta Raspberry Pi
    try:
        # Conectar a un servidor externo para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        raspberry_ip = s.getsockname()[0]
        s.close()
    except:
        raspberry_ip = "192.168.0.102"  # IP de la Raspberry Pi de guardiolas y pilas
    
    # Preparar datos para enviar
    datos = {
        "raspberry_ip": raspberry_ip,
        "mediciones": mediciones,
        "tipo": "temperatura"
    }
    
    try:
        # Enviar datos a la API
        response = requests.post(
            API_ENDPOINT,
            json=datos,
            auth=(API_USERNAME, API_PASSWORD),
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 201:
            logger.info(f"Datos de guardiolas enviados exitosamente: {response.json()}")
            return True
        else:
            logger.error(f"Error al enviar datos: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de conexión con la API: {e}")
        return False
    except Exception as e:
        logger.error(f"Error inesperado al enviar datos: {e}")
        return False

def main():
    """Función principal del programa"""
    logger.info("Iniciando cliente de sensores de guardiolas 1-2 y pilas 7-9 para API de Beneficio")
    logger.info(f"Enviando datos cada {INTERVALO_MEDICION} segundos a {API_ENDPOINT}")
    logger.info("Raspberry Pi: 192.168.0.102 - Guardiolas 1-2 y Pilas de Secado 7-9")
    
    # Configurar SPI
    if not setup_spi():
        logger.error("No se pudo configurar SPI. Saliendo...")
        return
    
    try:
        while True:
            logger.info("--- Iniciando ciclo de medición de guardiolas y pilas ---")
            
            # Obtener mediciones
            mediciones = obtener_mediciones_temperatura()
            
            if mediciones:
                # Enviar datos a la API
                if enviar_datos_a_api(mediciones):
                    logger.info("Ciclo de guardiolas y pilas completado exitosamente")
                else:
                    logger.warning("Ciclo de guardiolas y pilas completado con errores en el envío")
            else:
                logger.warning("No se obtuvieron mediciones de temperatura válidas")
            
            # Esperar antes del siguiente ciclo
            logger.info(f"Esperando {INTERVALO_MEDICION} segundos para el siguiente ciclo...")
            time.sleep(INTERVALO_MEDICION)
            
    except KeyboardInterrupt:
        logger.info("Programa interrumpido por el usuario")
    except Exception as e:
        logger.error(f"Error inesperado en el programa principal: {e}")
    finally:
        logger.info("Finalizando...")
        # Cerrar SPI
        if spi:
            spi.close()
        GPIO.cleanup()

if __name__ == "__main__":
    main()


