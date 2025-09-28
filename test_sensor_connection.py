#!/usr/bin/env python3
"""
Script de prueba para verificar la conexión con el servidor de sensores
Ejecutar desde tu computadora para probar que el backend funciona
"""

import requests
import json
from datetime import datetime

# Configuración
SERVER_URL = "http://localhost:8000/api/v1/sensors/data/"
STATUS_URL = "http://localhost:8000/api/v1/sensors/status/"

def test_server_status():
    """Probar si el servidor está disponible"""
    try:
        response = requests.get(STATUS_URL, timeout=5)
        if response.status_code == 200:
            print("✅ Servidor disponible")
            print(f"📊 Respuesta: {response.json()}")
            return True
        else:
            print(f"❌ Servidor respondió con código: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Error conectando al servidor: {e}")
        return False

def test_sensor_data():
    """Probar envío de datos de sensor"""
    test_data = {
        "sensor_id": "PILA_1",
        "temperature": 42.5,
        "timestamp": datetime.now().isoformat(),
        "location": "Pila de Secado 1",
        "status": "WARNING"
    }
    
    try:
        response = requests.post(
            SERVER_URL,
            json=test_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Datos de sensor enviados correctamente")
            print(f"📊 Respuesta: {response.json()}")
            return True
        else:
            print(f"❌ Error enviando datos: {response.status_code}")
            print(f"📄 Respuesta: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False

def main():
    """Función principal"""
    print("🧪 Prueba de Conexión con Servidor de Sensores")
    print("=" * 50)
    
    # Probar estado del servidor
    print("\n1. Probando estado del servidor...")
    if not test_server_status():
        print("❌ No se puede conectar al servidor")
        return
    
    # Probar envío de datos
    print("\n2. Probando envío de datos de sensor...")
    if test_sensor_data():
        print("\n✅ ¡Todas las pruebas pasaron!")
        print("🚀 El servidor está listo para recibir datos del Raspberry Pi")
    else:
        print("\n❌ Error en el envío de datos")

if __name__ == "__main__":
    main()
