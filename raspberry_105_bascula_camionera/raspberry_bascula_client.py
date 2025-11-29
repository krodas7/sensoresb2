#!/usr/bin/env python3
"""
Cliente de báscula - Báscula Camionera
API Beneficio - Sistema de monitoreo automático
Soporta: Raspberry Pi, Windows, Linux
Sensor: Reloj digital de báscula (comunicación serial)
"""

import serial
import time
import requests
import json
from datetime import datetime
import logging
import os
import platform
import sys

# Detectar sistema operativo
SISTEMA_OPERATIVO = platform.system()  # 'Windows', 'Linux', 'Darwin', etc.
ES_WINDOWS = SISTEMA_OPERATIVO == 'Windows'

# Configurar logging (rutas diferentes para Windows/Linux)
if ES_WINDOWS:
    log_dir = os.environ.get('LOG_DIR', os.path.join(os.path.expanduser('~'), 'logs', 'bascula'))
else:
    log_dir = os.environ.get('LOG_DIR', '/var/log/bascula')

try:
    os.makedirs(log_dir, exist_ok=True)
except PermissionError:
    fallback_dir = os.path.join(os.path.expanduser('~'), 'logs', 'bascula')
    os.makedirs(fallback_dir, exist_ok=True)
    print(f"[bascula-client] Advertencia: no se pudo crear {log_dir}, usando {fallback_dir}")
    log_dir = fallback_dir

log_file = os.path.join(log_dir, 'bascula_camionera_client.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# === Configuración de la báscula ===
# IMPORTANTE: Para usar con otra báscula, solo cambia este nombre:
# - "bascula camionera" (actual)
# - "bascula transformacion"
# - "bascula especial"
# O usa variable de entorno: export BASCULA_NOMBRE="bascula transformacion"
BASCULA_NOMBRE = os.environ.get('BASCULA_NOMBRE', 'bascula camionera')

# Detección automática del puerto serial según el sistema operativo
# En Windows: COM1, COM2, COM3, etc.
# En Linux: /dev/ttyUSB0, /dev/ttyAMA0, etc.
if ES_WINDOWS:
    SERIAL_PORT = os.environ.get('SERIAL_PORT', 'COM1')  # Puerto COM por defecto en Windows
else:
    SERIAL_PORT = os.environ.get('SERIAL_PORT', '/dev/ttyUSB0')  # Puerto por defecto en Linux

SERIAL_BAUDRATE = int(os.environ.get('SERIAL_BAUDRATE', '9600'))  # Velocidad de comunicación
SERIAL_TIMEOUT = 1  # Timeout en segundos

# === Configuración simplificada ===
# Solo necesitamos el nombre de la báscula, que ya está definido arriba en BASCULA_NOMBRE
# No se requiere información del dispositivo (raspberry, IP, etc.)

# === Configuración de la API ===
API_BASE_URL = "http://68.183.155.4:8000"  # IP del servidor sensoresb2
API_ENDPOINT = f"{API_BASE_URL}/api/v1/sensors/bascula/recibir/"  # Endpoint para báscula
API_USERNAME = "laptop"
API_PASSWORD = "beneficiob2"

# Intervalo entre intentos de lectura (en segundos)
INTERVALO_LECTURA = 2  # 2 segundos entre lecturas

def leer_dato_serial(ser):
    """
    Lee un dato del puerto serial
    Formato esperado: "3950G    " o "3950m    "
    - Termina en 'G': peso estable (enviar al servidor)
    - Termina en 'm': peso moviéndose (no enviar)
    """
    try:
        if ser.in_waiting > 0:
            # Leer línea completa
            linea = ser.readline().decode('utf-8', errors='ignore').strip()
            logger.debug(f"Dato crudo recibido: '{linea}'")
            return linea
        return None
    except Exception as e:
        logger.error(f"Error leyendo serial: {e}")
        return None

def parsear_peso(dato):
    """
    Parsea el dato del reloj digital
    Formato: "3950G    " o "3950m    "
    Retorna: (peso_en_quintales, es_estable) o (None, False) si es inválido
    """
    if not dato:
        return None, False
    
    # Limpiar espacios en blanco
    dato = dato.strip()
    
    # Verificar que tenga al menos un carácter
    if len(dato) < 2:
        return None, False
    
    # El último carácter indica si está estable ('G') o moviéndose ('m')
    ultimo_caracter = dato[-1].upper()
    
    if ultimo_caracter not in ['G', 'M']:
        logger.warning(f"Dato con formato desconocido: '{dato}' - último carácter: '{ultimo_caracter}'")
        return None, False
    
    # Extraer el número (todo excepto el último carácter)
    numero_str = dato[:-1].strip()
    
    # Verificar que sea un número
    if not numero_str.isdigit():
        logger.warning(f"Dato no contiene un número válido: '{dato}'")
        return None, False
    
    # Convertir a número entero (el reloj envía en gramos o décimas)
    # Ejemplo: 3950 = 39.50 quintales
    peso_entero = int(numero_str)
    
    # Convertir a quintales (asumiendo que 100 = 1.00 quintal)
    # Si el reloj envía 3950, significa 39.50 quintales
    peso_quintales = peso_entero / 100.0
    
    # Determinar si está estable
    es_estable = (ultimo_caracter == 'G')
    
    return peso_quintales, es_estable

def enviar_datos_a_api(peso, bascula_nombre):
    """
    Envía el peso de la báscula a la API del servidor.
    Solo se envía el nombre de la báscula y el peso - el servidor se encarga del resto.
    """
    if peso is None:
        logger.warning("No hay peso válido para enviar")
        return False
    
    # Preparar datos para enviar - solo lo esencial
    datos = {
        "bascula_nombre": bascula_nombre,
        "peso_quintales": peso,
        "tipo": "bascula"
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
            logger.info(f"Datos de báscula enviados exitosamente: {bascula_nombre} = {peso} quintales")
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
    logger.info("=" * 60)
    logger.info("Cliente de Báscula Camionera - API Beneficio")
    logger.info("=" * 60)
    logger.info(f"Sistema Operativo: {SISTEMA_OPERATIVO}")
    logger.info(f"Báscula: {BASCULA_NOMBRE}")
    logger.info(f"Puerto serial: {SERIAL_PORT} - Baudrate: {SERIAL_BAUDRATE}")
    logger.info(f"Enviando datos a: {API_ENDPOINT}")
    logger.info("=" * 60)
    
    # Inicializar puerto serial
    ser = None
    intentos_conexion = 0
    max_intentos = 5
    
    while intentos_conexion < max_intentos:
        try:
            ser = serial.Serial(
                port=SERIAL_PORT,
                baudrate=SERIAL_BAUDRATE,
                timeout=SERIAL_TIMEOUT,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE
            )
            logger.info(f"Conexión serial establecida en {SERIAL_PORT}")
            break
        except serial.SerialException as e:
            intentos_conexion += 1
            logger.error(f"Error conectando al puerto serial (intento {intentos_conexion}/{max_intentos}): {e}")
            if intentos_conexion < max_intentos:
                logger.info(f"Reintentando en 5 segundos...")
                time.sleep(5)
            else:
                logger.error("No se pudo conectar al puerto serial después de múltiples intentos")
                return
        except Exception as e:
            logger.error(f"Error inesperado al inicializar serial: {e}")
            return
    
    if ser is None:
        logger.error("No se pudo inicializar el puerto serial")
        return
    
    try:
        # Esperar un momento para que el puerto serial se estabilice
        time.sleep(2)
        
        ultimo_peso_enviado = None
        
        while True:
            try:
                # Leer dato del serial
                dato = leer_dato_serial(ser)
                
                if dato:
                    # Parsear el peso
                    peso, es_estable = parsear_peso(dato)
                    
                    if peso is not None:
                        if es_estable:
                            # Solo enviar si el peso ha cambiado desde la última vez
                            if peso != ultimo_peso_enviado:
                                logger.info(f"Peso estable detectado: {peso} quintales")
                                if enviar_datos_a_api(peso, BASCULA_NOMBRE):
                                    ultimo_peso_enviado = peso
                                    logger.info(f"✅ Peso enviado exitosamente: {peso} quintales")
                                else:
                                    logger.warning(f"⚠️ Error al enviar peso: {peso} quintales")
                            else:
                                logger.debug(f"Peso no ha cambiado: {peso} quintales (no se envía)")
                        else:
                            logger.debug(f"Peso moviéndose: {peso} quintales (no se envía - esperando estabilización)")
                    else:
                        logger.debug(f"Dato recibido pero no es un peso válido: '{dato}'")
                
                # Esperar antes de la siguiente lectura
                time.sleep(INTERVALO_LECTURA)
                
            except KeyboardInterrupt:
                logger.info("Programa interrumpido por el usuario")
                break
            except Exception as e:
                logger.error(f"Error inesperado en el ciclo principal: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                time.sleep(5)  # Esperar antes de reintentar
                
    finally:
        logger.info("Finalizando...")
        if ser and ser.is_open:
            ser.close()
            logger.info("Puerto serial cerrado")

if __name__ == "__main__":
    main()

