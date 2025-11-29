# Script para instalar el cliente de báscula como servicio de Windows
# Requiere permisos de administrador
# Requiere NSSM: https://nssm.cc/download

param(
    [string]$PuertoCOM = "COM1",
    [string]$NombreBascula = "bascula camionera",
    [string]$Baudrate = "9600"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Instalador de Servicio Windows" -ForegroundColor Cyan
Write-Host "Cliente de Bascula" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que se ejecuta como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Este script requiere permisos de administrador" -ForegroundColor Red
    Write-Host "Ejecuta PowerShell como administrador" -ForegroundColor Yellow
    pause
    exit 1
}

# Verificar que NSSM está disponible
$nssmPath = "nssm"
if (-not (Get-Command $nssmPath -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: NSSM no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instrucciones:" -ForegroundColor Yellow
    Write-Host "1. Descarga NSSM desde: https://nssm.cc/download" -ForegroundColor Yellow
    Write-Host "2. Extrae NSSM en una carpeta (ej: C:\nssm)" -ForegroundColor Yellow
    Write-Host "3. Agrega esa carpeta al PATH del sistema" -ForegroundColor Yellow
    Write-Host "4. O copia nssm.exe a C:\Windows\System32" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Obtener rutas
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path  # windows/
$pythonExe = (Get-Command python).Source
$clientScript = Join-Path $scriptDir "raspberry_bascula_gui.py"
$serviceName = "BasculaCamionera"

# Verificar que el script existe
if (-not (Test-Path $clientScript)) {
    Write-Host "ERROR: No se encontró el script: $clientScript" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Configuración:" -ForegroundColor Yellow
Write-Host "  Puerto COM: $PuertoCOM"
Write-Host "  Bascula: $NombreBascula"
Write-Host "  Baudrate: $Baudrate"
Write-Host "  Python: $pythonExe"
Write-Host "  Script: $clientScript"
Write-Host "  Servicio: $serviceName"
Write-Host ""

# Preguntar confirmación
$confirmation = Read-Host "¿Continuar con la instalación? (S/N)"
if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Host "Instalación cancelada" -ForegroundColor Yellow
    exit 0
}

# Detener servicio si existe
Write-Host "Verificando servicio existente..." -ForegroundColor Yellow
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Deteniendo servicio existente..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Instalar servicio con NSSM
Write-Host "Instalando servicio..." -ForegroundColor Yellow

# Configurar NSSM
& $nssmPath install $serviceName $pythonExe "$clientScript"
& $nssmPath set $serviceName AppDirectory $scriptDir
& $nssmPath set $serviceName AppStdout (Join-Path $scriptDir "logs\bascula_service.log")
& $nssmPath set $serviceName AppStderr (Join-Path $scriptDir "logs\bascula_service_error.log")
& $nssmPath set $serviceName AppEnvironmentExtra "SERIAL_PORT=$PuertoCOM" "BASCULA_NOMBRE=$NombreBascula" "SERIAL_BAUDRATE=$Baudrate"
& $nssmPath set $serviceName DisplayName "Cliente Bascula Camionera"
& $nssmPath set $serviceName Description "Cliente para lectura de báscula camionera desde reloj digital serial"
& $nssmPath set $serviceName Start SERVICE_AUTO_START
& $nssmPath set $serviceName AppRestartDelay 5000

# Crear directorio de logs
$logsDir = Join-Path $scriptDir "logs"
if (-not (Test-Path $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Servicio instalado exitosamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos útiles:" -ForegroundColor Yellow
Write-Host "  Iniciar servicio:   Start-Service $serviceName" -ForegroundColor White
Write-Host "  Detener servicio:   Stop-Service $serviceName" -ForegroundColor White
Write-Host "  Ver estado:         Get-Service $serviceName" -ForegroundColor White
Write-Host "  Ver logs:           Get-Content $logsDir\bascula_service.log -Tail 50 -Wait" -ForegroundColor White
Write-Host "  Desinstalar:        nssm remove $serviceName confirm" -ForegroundColor White
Write-Host ""
Write-Host "Nota: El servicio ejecutará la aplicación con GUI. Si prefieres ejecutar sin GUI," -ForegroundColor Yellow
Write-Host "      edita el servicio para usar raspberry_bascula_client.py (si existe)" -ForegroundColor Yellow
Write-Host ""
Write-Host "¿Deseas iniciar el servicio ahora? (S/N)" -ForegroundColor Yellow
$startNow = Read-Host
if ($startNow -eq "S" -or $startNow -eq "s") {
    Start-Service -Name $serviceName
    Write-Host "Servicio iniciado" -ForegroundColor Green
    Start-Sleep -Seconds 2
    Get-Service -Name $serviceName
}

pause

