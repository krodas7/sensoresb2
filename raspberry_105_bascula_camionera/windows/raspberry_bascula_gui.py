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
import re
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
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                config = json.load(f)
                bascula = config.get('bascula', DEFAULT_BASCULA)
                serial_port = config.get('serial_port', DEFAULT_SERIAL_PORT)
                logger.info(f"Configuración cargada: {bascula} - {serial_port}")
                return {
                    'bascula': bascula,
                    'serial_port': serial_port
                }
    except Exception as e:
        logger.warning(f"No se pudo cargar configuración: {e}")
    
    # Valores por defecto si no existe el archivo
    config_default = {
        'bascula': DEFAULT_BASCULA,
        'serial_port': DEFAULT_SERIAL_PORT
    }
    logger.info(f"Usando configuración por defecto: {config_default}")
    return config_default

def save_config(bascula, serial_port):
    """Guardar configuración - se guarda inmediatamente"""
    try:
        config = {
            'bascula': bascula,
            'serial_port': serial_port,
            'last_updated': datetime.now().isoformat()
        }
        # Asegurar que el directorio existe
        os.makedirs(os.path.dirname(CONFIG_FILE) if os.path.dirname(CONFIG_FILE) else '.', exist_ok=True)
        
        # Guardar con codificación UTF-8
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        logger.info(f"Configuración guardada exitosamente: {bascula} - {serial_port}")
        return True
    except Exception as e:
        logger.error(f"Error guardando configuración: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return False

def get_available_ports():
    """Obtener lista de puertos seriales disponibles"""
    ports = []
    if ES_WINDOWS:
        # En Windows, agregar siempre COM1 a COM10 (o más si es necesario)
        # Esto asegura que siempre haya opciones disponibles
        default_ports = [f'COM{i}' for i in range(1, 11)]  # COM1 a COM10
        
        # También obtener puertos realmente detectados
        try:
            detected_ports = [port.device for port in serial.tools.list_ports.comports()]
            # Combinar y eliminar duplicados, mantener orden
            all_ports = default_ports + detected_ports
            ports = []
            seen = set()
            for port in all_ports:
                if port not in seen:
                    ports.append(port)
                    seen.add(port)
        except:
            # Si hay error, usar solo los puertos por defecto
            ports = default_ports
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
        self.root.geometry("700x650")
        self.root.resizable(True, True)
        self.root.configure(bg='#f0f0f0')
        
        # Estilos modernos
        self.setup_styles()
        
        # Cargar configuración guardada
        config = load_config()
        self.bascula_nombre = config['bascula']
        self.serial_port = config['serial_port']
        
        # Variables de estado
        self.serial_connected = False
        self.server_connected = False
        self.ultimo_peso_recibido = None
        self.ultimo_timestamp_recibido = None  # Timestamp del último peso recibido
        self.ultimo_peso_enviado = None
        self.ultima_fecha_envio = None
        self.estado_envio = "Esperando..."  # "Éxito", "Error", "Esperando..."
        self.contador_envios = 0
        self.contador_errores = 0
        self.serial_port_obj = None
        self.running = False
        self.TIMEOUT_DATOS = 5  # Segundos sin datos para considerar timeout
        
        # Queue para comunicación entre threads
        self.message_queue = queue.Queue()
        
        # Configurar interfaz
        self.setup_ui()
        
        # Actualizar título con el nombre de la báscula
        self.update_title()
        
        # Iniciar procesamiento de mensajes
        self.process_messages()
        
        # Iniciar verificación de timeout
        self.check_timeout()
        
    def setup_styles(self):
        """Configurar estilos modernos"""
        self.colors = {
            'primary': '#2196F3',      # Azul principal
            'primary_dark': '#1976D2',  # Azul oscuro
            'success': '#4CAF50',      # Verde
            'error': '#F44336',        # Rojo
            'warning': '#FF9800',      # Naranja
            'bg_main': '#FFFFFF',      # Fondo principal
            'bg_secondary': '#F5F5F5', # Fondo secundario
            'text_primary': '#212121', # Texto principal
            'text_secondary': '#757575', # Texto secundario
            'border': '#E0E0E0',       # Borde
        }
        
    def update_title(self):
        """Actualizar título de la ventana con el nombre de la báscula"""
        bascula_display = self.bascula_nombre.replace('bascula ', '').title()
        self.root.title(f"⚖️ Báscula {bascula_display} - Monitoreo en Tiempo Real")
        
    def setup_ui(self):
        """Configurar la interfaz gráfica moderna"""
        
        # Frame principal con fondo
        main_frame = Frame(self.root, bg=self.colors['bg_main'])
        main_frame.pack(fill=BOTH, expand=True, padx=0, pady=0)
        
        # === Header Moderno (más compacto) ===
        header_frame = Frame(main_frame, bg=self.colors['primary'], height=60)
        header_frame.pack(fill=X, padx=0, pady=0)
        header_frame.pack_propagate(False)
        
        # Título principal en el header
        bascula_display = self.bascula_nombre.replace('bascula ', '').title()
        self.header_title = Label(header_frame, 
                           text=f"⚖️ Báscula {bascula_display}", 
                           font=("Segoe UI", 18, "bold"),
                           bg=self.colors['primary'],
                           fg='white')
        self.header_title.pack(side=LEFT, padx=15, pady=12)
        
        # Botón de configuración (engranaje) en el header
        config_btn = Button(header_frame, 
                           text="⚙️",
                           command=self.open_config_window,
                           font=("Segoe UI", 14),
                           bg=self.colors['primary'],
                           fg='white',
                           activebackground=self.colors['primary_dark'],
                           activeforeground='white',
                           border=0,
                           relief=FLAT,
                           cursor='hand2',
                           padx=12,
                           pady=8)
        config_btn.pack(side=RIGHT, padx=15, pady=10)
        
        # === Canvas con Scrollbar para contenido scrollable ===
        self.canvas = Canvas(main_frame, bg=self.colors['bg_main'], highlightthickness=0)
        scrollbar = ttk.Scrollbar(main_frame, orient="vertical", command=self.canvas.yview)
        
        # Contenedor principal con padding (dentro del canvas)
        content_frame = Frame(self.canvas, bg=self.colors['bg_main'])
        
        def update_scrollregion(event=None):
            self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        
        content_frame.bind("<Configure>", update_scrollregion)
        
        canvas_window = self.canvas.create_window((0, 0), window=content_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=scrollbar.set)
        
        # Actualizar ancho del canvas cuando cambie el tamaño de la ventana
        def configure_canvas_width(event):
            canvas_width = event.width
            self.canvas.itemconfig(canvas_window, width=canvas_width)
        self.canvas.bind('<Configure>', configure_canvas_width)
        
        self.canvas.pack(side=LEFT, fill=BOTH, expand=True)
        scrollbar.pack(side=RIGHT, fill=Y)
        
        # Permitir scroll con rueda del mouse
        def _on_mousewheel(event):
            self.canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        self.canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        # === Estados de Conexión (Diseño Moderno) ===
        status_frame = Frame(content_frame, bg=self.colors['bg_secondary'], relief=FLAT, bd=0)
        status_frame.pack(fill=X, pady=(12, 10), padx=15)
        
        # Título de la sección
        status_title = Label(status_frame, text="Estados de Conexión", 
                            font=("Segoe UI", 11, "bold"),
                            bg=self.colors['bg_secondary'],
                            fg=self.colors['text_primary'])
        status_title.pack(anchor=W, padx=10, pady=(10, 8))
        
        # Contenedor para estados (en línea)
        status_inner = Frame(status_frame, bg=self.colors['bg_secondary'])
        status_inner.pack(fill=X, padx=10, pady=(0, 10))
        
        # Estado Serial
        serial_frame = Frame(status_inner, bg=self.colors['bg_secondary'])
        serial_frame.pack(side=LEFT, padx=(0, 30))
        
        Label(serial_frame, text="Serial:", 
              font=("Segoe UI", 10),
              bg=self.colors['bg_secondary'],
              fg=self.colors['text_secondary']).pack(side=LEFT, padx=(0, 5))
        
        self.serial_status = Label(serial_frame, text="✗ Desconectado", 
                                   font=("Segoe UI", 10, "bold"), 
                                   fg=self.colors['error'],
                                   bg=self.colors['bg_secondary'])
        self.serial_status.pack(side=LEFT)
        
        # Estado Servidor
        server_frame = Frame(status_inner, bg=self.colors['bg_secondary'])
        server_frame.pack(side=LEFT)
        
        Label(server_frame, text="Servidor:", 
              font=("Segoe UI", 10),
              bg=self.colors['bg_secondary'],
              fg=self.colors['text_secondary']).pack(side=LEFT, padx=(0, 5))
        
        self.server_status = Label(server_frame, text="✗ Desconectado", 
                                   font=("Segoe UI", 10, "bold"), 
                                   fg=self.colors['error'],
                                   bg=self.colors['bg_secondary'])
        self.server_status.pack(side=LEFT)
        
        # === Último Peso Recibido (Diseño Moderno) ===
        peso_recibido_frame = Frame(content_frame, bg='white', relief=FLAT, bd=1, highlightbackground=self.colors['border'], highlightthickness=1)
        peso_recibido_frame.pack(fill=X, pady=(0, 10), padx=15)
        
        # Título
        Label(peso_recibido_frame, text="Último Peso Recibido", 
              font=("Segoe UI", 10, "bold"),
              bg='white',
              fg=self.colors['text_primary']).pack(anchor=W, padx=15, pady=(12, 8))
        
        # Contenedor para peso
        peso_inner = Frame(peso_recibido_frame, bg='white')
        peso_inner.pack(padx=15, pady=(0, 10))
        
        # Valor del peso (grande y destacado)
        peso_valor_frame = Frame(peso_inner, bg='white')
        peso_valor_frame.pack()
        
        self.peso_recibido_label = Label(peso_valor_frame, text="--", 
                                         font=("Segoe UI", 36, "bold"), 
                                         fg=self.colors['primary'],
                                         bg='white')
        self.peso_recibido_label.pack(side=LEFT)
        
        Label(peso_valor_frame, text="quintales", 
              font=("Segoe UI", 13),
              fg=self.colors['text_secondary'],
              bg='white').pack(side=LEFT, padx=8, pady=(8, 0))
        
        # Hora del último peso recibido
        self.peso_timestamp_label = Label(peso_recibido_frame, text="--", 
                                          font=("Segoe UI", 8),
                                          fg=self.colors['text_secondary'],
                                          bg='white')
        self.peso_timestamp_label.pack(pady=(3, 0))
        
        # Estado del peso
        self.peso_estado_label = Label(peso_recibido_frame, text="⏳ Esperando datos...", 
                                       font=("Segoe UI", 9),
                                       fg=self.colors['text_secondary'],
                                       bg='white')
        self.peso_estado_label.pack(pady=(3, 12))
        
        # === Último Peso Enviado (Diseño Moderno) ===
        peso_enviado_frame = Frame(content_frame, bg='white', relief=FLAT, bd=1, highlightbackground=self.colors['border'], highlightthickness=1)
        peso_enviado_frame.pack(fill=X, pady=(0, 10), padx=15)
        
        # Título
        Label(peso_enviado_frame, text="Último Peso Enviado", 
              font=("Segoe UI", 10, "bold"),
              bg='white',
              fg=self.colors['text_primary']).pack(anchor=W, padx=15, pady=(12, 8))
        
        # Contenedor para peso enviado
        enviado_inner = Frame(peso_enviado_frame, bg='white')
        enviado_inner.pack(padx=15, pady=(0, 8))
        
        # Valor del peso enviado
        peso_enviado_valor_frame = Frame(enviado_inner, bg='white')
        peso_enviado_valor_frame.pack()
        
        self.peso_enviado_label = Label(peso_enviado_valor_frame, text="--", 
                                        font=("Segoe UI", 28, "bold"), 
                                        fg=self.colors['success'],
                                        bg='white')
        self.peso_enviado_label.pack(side=LEFT)
        
        Label(peso_enviado_valor_frame, text="quintales", 
              font=("Segoe UI", 12),
              fg=self.colors['text_secondary'],
              bg='white').pack(side=LEFT, padx=8, pady=(5, 0))
        
        # Fecha y estado
        self.fecha_envio_label = Label(peso_enviado_frame, text="--", 
                                       font=("Segoe UI", 8),
                                       fg=self.colors['text_secondary'],
                                       bg='white')
        self.fecha_envio_label.pack(pady=(3, 3))
        
        self.estado_envio_label = Label(peso_enviado_frame, text="⏳ Esperando...", 
                                        font=("Segoe UI", 9, "bold"), 
                                        fg=self.colors['text_secondary'],
                                        bg='white')
        self.estado_envio_label.pack(pady=(0, 12))
        
        # === Estadísticas (Diseño Moderno) ===
        stats_frame = Frame(content_frame, bg=self.colors['bg_secondary'], relief=FLAT, bd=0)
        stats_frame.pack(fill=X, pady=(0, 10), padx=15)
        
        # Título
        Label(stats_frame, text="Estadísticas", 
              font=("Segoe UI", 11, "bold"),
              bg=self.colors['bg_secondary'],
              fg=self.colors['text_primary']).pack(anchor=W, padx=10, pady=(10, 8))
        
        # Contenedor para estadísticas (en línea)
        stats_inner = Frame(stats_frame, bg=self.colors['bg_secondary'])
        stats_inner.pack(fill=X, padx=10, pady=(0, 10))
        
        # Envíos exitosos
        success_frame = Frame(stats_inner, bg=self.colors['bg_secondary'])
        success_frame.pack(side=LEFT, padx=(0, 40))
        
        Label(success_frame, text="Envíos exitosos:", 
              font=("Segoe UI", 10),
              bg=self.colors['bg_secondary'],
              fg=self.colors['text_secondary']).pack(side=LEFT, padx=(0, 8))
        
        self.contador_envios_label = Label(success_frame, text="0", 
                                           font=("Segoe UI", 12, "bold"), 
                                           fg=self.colors['success'],
                                           bg=self.colors['bg_secondary'])
        self.contador_envios_label.pack(side=LEFT)
        
        # Errores
        error_frame = Frame(stats_inner, bg=self.colors['bg_secondary'])
        error_frame.pack(side=LEFT)
        
        Label(error_frame, text="Errores:", 
              font=("Segoe UI", 10),
              bg=self.colors['bg_secondary'],
              fg=self.colors['text_secondary']).pack(side=LEFT, padx=(0, 8))
        
        self.contador_errores_label = Label(error_frame, text="0", 
                                            font=("Segoe UI", 12, "bold"), 
                                            fg=self.colors['error'],
                                            bg=self.colors['bg_secondary'])
        self.contador_errores_label.pack(side=LEFT)
        
        # === Botón de Control (Diseño Moderno) - Siempre visible ===
        button_container = Frame(main_frame, bg=self.colors['bg_main'])
        button_container.pack(fill=X, pady=10, padx=15, side=BOTTOM)
        
        self.start_button = Button(button_container, 
                                   text="▶ Iniciar Monitoreo", 
                                   command=self.toggle_monitoring, 
                                   bg=self.colors['success'], 
                                   fg="white", 
                                   font=("Segoe UI", 12, "bold"),
                                   padx=30, 
                                   pady=10,
                                   relief=FLAT,
                                   border=0,
                                   cursor='hand2',
                                   activebackground='#45a049',
                                   activeforeground='white')
        self.start_button.pack()
        
        # === Registro de Actividad (Diseño Moderno) ===
        log_container = Frame(content_frame, bg=self.colors['bg_main'])
        log_container.pack(fill=X, pady=(0, 15), padx=15)
        
        # Título del registro
        Label(log_container, text="Registro de Actividad", 
              font=("Segoe UI", 11, "bold"),
              bg=self.colors['bg_main'],
              fg=self.colors['text_primary']).pack(anchor=W, pady=(0, 6))
        
        # Área de texto con scroll (estilo moderno) - altura fija
        log_text_frame = Frame(log_container, bg='white', relief=FLAT, bd=1, highlightbackground=self.colors['border'], highlightthickness=1)
        log_text_frame.pack(fill=X)
        
        self.log_text = scrolledtext.ScrolledText(log_text_frame, 
                                                  height=6, 
                                                  width=60, 
                                                  font=("Consolas", 8),
                                                  bg='white',
                                                  fg=self.colors['text_primary'],
                                                  relief=FLAT,
                                                  borderwidth=0,
                                                  wrap=WORD)
        self.log_text.pack(fill=X, padx=2, pady=2)
        
        # Agregar log inicial
        self.add_log(f"Aplicación iniciada")
        self.add_log(f"✓ Configuración cargada: {self.bascula_nombre} - {self.serial_port}")
        self.add_log("Presiona 'Iniciar Monitoreo' para comenzar")
        self.add_log("Clic en ⚙️ para cambiar configuración")
        
        # Guardar configuración inicial para asegurar que existe
        save_config(self.bascula_nombre, self.serial_port)
        
    def open_config_window(self):
        """Abrir ventana de configuración"""
        config_window = Toplevel(self.root)
        config_window.title("⚙️ Configuración")
        config_window.geometry("500x350")
        config_window.resizable(False, False)
        config_window.configure(bg='white')
        config_window.transient(self.root)  # Hacerla modal
        config_window.grab_set()  # Hacerla modal
        
        # Centrar ventana
        config_window.update_idletasks()
        x = (config_window.winfo_screenwidth() // 2) - (500 // 2)
        y = (config_window.winfo_screenheight() // 2) - (350 // 2)
        config_window.geometry(f"500x350+{x}+{y}")
        
        # Header de configuración
        config_header = Frame(config_window, bg=self.colors['primary'], height=60)
        config_header.pack(fill=X)
        config_header.pack_propagate(False)
        
        Label(config_header, text="⚙️ Configuración", 
              font=("Segoe UI", 18, "bold"),
              bg=self.colors['primary'],
              fg='white').pack(pady=15)
        
        # Contenido
        content_config = Frame(config_window, bg='white')
        content_config.pack(fill=BOTH, expand=True, padx=30, pady=30)
        
        # Selector de Báscula
        bascula_frame = Frame(content_config, bg='white')
        bascula_frame.pack(fill=X, pady=(0, 20))
        
        Label(bascula_frame, text="Báscula:", 
              font=("Segoe UI", 11, "bold"),
              bg='white',
              fg=self.colors['text_primary']).pack(anchor=W, pady=(0, 8))
        
        self.bascula_var = StringVar(value=self.bascula_nombre)
        self.bascula_combo = ttk.Combobox(bascula_frame, 
                                          textvariable=self.bascula_var, 
                                          values=BASCULAS_DISPONIBLES, 
                                          state="readonly", 
                                          width=40, 
                                          font=("Segoe UI", 11))
        self.bascula_combo.pack(fill=X, pady=(0, 5))
        self.bascula_combo.bind('<<ComboboxSelected>>', self.on_bascula_change)
        
        # Selector de Puerto Serial
        port_frame = Frame(content_config, bg='white')
        port_frame.pack(fill=X, pady=(0, 20))
        
        port_label_frame = Frame(port_frame, bg='white')
        port_label_frame.pack(fill=X, pady=(0, 8))
        
        Label(port_label_frame, text="Puerto Serial:", 
              font=("Segoe UI", 11, "bold"),
              bg='white',
              fg=self.colors['text_primary']).pack(side=LEFT)
        
        refresh_btn = Button(port_label_frame, 
                            text="🔄 Refrescar", 
                            command=lambda: self.refresh_ports_config(config_window),
                            font=("Segoe UI", 9),
                            bg=self.colors['bg_secondary'],
                            fg=self.colors['text_primary'],
                            relief=FLAT,
                            padx=10,
                            pady=4,
                            cursor='hand2')
        refresh_btn.pack(side=RIGHT)
        
        # Obtener puertos disponibles
        available_ports = get_available_ports()
        if self.serial_port and self.serial_port not in available_ports:
            available_ports.insert(0, self.serial_port)
        
        self.port_var = StringVar(value=self.serial_port)
        self.port_combo = ttk.Combobox(port_frame, 
                                       textvariable=self.port_var, 
                                       values=available_ports, 
                                       state="readonly",
                                       width=40, 
                                       font=("Segoe UI", 11))
        self.port_combo.pack(fill=X, pady=(0, 5))
        self.port_combo.bind('<<ComboboxSelected>>', self.on_port_change)
        
        # Info
        Label(content_config, 
              text="ℹ️ La configuración se guarda automáticamente", 
              font=("Segoe UI", 9),
              fg=self.colors['text_secondary'],
              bg='white').pack(pady=(10, 0))
        
        # Botones
        button_frame_config = Frame(content_config, bg='white')
        button_frame_config.pack(fill=X, pady=(30, 0))
        
        close_btn = Button(button_frame_config, 
                          text="Cerrar", 
                          command=config_window.destroy,
                          font=("Segoe UI", 11, "bold"),
                          bg=self.colors['bg_secondary'],
                          fg=self.colors['text_primary'],
                          relief=FLAT,
                          padx=30,
                          pady=10,
                          cursor='hand2',
                          activebackground=self.colors['border'])
        close_btn.pack(side=RIGHT, padx=(10, 0))
        
    def refresh_ports_config(self, config_window):
        """Refrescar puertos en la ventana de configuración"""
        available_ports = get_available_ports()
        if self.serial_port and self.serial_port not in available_ports:
            available_ports.insert(0, self.serial_port)
        self.port_combo['values'] = available_ports
        self.port_combo.set(self.serial_port)
        
    def on_bascula_change(self, event=None):
        """Manejador cuando cambia la selección de báscula"""
        nueva_bascula = self.bascula_var.get()
        if nueva_bascula != self.bascula_nombre:
            self.bascula_nombre = nueva_bascula
            if save_config(self.bascula_nombre, self.serial_port):
                self.add_log(f"✓ Báscula cambiada a: {self.bascula_nombre} (guardado)")
                self.update_title()  # Actualizar título de la ventana
                # Actualizar título en el header
                if hasattr(self, 'header_title'):
                    bascula_display = self.bascula_nombre.replace('bascula ', '').title()
                    self.header_title.config(text=f"⚖️ Báscula {bascula_display}")
            else:
                self.add_log(f"⚠ Báscula cambiada a: {self.bascula_nombre} (error al guardar)")
            
    def check_port_available(self, port_name):
        """Verificar si un puerto serial está disponible"""
        if not port_name:
            return False, "Puerto no especificado"
        
        # Si el monitoreo está corriendo y es el mismo puerto que estamos usando, está "disponible"
        # porque podemos liberarlo
        if self.running and port_name == self.serial_port:
            return True, None
        
        # Intentar abrir el puerto temporalmente para verificar disponibilidad
        test_ser = None
        try:
            test_ser = serial.Serial(
                port=port_name,
                baudrate=SERIAL_BAUDRATE,
                timeout=0.5,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE
            )
            # Si llegamos aquí, el puerto está disponible
            test_ser.close()
            return True, None
        except serial.SerialException as e:
            error_msg = str(e)
            if "Access is denied" in error_msg or "Permission denied" in error_msg or "could not open port" in error_msg.lower():
                return False, f"El puerto {port_name} está ocupado por otra aplicación"
            elif "No such file or directory" in error_msg or "could not find port" in error_msg.lower():
                return False, f"El puerto {port_name} no existe"
            else:
                return False, f"Error al verificar puerto: {error_msg}"
        except Exception as e:
            return False, f"Error inesperado: {str(e)}"
        finally:
            if test_ser and test_ser.is_open:
                try:
                    test_ser.close()
                except:
                    pass
    
    def on_port_change(self, event=None):
        """Manejador cuando cambia la selección de puerto"""
        nuevo_puerto = self.port_var.get()
        if nuevo_puerto != self.serial_port:
            # Si el monitoreo está corriendo, necesitamos detenerlo primero
            monitoreo_activo = self.running
            puerto_anterior = self.serial_port
            
            if monitoreo_activo:
                # Detener monitoreo y liberar puerto actual
                self.add_log("⏸ Deteniendo monitoreo para cambiar puerto...")
                self.stop_monitoring()
                # Programar verificación después de un momento para que el puerto se libere
                self.root.after(500, lambda: self._verify_and_change_port(nuevo_puerto, puerto_anterior, monitoreo_activo))
            else:
                # Si no hay monitoreo activo, verificar inmediatamente
                self._verify_and_change_port(nuevo_puerto, puerto_anterior, monitoreo_activo)
    
    def _verify_and_change_port(self, nuevo_puerto, puerto_anterior, monitoreo_estaba_activo):
        """Verificar disponibilidad del puerto y aplicar el cambio"""
        # Verificar si el nuevo puerto está disponible
        disponible, error_msg = self.check_port_available(nuevo_puerto)
        
        if not disponible:
            # Puerto no disponible: revertir selección y mostrar error
            self.port_var.set(puerto_anterior)
            self.add_log(f"✗ ERROR: {error_msg}")
            # Mostrar ventana de error
            from tkinter import messagebox
            messagebox.showerror(
                "Puerto No Disponible",
                f"El puerto {nuevo_puerto} no está disponible.\n\n{error_msg}\n\n"
                f"La configuración se mantendrá en {puerto_anterior}."
            )
            return
        
        # Puerto disponible: aplicar cambio
        self.serial_port = nuevo_puerto
        if save_config(self.bascula_nombre, self.serial_port):
            self.add_log(f"✓ Puerto serial cambiado a: {self.serial_port} (guardado)")
        else:
            self.add_log(f"⚠ Puerto serial cambiado a: {self.serial_port} (error al guardar)")
        
        # Si el monitoreo estaba activo, informar al usuario
        if monitoreo_estaba_activo:
            self.add_log("💡 Puerto cambiado. Para usar el nuevo puerto, inicie el monitoreo nuevamente.")
            
    def refresh_ports(self):
        """Refrescar lista de puertos disponibles (método obsoleto, usar refresh_ports_config)"""
        # Este método ya no se usa directamente, pero se mantiene por compatibilidad
        pass
        
    def add_log(self, message):
        """Agregar mensaje al registro"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}\n"
        self.log_text.insert(END, log_message)
        self.log_text.see(END)
        # Actualizar scrollregion del canvas después de agregar contenido
        if hasattr(self, 'canvas'):
            self.root.after(10, lambda: self.canvas.configure(scrollregion=self.canvas.bbox("all")))
        
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
                    
                elif msg_type == 'stop_monitoring':
                    # Actualizar botón cuando el monitoreo se detiene por error
                    self.start_button.config(text="▶ Iniciar Monitoreo", 
                                            bg=self.colors['success'],
                                            activebackground='#45a049')
                    
        except queue.Empty:
            pass
        
        # Programar siguiente verificación
        self.root.after(100, self.process_messages)
        
    def update_peso_recibido(self, peso, es_estable):
        """Actualizar display del peso recibido"""
        self.ultimo_peso_recibido = peso
        self.ultimo_timestamp_recibido = time.time()  # Guardar timestamp actual
        timestamp_str = datetime.now().strftime("%H:%M:%S")
        
        self.peso_recibido_label.config(text=f"{peso:.2f}")
        if hasattr(self, 'peso_timestamp_label'):
            self.peso_timestamp_label.config(text=f"Recibido: {timestamp_str}")
        
        if es_estable:
            self.peso_estado_label.config(text="✓ Peso estable - Listo para enviar", 
                                          fg=self.colors['success'],
                                          font=("Segoe UI", 10, "bold"))
        else:
            self.peso_estado_label.config(text="⏳ Peso moviéndose - Esperando estabilización", 
                                          fg=self.colors['warning'],
                                          font=("Segoe UI", 10))
    
    def check_timeout(self):
        """Verificar si han pasado más de 5 segundos sin recibir datos"""
        if self.running and self.ultimo_timestamp_recibido is not None:
            tiempo_transcurrido = time.time() - self.ultimo_timestamp_recibido
            
            if tiempo_transcurrido > self.TIMEOUT_DATOS:
                # Timeout: limpiar peso y mostrar mensaje
                self.ultimo_peso_recibido = None
                self.peso_recibido_label.config(text="--")
                if hasattr(self, 'peso_timestamp_label'):
                    self.peso_timestamp_label.config(text="Sin datos")
                self.peso_estado_label.config(text="⚠ No se reciben datos - Verifique conexión serial", 
                                              fg=self.colors['error'],
                                              font=("Segoe UI", 9, "bold"))
        
        # Verificar nuevamente en 1 segundo
        self.root.after(1000, self.check_timeout)
            
    def update_peso_enviado(self, peso, exito):
        """Actualizar display del peso enviado"""
        self.ultimo_peso_enviado = peso
        self.peso_enviado_label.config(text=f"{peso:.2f}")
        self.ultima_fecha_envio = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.fecha_envio_label.config(text=f"Enviado: {self.ultima_fecha_envio}")
        
        if exito:
            self.estado_envio = "Éxito"
            self.estado_envio_label.config(text="✓ Enviado exitosamente", 
                                          fg=self.colors['success'],
                                          font=("Segoe UI", 10, "bold"))
            self.contador_envios += 1
            self.contador_envios_label.config(text=str(self.contador_envios))
        else:
            self.estado_envio = "Error"
            self.estado_envio_label.config(text="✗ Error al enviar", 
                                          fg=self.colors['error'],
                                          font=("Segoe UI", 10, "bold"))
            self.contador_errores += 1
            self.contador_errores_label.config(text=str(self.contador_errores))
            
    def update_serial_status(self, connected):
        """Actualizar estado de conexión serial"""
        self.serial_connected = connected
        if connected:
            self.serial_status.config(text="✓ Conectado", fg=self.colors['success'])
        else:
            self.serial_status.config(text="✗ Desconectado", fg=self.colors['error'])
            
    def update_server_status(self, connected):
        """Actualizar estado de conexión al servidor"""
        self.server_connected = connected
        if connected:
            self.server_status.config(text="✓ Conectado", fg=self.colors['success'])
        else:
            self.server_status.config(text="✗ Desconectado", fg=self.colors['error'])
            
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
            
        # Guardar configuración antes de iniciar (asegurar persistencia)
        if save_config(self.bascula_nombre, self.serial_port):
            self.add_log(f"✓ Configuración guardada: {self.bascula_nombre} - {self.serial_port}")
        else:
            self.add_log(f"⚠ Advertencia: No se pudo guardar configuración, pero continuando...")
        
        # Resetear timestamp al iniciar
        self.ultimo_timestamp_recibido = None
        
        self.running = True
        self.start_button.config(text="⏸ Detener Monitoreo", 
                                bg=self.colors['error'],
                                activebackground='#d32f2f')
        
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
        # Resetear timestamp al detener
        self.ultimo_timestamp_recibido = None
        
        self.start_button.config(text="▶ Iniciar Monitoreo", 
                                bg=self.colors['success'],
                                activebackground='#45a049')
        
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
            try:
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
                self.message_queue.put({'type': 'log', 'message': f"✓ Conectado a {port_to_use} correctamente"})
            except serial.SerialException as e:
                error_msg = str(e)
                if "Access is denied" in error_msg or "Permission denied" in error_msg or "could not open port" in error_msg.lower():
                    error_msg = f"El puerto {port_to_use} está ocupado por otra aplicación. Cierre otras aplicaciones que puedan estar usando este puerto."
                elif "No such file or directory" in error_msg or "could not find port" in error_msg.lower():
                    error_msg = f"El puerto {port_to_use} no existe. Verifique la configuración."
                else:
                    error_msg = f"Error al conectar: {error_msg}"
                
                self.message_queue.put({
                    'type': 'log',
                    'message': f"✗ ERROR: {error_msg}"
                })
                self.message_queue.put({'type': 'serial_status', 'connected': False})
                # Detener el monitoreo ya que no podemos conectarnos
                self.running = False
                # Actualizar estado del botón
                self.message_queue.put({'type': 'stop_monitoring'})
                from tkinter import messagebox
                self.root.after(0, lambda: messagebox.showerror(
                    "Error de Conexión Serial",
                    f"No se pudo conectar al puerto {port_to_use}.\n\n{error_msg}\n\n"
                    "El monitoreo se ha detenido."
                ))
                return
            
            time.sleep(2)  # Esperar estabilización
            
            ultimo_peso_enviado = None
            buffer_serial = ""  # Buffer para acumular datos
            ultimo_peso_procesado = None  # Para evitar procesar el mismo peso múltiples veces
            
            while self.running:
                try:
                    # Leer todos los datos disponibles del serial
                    if ser.in_waiting > 0:
                        # Leer todos los bytes disponibles
                        bytes_disponibles = ser.in_waiting
                        datos_raw = ser.read(bytes_disponibles)
                        
                        try:
                            # Decodificar y agregar al buffer
                            nuevo_dato = datos_raw.decode('utf-8', errors='ignore')
                            buffer_serial += nuevo_dato
                            
                            # Log para debugging (solo los primeros caracteres)
                            if len(nuevo_dato) > 0:
                                preview = nuevo_dato[:50] if len(nuevo_dato) > 50 else nuevo_dato
                                self.message_queue.put({
                                    'type': 'log',
                                    'message': f"Datos recibidos: {repr(preview)}..."
                                })
                        except Exception as e:
                            # Si hay error de decodificación, intentar con otros encodings
                            try:
                                nuevo_dato = datos_raw.decode('latin-1', errors='ignore')
                                buffer_serial += nuevo_dato
                            except:
                                self.message_queue.put({
                                    'type': 'log',
                                    'message': f"Error decodificando datos: {e}"
                                })
                        
                        # Buscar patrones válidos en el buffer
                        # Los datos vienen concatenados: "3940G3940G3950G..." o "3940G   3950G   ..." o "19.0G   19.0G   ..."
                        # Patrón: número (entero o con punto decimal) seguido de 'G' o 'm' (mayúscula o minúscula)
                        # seguido de cualquier cantidad de espacios (0 o más)
                        # Acepta: "1900G" (entero) o "19.0G" (decimal) o "19.00G"
                        # Usamos finditer para obtener también las posiciones y los espacios
                        patrones_match = list(re.finditer(r'(\d+(?:\.\d+)?[GgMm])\s*', buffer_serial))
                        
                        if patrones_match:
                            # Procesar todos los patrones encontrados, pero solo actuar sobre el último
                            valores_validos = []
                            for match in patrones_match:
                                patron_completo = match.group(0)  # Incluye el patrón + espacios
                                patron_sin_espacios = match.group(1)  # Solo el patrón (número + G/m)
                                
                                peso, es_estable = self.parsear_peso(patron_sin_espacios)
                                if peso is not None:
                                    valores_validos.append((peso, es_estable, patron_sin_espacios, match))
                            
                            # Tomar el último valor válido encontrado
                            if valores_validos:
                                peso, es_estable, patron_original, ultimo_match = valores_validos[-1]
                                
                                # Solo procesar si es diferente al último procesado (evitar spam)
                                if peso != ultimo_peso_procesado or es_estable:
                                    ultimo_peso_procesado = peso
                                    
                                    self.message_queue.put({
                                        'type': 'peso_recibido',
                                        'peso': peso,
                                        'es_estable': es_estable
                                    })
                                    
                                    if es_estable:
                                        # Solo enviar si el peso ha cambiado desde la última vez que se envió
                                        if peso != ultimo_peso_enviado:
                                            self.message_queue.put({
                                                'type': 'log',
                                                'message': f"Peso estable detectado: {peso:.2f} quintales (patrón: {patron_original})"
                                            })
                                            
                                            exito = self.enviar_datos_a_api(peso, bascula_to_use)
                                            if exito:
                                                ultimo_peso_enviado = peso
                                            
                                            self.message_queue.put({
                                                'type': 'peso_enviado',
                                                'peso': peso,
                                                'exito': exito
                                            })
                                            self.message_queue.put({
                                                'type': 'server_status',
                                                'connected': exito
                                            })
                            
                            # Limpiar buffer: usar la posición final del último match (incluye espacios)
                            if valores_validos:
                                ultimo_match = valores_validos[-1][3]  # El objeto Match del último patrón
                                # Limpiar desde el final del último match (incluyendo todos los espacios)
                                end_pos = ultimo_match.end()
                                buffer_serial = buffer_serial[end_pos:]
                        
                        # Limitar tamaño del buffer para evitar acumulación excesiva
                        if len(buffer_serial) > 200:
                            # Mantener solo los últimos 100 caracteres
                            buffer_serial = buffer_serial[-100:]
                                    
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
            
    def parsear_peso(self, dato):
        """
        Parsear el dato del reloj digital
        TODOS los valores vienen en LIBRAS y se deben dividir por 100 para obtener quintales.
        
        Formatos esperados:
        - "3950G" (entero en libras) -> 3950 / 100 = 39.50 quintales
        - "3950G    " (con espacios)
        - "3950m" (peso moviéndose en libras)
        - "19.5G" (decimal en libras) -> 19.5 / 100 = 0.195 quintales
        - "19.0G" (decimal en libras) -> 19.0 / 100 = 0.19 quintales
        """
        if not dato:
            return None, False
        
        # Limpiar el dato (eliminar espacios al inicio y final)
        dato = dato.strip()
        
        if len(dato) < 2:
            return None, False
        
        # El último carácter debe ser 'G' o 'm' (mayúscula o minúscula)
        ultimo_caracter = dato[-1].upper()
        
        if ultimo_caracter not in ['G', 'M']:
            return None, False
        
        # Extraer el número (todo excepto el último carácter)
        numero_str = dato[:-1].strip()
        
        if not numero_str:
            return None, False
        
        try:
            # Convertir a float (acepta tanto enteros como decimales)
            peso_libras = float(numero_str)
            
            # SIEMPRE dividir por 100 para convertir de libras a quintales
            # Ejemplo: 3950 libras -> 39.50 quintales
            # Ejemplo: 19.5 libras -> 0.195 quintales
            # Ejemplo: 19.0 libras -> 0.19 quintales
            peso_quintales = peso_libras / 100.0
            
            # Determinar si está estable ('G' = estable, 'M' = moviéndose)
            es_estable = (ultimo_caracter == 'G')
            
            return peso_quintales, es_estable
        except (ValueError, TypeError):
            return None, False
        
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
        
        # Guardar configuración final antes de cerrar
        if self.bascula_nombre and self.serial_port:
            save_config(self.bascula_nombre, self.serial_port)
            self.add_log("✓ Configuración guardada antes de cerrar")
        
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

