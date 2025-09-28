#!/usr/bin/env python3
"""
Script de prueba simple para verificar la conexión del sensor
"""

import requests
import time
from datetime import datetime

# Configuración
SERVER_URL = "http://192.168.0.16:8000/api/v1/sensors/data/"
SENSOR_ID = "PILA_1"

def test_server_connection():
    """Probar conexión al servidor"""
    try:
        status_url = SERVER_URL.replace('/data/', '/status/')
        print(f"🔍 Probando conexión a: {status_url}")
        
        response = requests.get(status_url, timeout=5)
        print(f"📡 Respuesta del servidor: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Servidor disponible")
            print(f"📊 Datos: {response.json()}")
            return True
        else:
            print(f"❌ Servidor no disponible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def send_test_data():
    """Enviar datos de prueba"""
    data = {
        "sensor_id": SENSOR_ID,
        "temperature": 25.5,
        "timestamp": datetime.now().isoformat(),
        "location": "Pila de Secado 1",
        "status": "TEST"
    }
    
    try:
        print(f"📤 Enviando datos de prueba: {data}")
        response = requests.post(
            SERVER_URL,
            json=data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📡 Respuesta: {response.status_code}")
        if response.status_code == 200:
            print("✅ Datos enviados correctamente")
            print(f"📊 Respuesta: {response.json()}")
            return True
        else:
            print(f"❌ Error enviando datos: {response.status_code}")
            print(f"📄 Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🧪 Prueba de Conexión del Sensor")
    print("=" * 40)
    
    # Probar conexión
    if test_server_connection():
        # Enviar datos de prueba
        send_test_data()
    else:
        print("💡 Verifica que:")
        print("   - El servidor Django esté corriendo")
        print("   - La IP sea correcta")
        print("   - No haya firewall bloqueando")

if __name__ == "__main__":
    main()
