#!/usr/bin/env python3
"""
Aplicación de Escritorio - Cliente de Báscula
Interfaz gráfica para monitoreo en tiempo real
API Beneficio - Sistema de monitoreo automático
"""

import serial
import serial.tools.list_ports
import time
import requests
import json
from datetime import datetime
import logging
import os
import platform
import sys
import threading
import queue
from tkinter import *
from tkinter import ttk, scrolledtext

# Detectar sistema operativo
SISTEMA_OPERATIVO = platform.system()
ES_WINDOWS = SISTEMA_OPERATIVO == 'Windows'

# Configurar logging
if ES_WINDOWS:
    log_dir = os.environ.get('LOG_DIR', os.path.join(os.path.expanduser('~'), 'logs', 'bascula'))
else:
    log_dir = os.environ.get('LOG_DIR', '/var/log/bascula')

try:
    os.makedirs(log_dir, exist_ok=True)
except PermissionError:
    log_dir = os.path.join(os.path.expanduser('~'), 'logs', 'bascula')
    os.makedirs(log_dir, exist_ok=True)

log_file = os.path.join(log_dir, 'bascula_camionera_gui.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# === Configuración ===
# El archivo de configuración se guarda en el mismo directorio del script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "bascula_config.json")

# Valores por defecto
DEFAULT_BASCULA = 'bascula camionera'
BASCULAS_DISPONIBLES = ['bascula camionera', 'bascula transformacion', 'bascula especial']

if ES_WINDOWS:
    DEFAULT_SERIAL_PORT = 'COM1'
else:
    DEFAULT_SERIAL_PORT = '/dev/ttyUSB0'

SERIAL_BAUDRATE = int(os.environ.get('SERIAL_BAUDRATE', '9600'))
SERIAL_TIMEOUT = 1
INTERVALO_LECTURA = 2

def load_config():
    """Cargar configuración guardada"""
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                return {
                    'bascula': config.get('bascula', DEFAULT_BASCULA),
                    'serial_port': config.get('serial_port', DEFAULT_SERIAL_PORT)
                }
    except Exception as e:
        logger.warning(f"No se pudo cargar configuración: {e}")
    return {
        'bascula': DEFAULT_BASCULA,
        'serial_port': DEFAULT_SERIAL_PORT
    }

def save_config(bascula, serial_port):
    """Guardar configuración"""
    try:
        config = {
            'bascula': bascula,
            'serial_port': serial_port
        }
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        logger.info(f"Configuración guardada: {bascula} - {serial_port}")
    except Exception as e:
        logger.error(f"Error guardando configuración: {e}")

def get_available_ports():
    """Obtener lista de puertos seriales disponibles"""
    ports = []
    if ES_WINDOWS:
        # En Windows, usar serial.tools.list_ports
        available_ports = serial.tools.list_ports.comports()
        ports = [port.device for port in available_ports]
    else:
        # En Linux, buscar /dev/ttyUSB* y /dev/ttyACM*
        import glob
        ports = glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*') + glob.glob('/dev/ttyAMA*')
        ports.sort()
    return ports

# === Configuración de la API ===
API_BASE_URL = "http://68.183.155.4:8000"
API_ENDPOINT = f"{API_BASE_URL}/api/v1/sensors/bascula/recibir/"
API_USERNAME = "laptop"
API_PASSWORD = "beneficiob2"

class BasculaApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Cliente de Báscula - Monitoreo en Tiempo Real")
        self.root.geometry("800x750")
        self.root.resizable(True, True)
        
        # Cargar configuración guardada
        config = load_config()
        self.bascula_nombre = config['bascula']
        self.serial_port = config['serial_port']
        
        # Variables de estado
        self.serial_connected = False
        self.server_connected = False
        self.ultimo_peso_recibido = None
        self.ultimo_peso_enviado = None
        self.ultima_fecha_envio = None
        self.estado_envio = "Esperando..."  # "Éxito", "Error", "Esperando..."
        self.contador_envios = 0
        self.contador_errores = 0
        self.serial_port_obj = None
        self.running = False
        
        # Queue para comunicación entre threads
        self.message_queue = queue.Queue()
        
        # Configurar interfaz
        self.setup_ui()
        
        # Iniciar procesamiento de mensajes
        self.process_messages()
        
    def setup_ui(self):
        """Configurar la interfaz gráfica"""
        
        # Frame principal
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(W, E, N, S))
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        
        # === Título ===
        title_label = Label(main_frame, text="⚖️ Cliente de Báscula", 
                           font=("Arial", 18, "bold"))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 10))
        
        # === Configuración (Selectores) ===
        config_frame = ttk.LabelFrame(main_frame, text="Configuración", padding="10")
        config_frame.grid(row=1, column=0, columnspan=2, sticky=(W, E), pady=5)
        
        # Selector de Báscula
        Label(config_frame, text="Báscula:", font=("Arial", 10)).grid(row=0, column=0, sticky=W, padx=5, pady=5)
        self.bascula_var = StringVar(value=self.bascula_nombre)
        self.bascula_combo = ttk.Combobox(config_frame, textvariable=self.bascula_var, 
                                          values=BASCULAS_DISPONIBLES, state="readonly", 
                                          width=25, font=("Arial", 10))
        self.bascula_combo.grid(row=0, column=1, sticky=W, padx=5, pady=5)
        self.bascula_combo.bind('<<ComboboxSelected>>', self.on_bascula_change)
        
        # Selector de Puerto Serial
        Label(config_frame, text="Puerto Serial:", font=("Arial", 10)).grid(row=1, column=0, sticky=W, padx=5, pady=5)
        
        # Obtener puertos disponibles
        available_ports = get_available_ports()
        if not available_ports:
            available_ports = [self.serial_port] if self.serial_port else [DEFAULT_SERIAL_PORT]
        
        # Si el puerto guardado no está en la lista, agregarlo
        if self.serial_port not in available_ports:
            available_ports.insert(0, self.serial_port)
        
        self.port_var = StringVar(value=self.serial_port)
        self.port_combo = ttk.Combobox(config_frame, textvariable=self.port_var, 
                                       values=available_ports, state="readonly",
                                       width=25, font=("Arial", 10))
        self.port_combo.grid(row=1, column=1, sticky=W, padx=5, pady=5)
        self.port_combo.bind('<<ComboboxSelected>>', self.on_port_change)
        
        # Botón para refrescar puertos
        refresh_btn = Button(config_frame, text="🔄 Refrescar Puertos", 
                            command=self.refresh_ports, font=("Arial", 9))
        refresh_btn.grid(row=1, column=2, padx=5, pady=5)
        
        # Label de información (mostrar valores actuales)
        info_label = Label(config_frame, text="ℹ️ La configuración se guarda automáticamente", 
                          font=("Arial", 8), fg="gray")
        info_label.grid(row=2, column=0, columnspan=3, pady=5)
        
        # === Estados de Conexión ===
        status_frame = ttk.LabelFrame(main_frame, text="Estados de Conexión", padding="10")
        status_frame.grid(row=2, column=0, columnspan=2, sticky=(W, E), pady=5)
        
        Label(status_frame, text="Serial:", font=("Arial", 10)).grid(row=0, column=0, sticky=W, padx=5)
        self.serial_status = Label(status_frame, text="Desconectado", 
                                   font=("Arial", 10, "bold"), fg="red")
        self.serial_status.grid(row=0, column=1, sticky=W, padx=5)
        
        Label(status_frame, text="Servidor:", font=("Arial", 10)).grid(row=1, column=0, sticky=W, padx=5)
        self.server_status = Label(status_frame, text="Desconectado", 
                                   font=("Arial", 10, "bold"), fg="red")
        self.server_status.grid(row=1, column=1, sticky=W, padx=5)
        
        # === Último Peso Recibido ===
        peso_recibido_frame = ttk.LabelFrame(main_frame, text="Último Peso Recibido", padding="10")
        peso_recibido_frame.grid(row=3, column=0, columnspan=2, sticky=(W, E), pady=5)
        
        self.peso_recibido_label = Label(peso_recibido_frame, text="--", 
                                         font=("Arial", 24, "bold"), fg="darkblue")
        self.peso_recibido_label.grid(row=0, column=0, pady=5)
        
        Label(peso_recibido_frame, text="quintales", font=("Arial", 12)).grid(row=0, column=1, padx=5)
        
        self.peso_estado_label = Label(peso_recibido_frame, text="Esperando datos...", 
                                       font=("Arial", 10), fg="gray")
        self.peso_estado_label.grid(row=1, column=0, columnspan=2, pady=5)
        
        # === Último Peso Enviado ===
        peso_enviado_frame = ttk.LabelFrame(main_frame, text="Último Peso Enviado", padding="10")
        peso_enviado_frame.grid(row=4, column=0, columnspan=2, sticky=(W, E), pady=5)
        
        self.peso_enviado_label = Label(peso_enviado_frame, text="--", 
                                        font=("Arial", 20, "bold"), fg="green")
        self.peso_enviado_label.grid(row=0, column=0, pady=5)
        
        Label(peso_enviado_frame, text="quintales", font=("Arial", 12)).grid(row=0, column=1, padx=5)
        
        self.fecha_envio_label = Label(peso_enviado_frame, text="--", 
                                       font=("Arial", 9), fg="gray")
        self.fecha_envio_label.grid(row=1, column=0, columnspan=2, pady=2)
        
        self.estado_envio_label = Label(peso_enviado_frame, text="Esperando...", 
                                        font=("Arial", 10, "bold"), fg="gray")
        self.estado_envio_label.grid(row=2, column=0, columnspan=2, pady=2)
        
        # === Estadísticas ===
        stats_frame = ttk.LabelFrame(main_frame, text="Estadísticas", padding="10")
        stats_frame.grid(row=5, column=0, columnspan=2, sticky=(W, E), pady=5)
        
        Label(stats_frame, text="Envíos exitosos:", font=("Arial", 10)).grid(row=0, column=0, sticky=W, padx=5)
        self.contador_envios_label = Label(stats_frame, text="0", 
                                           font=("Arial", 10, "bold"), fg="green")
        self.contador_envios_label.grid(row=0, column=1, sticky=W, padx=5)
        
        Label(stats_frame, text="Errores:", font=("Arial", 10)).grid(row=1, column=0, sticky=W, padx=5)
        self.contador_errores_label = Label(stats_frame, text="0", 
                                            font=("Arial", 10, "bold"), fg="red")
        self.contador_errores_label.grid(row=1, column=1, sticky=W, padx=5)
        
        # === Registro de Actividad ===
        log_frame = ttk.LabelFrame(main_frame, text="Registro de Actividad", padding="10")
        log_frame.grid(row=6, column=0, columnspan=2, sticky=(W, E, N, S), pady=5)
        main_frame.rowconfigure(6, weight=1)
        main_frame.columnconfigure(0, weight=1)
        
        self.log_text = scrolledtext.ScrolledText(log_frame, height=10, width=80, 
                                                  font=("Consolas", 9))
        self.log_text.grid(row=0, column=0, sticky=(W, E, N, S))
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
        # Botón de inicio/detener
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=7, column=0, columnspan=2, pady=10)
        
        self.start_button = Button(button_frame, text="▶ Iniciar Monitoreo", 
                                   command=self.toggle_monitoring, 
                                   bg="#4CAF50", fg="white", font=("Arial", 12, "bold"),
                                   padx=20, pady=5)
        self.start_button.pack(side=LEFT, padx=5)
        
        # Agregar log inicial
        self.add_log(f"Aplicación iniciada.")
        self.add_log(f"Báscula configurada: {self.bascula_nombre}")
        self.add_log(f"Puerto serial configurado: {self.serial_port}")
        self.add_log("Presiona 'Iniciar Monitoreo' para comenzar.")
        
    def on_bascula_change(self, event=None):
        """Manejador cuando cambia la selección de báscula"""
        nueva_bascula = self.bascula_var.get()
        if nueva_bascula != self.bascula_nombre:
            self.bascula_nombre = nueva_bascula
            save_config(self.bascula_nombre, self.serial_port)
            self.add_log(f"Báscula cambiada a: {self.bascula_nombre}")
            
    def on_port_change(self, event=None):
        """Manejador cuando cambia la selección de puerto"""
        nuevo_puerto = self.port_var.get()
        if nuevo_puerto != self.serial_port:
            self.serial_port = nuevo_puerto
            save_config(self.bascula_nombre, self.serial_port)
            self.add_log(f"Puerto serial cambiado a: {self.serial_port}")
            
    def refresh_ports(self):
        """Refrescar lista de puertos disponibles"""
        available_ports = get_available_ports()
        if not available_ports:
            available_ports = [self.serial_port] if self.serial_port else [DEFAULT_SERIAL_PORT]
        
        # Si el puerto actual no está en la lista, agregarlo
        if self.serial_port not in available_ports:
            available_ports.insert(0, self.serial_port)
            
        self.port_combo['values'] = available_ports
        self.add_log(f"Puertos disponibles actualizados: {len(available_ports)} encontrados")
        
    def add_log(self, message):
        """Agregar mensaje al registro"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}\n"
        self.log_text.insert(END, log_message)
        self.log_text.see(END)
        
    def process_messages(self):
        """Procesar mensajes de la queue (desde el thread de monitoreo)"""
        try:
            while True:
                message = self.message_queue.get_nowait()
                msg_type = message.get('type')
                
                if msg_type == 'peso_recibido':
                    peso = message.get('peso')
                    es_estable = message.get('es_estable')
                    self.update_peso_recibido(peso, es_estable)
                    
                elif msg_type == 'peso_enviado':
                    peso = message.get('peso')
                    exito = message.get('exito')
                    self.update_peso_enviado(peso, exito)
                    
                elif msg_type == 'serial_status':
                    connected = message.get('connected')
                    self.update_serial_status(connected)
                    
                elif msg_type == 'server_status':
                    connected = message.get('connected')
                    self.update_server_status(connected)
                    
                elif msg_type == 'log':
                    self.add_log(message.get('message'))
                    
        except queue.Empty:
            pass
        
        # Programar siguiente verificación
        self.root.after(100, self.process_messages)
        
    def update_peso_recibido(self, peso, es_estable):
        """Actualizar display del peso recibido"""
        self.ultimo_peso_recibido = peso
        self.peso_recibido_label.config(text=f"{peso:.2f}")
        
        if es_estable:
            self.peso_estado_label.config(text="✓ Peso estable - Listo para enviar", fg="green")
        else:
            self.peso_estado_label.config(text="⏳ Peso moviéndose - Esperando estabilización", fg="orange")
            
    def update_peso_enviado(self, peso, exito):
        """Actualizar display del peso enviado"""
        self.ultimo_peso_enviado = peso
        self.peso_enviado_label.config(text=f"{peso:.2f}")
        self.ultima_fecha_envio = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.fecha_envio_label.config(text=f"Enviado: {self.ultima_fecha_envio}")
        
        if exito:
            self.estado_envio = "Éxito"
            self.estado_envio_label.config(text="✓ Enviado exitosamente", fg="green")
            self.contador_envios += 1
            self.contador_envios_label.config(text=str(self.contador_envios))
        else:
            self.estado_envio = "Error"
            self.estado_envio_label.config(text="✗ Error al enviar", fg="red")
            self.contador_errores += 1
            self.contador_errores_label.config(text=str(self.contador_errores))
            
    def update_serial_status(self, connected):
        """Actualizar estado de conexión serial"""
        self.serial_connected = connected
        if connected:
            self.serial_status.config(text="✓ Conectado", fg="green")
        else:
            self.serial_status.config(text="✗ Desconectado", fg="red")
            
    def update_server_status(self, connected):
        """Actualizar estado de conexión al servidor"""
        self.server_connected = connected
        if connected:
            self.server_status.config(text="✓ Conectado", fg="green")
        else:
            self.server_status.config(text="✗ Desconectado", fg="red")
            
    def toggle_monitoring(self):
        """Iniciar o detener el monitoreo"""
        if not self.running:
            self.start_monitoring()
        else:
            self.stop_monitoring()
            
    def start_monitoring(self):
        """Iniciar monitoreo en thread separado"""
        # Verificar que hay configuración válida
        if not self.bascula_nombre:
            self.add_log("ERROR: Debe seleccionar una báscula")
            return
        if not self.serial_port:
            self.add_log("ERROR: Debe seleccionar un puerto serial")
            return
            
        # Guardar configuración antes de iniciar
        save_config(self.bascula_nombre, self.serial_port)
        
        self.running = True
        self.start_button.config(text="⏸ Detener Monitoreo", bg="#f44336")
        
        # Deshabilitar selectores mientras está corriendo
        self.bascula_combo.config(state="disabled")
        self.port_combo.config(state="disabled")
        
        self.add_log("=" * 50)
        self.add_log("Iniciando monitoreo...")
        self.add_log(f"Báscula: {self.bascula_nombre}")
        self.add_log(f"Puerto: {self.serial_port}")
        self.add_log("=" * 50)
        
        # Iniciar thread de monitoreo
        monitor_thread = threading.Thread(target=self.monitoring_loop, daemon=True)
        monitor_thread.start()
        
    def stop_monitoring(self):
        """Detener monitoreo"""
        self.running = False
        self.start_button.config(text="▶ Iniciar Monitoreo", bg="#4CAF50")
        
        # Habilitar selectores cuando se detiene
        self.bascula_combo.config(state="readonly")
        self.port_combo.config(state="readonly")
        
        self.add_log("Monitoreo detenido.")
        
        if self.serial_port_obj and self.serial_port_obj.is_open:
            self.serial_port_obj.close()
            self.message_queue.put({'type': 'serial_status', 'connected': False})
            
    def monitoring_loop(self):
        """Loop principal de monitoreo (ejecuta en thread separado)"""
        ser = None
        
        try:
            # Usar el puerto seleccionado
            port_to_use = self.serial_port
            bascula_to_use = self.bascula_nombre
            
            # Intentar conectar al puerto serial
            self.message_queue.put({'type': 'log', 'message': f"Conectando a {port_to_use}..."})
            ser = serial.Serial(
                port=port_to_use,
                baudrate=SERIAL_BAUDRATE,
                timeout=SERIAL_TIMEOUT,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE
            )
            self.serial_port_obj = ser
            self.message_queue.put({'type': 'serial_status', 'connected': True})
            self.message_queue.put({'type': 'log', 'message': f"Conectado a {port_to_use} correctamente"})
            
            time.sleep(2)  # Esperar estabilización
            
            ultimo_peso_enviado = None
            
            while self.running:
                try:
                    # Leer dato del serial
                    if ser.in_waiting > 0:
                        dato = ser.readline().decode('utf-8', errors='ignore').strip()
                        peso, es_estable = self.parsear_peso(dato)
                        
                        if peso is not None:
                            self.message_queue.put({
                                'type': 'peso_recibido',
                                'peso': peso,
                                'es_estable': es_estable
                            })
                            
                            if es_estable:
                                # Solo enviar si el peso ha cambiado
                                if peso != ultimo_peso_enviado:
                                    self.message_queue.put({
                                        'type': 'log',
                                        'message': f"Peso estable detectado: {peso:.2f} quintales"
                                    })
                                    
                                    exito = self.enviar_datos_a_api(peso, bascula_to_use)
                                    ultimo_peso_enviado = peso if exito else ultimo_peso_enviado
                                    
                                    self.message_queue.put({
                                        'type': 'peso_enviado',
                                        'peso': peso,
                                        'exito': exito
                                    })
                                    self.message_queue.put({
                                        'type': 'server_status',
                                        'connected': exito
                                    })
                                    
                    time.sleep(INTERVALO_LECTURA)
                    
                except Exception as e:
                    self.message_queue.put({
                        'type': 'log',
                        'message': f"Error en lectura: {str(e)}"
                    })
                    time.sleep(5)
                    
        except serial.SerialException as e:
            self.message_queue.put({
                'type': 'log',
                'message': f"Error conectando al puerto serial: {str(e)}"
            })
            self.message_queue.put({'type': 'serial_status', 'connected': False})
            # Re-habilitar selectores si hay error
            self.root.after(100, lambda: self.bascula_combo.config(state="readonly"))
            self.root.after(100, lambda: self.port_combo.config(state="readonly"))
        except Exception as e:
            self.message_queue.put({
                'type': 'log',
                'message': f"Error inesperado: {str(e)}"
            })
        finally:
            if ser and ser.is_open:
                ser.close()
            self.message_queue.put({'type': 'serial_status', 'connected': False})
            self.running = False
            # Re-habilitar selectores cuando termina
            self.root.after(100, lambda: self.bascula_combo.config(state="readonly"))
            self.root.after(100, lambda: self.port_combo.config(state="readonly"))
            
    def parsear_peso(self, dato):
        """Parsear el dato del reloj digital"""
        if not dato:
            return None, False
        
        dato = dato.strip()
        if len(dato) < 2:
            return None, False
        
        ultimo_caracter = dato[-1].upper()
        if ultimo_caracter not in ['G', 'M']:
            return None, False
        
        numero_str = dato[:-1].strip()
        if not numero_str.isdigit():
            return None, False
        
        peso_entero = int(numero_str)
        peso_quintales = peso_entero / 100.0
        es_estable = (ultimo_caracter == 'G')
        
        return peso_quintales, es_estable
        
    def enviar_datos_a_api(self, peso, bascula_nombre):
        """Enviar datos al servidor"""
        datos = {
            "bascula_nombre": bascula_nombre,
            "peso_quintales": peso,
            "tipo": "bascula"
        }
        
        try:
            response = requests.post(
                API_ENDPOINT,
                json=datos,
                auth=(API_USERNAME, API_PASSWORD),
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.status_code == 201:
                return True
            else:
                self.message_queue.put({
                    'type': 'log',
                    'message': f"Error del servidor: {response.status_code} - {response.text}"
                })
                return False
                
        except requests.exceptions.RequestException as e:
            self.message_queue.put({
                'type': 'log',
                'message': f"Error de conexión: {str(e)}"
            })
            return False
        except Exception as e:
            self.message_queue.put({
                'type': 'log',
                'message': f"Error inesperado: {str(e)}"
            })
            return False
            
    def on_closing(self):
        """Manejar cierre de la ventana"""
        self.running = False
        if self.serial_port_obj and self.serial_port_obj.is_open:
            self.serial_port_obj.close()
        self.root.destroy()

def main():
    root = Tk()
    app = BasculaApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()

