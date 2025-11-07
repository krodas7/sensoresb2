#!/usr/bin/env python3
"""
Cliente de sensores de distancia para Raspberry Pi - Pilas de Fermentación
API Beneficio - Sistema de monitoreo automático
Raspberry Pi: 192.168.0.100
Sensores: 6 Pilas de Fermentación (HC-SR04)

Parámetros de medición:
- 265cm = Pila completamente vacía (0%)
- 105cm = Pila completamente llena (100%)
- Rango total: 160cm (265 - 105)

Estados de llenado:
- 0% - 10% = Vacío
- 11% - 75% = Llenando
- 76% - 100% = Lleno
"""

import RPi.GPIO as GPIO
import time
import requests
import json
from datetime import datetime
import logging
import socket

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fermentacion_sensor_client.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configurar el modo de numeración de pines
GPIO.setmode(GPIO.BCM)

# === Configuración de sensores de distancia ===
# NOTA: Configuración según README - Pines físicos conectados
SENSORES_DISTANCIA = {
    "Pila de Fermentación 1": {"TRIG": 23, "ECHO": 24},  # Pin 16 (GPIO23), Pin 18 (GPIO24)
    "Pila de Fermentación 2": {"TRIG": 17, "ECHO": 27},  # Pin 11 (GPIO17), Pin 13 (GPIO27)
    "Pila de Fermentación 3": {"TRIG": 22, "ECHO": 5},   # Pin 15 (GPIO22), Pin 29 (GPIO5)
    "Pila de Fermentación 4": {"TRIG": 6, "ECHO": 13},   # Pin 31 (GPIO6), Pin 33 (GPIO13)
    "Pila de Fermentación 5": {"TRIG": 19, "ECHO": 26},  # Pin 35 (GPIO19), Pin 37 (GPIO26)
    "Pila de Fermentación 6": {"TRIG": 16, "ECHO": 20}   # Pin 36 (GPIO16), Pin 38 (GPIO20)
}

# === Configuración de la API ===
API_BASE_URL = "http://192.168.0.150:8000"  # IP del servidor sensoresb2
API_ENDPOINT = f"{API_BASE_URL}/api/v1/sensors/medicion/recibir/"
API_USERNAME = "laptop"
API_PASSWORD = "beneficiob2"

# Intervalo entre mediciones (en segundos)
INTERVALO_MEDICION = 180  # 3 minutos

def medir_distancia(TRIG, ECHO):
    """Mide la distancia usando el sensor ultrasónico"""
    try:
        # Asegurarse de que el TRIG esté apagado
        GPIO.output(TRIG, False)
        time.sleep(0.05)

        # Enviar un pulso de 10us
        GPIO.output(TRIG, True)
        time.sleep(0.00001)
        GPIO.output(TRIG, False)

        # Esperar el inicio del pulso de eco
        timeout = time.time() + 0.04  # 40ms timeout
        pulso_inicio = time.time()  # Inicializar la variable
        while GPIO.input(ECHO) == 0:
            pulso_inicio = time.time()
            if time.time() > timeout:
                logger.warning("Timeout en inicio del pulso de eco")
                return None

        # Esperar el fin del pulso de eco
        timeout = time.time() + 0.04
        pulso_fin = time.time()  # Inicializar la variable
        while GPIO.input(ECHO) == 1:
            pulso_fin = time.time()
            if time.time() > timeout:
                logger.warning("Timeout en fin del pulso de eco")
                return None

        duracion = pulso_fin - pulso_inicio
        distancia = duracion * 17150
        return round(distancia, 2)
    
    except Exception as e:
        logger.error(f"Error al medir distancia: {e}")
        return None

def configurar_pines():
    """Configura todos los pines GPIO para los sensores"""
    for sensor, config in SENSORES_DISTANCIA.items():
        GPIO.setup(config["TRIG"], GPIO.OUT)
        GPIO.setup(config["ECHO"], GPIO.IN)
        logger.info(f"Pines configurados para {sensor}: TRIG={config['TRIG']}, ECHO={config['ECHO']}")

def determinar_estado(porcentaje):
    """Determina el estado de llenado basado en el porcentaje"""
    if porcentaje <= 10.0:
        return "Vacío"
    elif porcentaje <= 75.0:
        return "Llenando"
    else:
        return "Lleno"

def obtener_mediciones():
    """Obtiene las mediciones de todos los sensores de distancia"""
    mediciones = []
    
    for nombre, config in SENSORES_DISTANCIA.items():
        try:
            logger.info(f"--- Midiendo {nombre} (TRIG={config['TRIG']}, ECHO={config['ECHO']}) ---")
            
            # Asegurar que los pines están configurados correctamente
            GPIO.setup(config["TRIG"], GPIO.OUT)
            GPIO.setup(config["ECHO"], GPIO.IN)
            
            # Limpiar el pin TRIG antes de medir
            GPIO.output(config["TRIG"], False)
            time.sleep(0.1)  # Esperar 100ms entre sensores para evitar interferencia
            
            # Medir distancia
            distancia = medir_distancia(config["TRIG"], config["ECHO"])
            
            if distancia is None:
                logger.error(f"{nombre}: Error en la lectura - sensor no responde")
                continue
            
            # Validar rango de distancia (0-500cm es rango válido para HC-SR04)
            if distancia < 2.0 or distancia > 400.0:
                logger.warning(f"{nombre}: Distancia fuera de rango ({distancia} cm) - posible error de lectura")
                # Intentar segunda lectura
                time.sleep(0.2)
                distancia = medir_distancia(config["TRIG"], config["ECHO"])
                if distancia is None or distancia < 2.0 or distancia > 400.0:
                    logger.error(f"{nombre}: Segunda lectura también falló - SALTANDO")
                    continue
            
            # Calcular porcentaje de llenado
            # 265cm = 0% (completamente vacía)
            # 105cm = 100% (completamente llena)
            distancia_vacia = 265.0   # Distancia cuando está vacía (0%)
            distancia_llena = 105.0   # Distancia cuando está llena (100%)
            rango_total = distancia_vacia - distancia_llena  # 160cm
            
            if distancia >= distancia_vacia:
                porcentaje = 0.0  # Vacío
            elif distancia <= distancia_llena:
                porcentaje = 100.0  # Lleno
            else:
                # Fórmula: ((distancia_vacia - distancia_actual) / rango_total) * 100
                porcentaje = ((distancia_vacia - distancia) / rango_total) * 100
            
            # Determinar estado de llenado
            estado = determinar_estado(porcentaje)
            
            mediciones.append({
                "recipiente": nombre,
                "distancia": str(distancia),
                "estado": estado
            })
            
            logger.info(f"{nombre}: ✅ Distancia = {distancia} cm | Llenado = {porcentaje:.2f}% | Estado = {estado}")
            
        except Exception as e:
            logger.error(f"{nombre}: ❌ Error inesperado - {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
    
    return mediciones

def enviar_datos_a_api(mediciones):
    """Envía las mediciones de distancia a la API del servidor"""
    if not mediciones:
        logger.warning("No hay mediciones para enviar")
        return False
    
    # Obtener la IP de esta Raspberry Pi
    try:
        # Conectar a un servidor externo para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        raspberry_ip = s.getsockname()[0]
        s.close()
    except:
        raspberry_ip = "192.168.0.100"  # IP de la Raspberry Pi de fermentación
    
    # Preparar datos para enviar
    datos = {
        "raspberry_ip": raspberry_ip,
        "mediciones": mediciones
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
            logger.info(f"Datos de fermentación enviados exitosamente: {response.json()}")
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
    logger.info("Iniciando cliente de sensores de fermentación para API de Beneficio")
    logger.info(f"Enviando datos cada {INTERVALO_MEDICION} segundos a {API_ENDPOINT}")
    logger.info(f"Raspberry Pi: 192.168.0.100 - Pilas de Fermentación")
    
    # Configurar pines
    configurar_pines()
    
    try:
        while True:
            logger.info("--- Iniciando ciclo de medición de fermentación ---")
            
            # Obtener mediciones
            mediciones = obtener_mediciones()
            
            if mediciones:
                # Enviar datos a la API
                if enviar_datos_a_api(mediciones):
                    logger.info("Ciclo de fermentación completado exitosamente")
                else:
                    logger.warning("Ciclo de fermentación completado con errores en el envío")
            else:
                logger.warning("No se obtuvieron mediciones válidas")
            
            # Esperar antes del siguiente ciclo
            logger.info(f"Esperando {INTERVALO_MEDICION} segundos para el siguiente ciclo...")
            time.sleep(INTERVALO_MEDICION)
            
    except KeyboardInterrupt:
        logger.info("Programa interrumpido por el usuario")
    except Exception as e:
        logger.error(f"Error inesperado en el programa principal: {e}")
    finally:
        logger.info("Finalizando...")
        GPIO.cleanup()

if __name__ == "__main__":
    main()
