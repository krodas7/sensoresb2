#!/usr/bin/env python3
"""
Script de prueba para simular datos del sensor MAX6675
Envía datos de temperatura al servidor Django
"""

import requests
import json
import time
import random
from datetime import datetime

# Configuración
SERVER_URL = "http://192.168.0.5:8000/api/v1/sensors/data/"
SENSOR_ID = "PILA_1"  # Sensor que estamos probando
INTERVAL = 5  # Segundos entre envíos

def send_sensor_data(temperature, status="OK"):
    """Enviar datos del sensor al servidor"""
    data = {
        "sensor_id": SENSOR_ID,
        "temperature": temperature,
        "timestamp": datetime.now().isoformat(),
        "location": f"Pila de Secado {SENSOR_ID.split('_')[1]}",
        "status": status
    }
    
    try:
        response = requests.post(
            SERVER_URL,
            json=data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            print(f"✅ Datos enviados: {SENSOR_ID} = {temperature}°C ({status})")
            return True
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def simulate_temperature_cycle():
    """Simular un ciclo de temperatura que active el cronómetro"""
    print("🌡️ Simulando ciclo de temperatura para PILA_1")
    print("=" * 50)
    
    # Fase 1: Temperatura normal (20-35°C)
    print("📈 Fase 1: Calentamiento gradual...")
    for i in range(10):
        temp = 20 + (i * 1.5) + random.uniform(-1, 1)
        status = "OK"
        send_sensor_data(round(temp, 1), status)
        time.sleep(INTERVAL)
    
    # Fase 2: Temperatura alta (40-45°C) - Activa cronómetro
    print("🔥 Fase 2: Temperatura alta - Cronómetro activado...")
    for i in range(15):
        temp = 40 + random.uniform(-2, 3)
        status = "WARNING"
        send_sensor_data(round(temp, 1), status)
        time.sleep(INTERVAL)
    
    # Fase 3: Enfriamiento (35-20°C)
    print("❄️ Fase 3: Enfriamiento - Cronómetro desactivado...")
    for i in range(10):
        temp = 35 - (i * 1.5) + random.uniform(-1, 1)
        status = "OK" if temp < 40 else "WARNING"
        send_sensor_data(round(temp, 1), status)
        time.sleep(INTERVAL)

def main():
    """Función principal"""
    print("🧪 Simulador de Sensor MAX6675 - PILA_1")
    print("=" * 50)
    
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
        print(f"❌ No se puede conectar al servidor: {e}")
        return
    
    print(f"🔧 Sensor: {SENSOR_ID}")
    print(f"⏱️  Intervalo: {INTERVAL} segundos")
    print(f"🌐 Servidor: {SERVER_URL}")
    print("\nPresiona Ctrl+C para detener\n")
    
    try:
        # Simular ciclo de temperatura
        simulate_temperature_cycle()
        
        print("\n✅ Simulación completada")
        print("💡 Verifica en el frontend que PILA_1 muestre los datos correctamente")
        
    except KeyboardInterrupt:
        print("\n🛑 Simulación detenida por el usuario")

if __name__ == "__main__":
    main()
