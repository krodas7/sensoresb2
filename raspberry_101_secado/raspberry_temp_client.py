#!/usr/bin/env python3
"""
Cliente de sensores de temperatura para Raspberry Pi - Pilas de Secado
API Beneficio - Sistema de monitoreo automático
Raspberry Pi: 192.168.0.101
Sensores: Pilas de Secado 5 y 6 (MAX6675)
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
log_dir = os.environ.get('LOG_DIR', '/var/log/secado')
# Crear directorio de logs si no existe
try:
    os.makedirs(log_dir, exist_ok=True)
except PermissionError:
    fallback_dir = os.path.expanduser("~/logs/secado")
    os.makedirs(fallback_dir, exist_ok=True)
    print(f"[secado-temp-client] Advertencia: no se pudo crear {log_dir}, usando {fallback_dir}")
    log_dir = fallback_dir
log_file = os.path.join(log_dir, 'secado_temp_client.log')

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

# === Configuración de sensores MAX6675 - Pilas 5 y 6 ===
# Pines físicos de Raspberry Pi 4 Model B - Sensores conectados
SENSORES_TEMP = {
    "Pila de Secado 5": {"CS": 23, "bus": 0, "device": 0},  # Pin físico 16 - GPIO 23
    "Pila de Secado 6": {"CS": 25, "bus": 0, "device": 1},  # Pin físico 22 - GPIO 25
}

# === Configuración de la API ===
API_BASE_URL = "http://68.183.155.4:8000"  # IP del servidor sensoresb2
API_ENDPOINT = f"{API_BASE_URL}/api/v1/sensors/temperatura/recibir/"  # Endpoint para temperatura
API_USERNAME = "laptop"
API_PASSWORD = "beneficiob2"

# Intervalo entre mediciones (en segundos)
INTERVALO_MEDICION = 30  # 30 segundos

# Nota: No se usa SPI global - cada sensor tiene su propio SPI (método exitoso)

def leer_temperatura_max6675(cs_pin, bus=0, device=0):
    """Lee la temperatura del sensor MAX6675 usando la lógica exitosa de test_sensores_simple.py"""
    try:
        # Configurar SPI independiente para cada sensor (método exitoso)
        spi_temp = spidev.SpiDev()
        spi_temp.open(0, 0)
        spi_temp.max_speed_hz = 500000
        spi_temp.mode = 0
        
        # Configurar pin CS
        GPIO.setup(cs_pin, GPIO.OUT)
        GPIO.output(cs_pin, GPIO.HIGH)  # CS alto por defecto
        
        # Activar CS (bajo)
        GPIO.output(cs_pin, GPIO.LOW)
        time.sleep(0.001)
        
        # Leer datos
        raw = spi_temp.readbytes(2)
        
        # Desactivar CS (alto)
        GPIO.output(cs_pin, GPIO.HIGH)
        
        # Cerrar SPI inmediatamente (método exitoso)
        spi_temp.close()
        
        # Procesar datos
        valor = (raw[0] << 8) | raw[1]
        
        # Verificar termopar abierto
        if valor & 0x0004:
            logger.warning("⚠️ Termopar abierto o desconectado")
            return None
        
        # Calcular temperatura
        temperatura = (valor >> 3) * 0.25
        
        return round(temperatura, 2)
        
    except Exception as e:
        logger.error(f"Error leyendo temperatura: {e}")
        return None

def obtener_mediciones_temperatura():
    """Obtiene las mediciones de todos los sensores de temperatura"""
    mediciones = []
    
    for nombre, config in SENSORES_TEMP.items():
        try:
            logger.info(f"--- Midiendo {nombre} (CS={config['CS']}) ---")
            
            temperatura = leer_temperatura_max6675(
                config["CS"], 
                config["bus"], 
                config["device"]
            )
            
            if temperatura is None:
                logger.error(f"{nombre}: Error en la lectura - sensor no responde")
                continue
            
            # Validar rango de temperatura (-40°C a 200°C es rango válido para MAX6675)
            if temperatura < -40.0 or temperatura > 200.0:
                logger.warning(f"{nombre}: Temperatura fuera de rango ({temperatura}°C) - posible error de lectura")
                # Intentar segunda lectura
                time.sleep(0.2)
                temperatura = leer_temperatura_max6675(
                    config["CS"], 
                    config["bus"], 
                    config["device"]
                )
                if temperatura is None or temperatura < -40.0 or temperatura > 200.0:
                    logger.error(f"{nombre}: Segunda lectura también falló - SALTANDO")
                    continue
            
            # Determinar estado basado en temperatura
            if temperatura >= 50.0:
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
            
            logger.info(f"{nombre}: ✅ Temperatura = {temperatura}°C | Estado = {estado}")
            
        except Exception as e:
            logger.error(f"{nombre}: ❌ Error inesperado - {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Pausa entre sensores para evitar interferencias (método exitoso)
        time.sleep(0.5)
    
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
        raspberry_ip = "192.168.0.101"  # IP de la Raspberry Pi de pilas de secado
    
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
            logger.info(f"Datos de pilas de secado enviados exitosamente: {response.json()}")
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
    logger.info("Iniciando cliente de sensores de pilas de secado para API de Beneficio")
    logger.info(f"Enviando datos cada {INTERVALO_MEDICION} segundos a {API_ENDPOINT}")
    logger.info("Raspberry Pi: 192.168.0.101 - Pilas de Secado 5-6")
    logger.info("Usando método exitoso: SPI independiente por sensor")
    
    try:
        while True:
            logger.info("--- Iniciando ciclo de medición de pilas de secado ---")
            
            # Obtener mediciones
            mediciones = obtener_mediciones_temperatura()
            
            if mediciones:
                # Enviar datos a la API
                if enviar_datos_a_api(mediciones):
                    logger.info("Ciclo de pilas de secado completado exitosamente")
                else:
                    logger.warning("Ciclo de pilas de secado completado con errores en el envío")
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
        # Limpiar GPIO (cada sensor maneja su propio SPI)
        GPIO.cleanup()

if __name__ == "__main__":
    main()



