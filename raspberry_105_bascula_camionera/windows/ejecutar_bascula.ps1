# Script PowerShell para ejecutar el cliente de báscula en Windows
# Uso: .\ejecutar_bascula.ps1

# ============================================
# CONFIGURACIÓN
# ============================================

# Puerto COM donde está conectado el reloj (COM1, COM2, COM3, etc.)
$env:SERIAL_PORT = "COM1"

# Nombre de la báscula
$env:BASCULA_NOMBRE = "bascula camionera"

# Baudrate (por defecto 9600)
$env:SERIAL_BAUDRATE = "9600"

# ============================================
# EJECUTAR
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cliente de Bascula - Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Puerto Serial: $env:SERIAL_PORT" -ForegroundColor Yellow
Write-Host "Bascula: $env:BASCULA_NOMBRE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del script (windows/)
Set-Location $PSScriptRoot

# Verificar que Python está instalado
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Instala Python desde https://www.python.org/downloads/" -ForegroundColor Yellow
    pause
    exit 1
}

# Ejecutar el cliente Python (con GUI)
Write-Host "Iniciando aplicación de báscula..." -ForegroundColor Green
python raspberry_bascula_gui.py

