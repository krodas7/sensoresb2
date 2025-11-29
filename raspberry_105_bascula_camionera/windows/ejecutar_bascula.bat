@echo off
REM Script para ejecutar el cliente de báscula en Windows
REM Ajusta las variables según tu configuración

REM ============================================
REM CONFIGURACIÓN
REM ============================================

REM Puerto COM donde está conectado el reloj (COM1, COM2, COM3, etc.)
set SERIAL_PORT=COM1

REM Nombre de la báscula
set BASCULA_NOMBRE=bascula camionera

REM Baudrate (por defecto 9600)
set SERIAL_BAUDRATE=9600

REM ============================================
REM EJECUTAR
REM ============================================

echo ========================================
echo Cliente de Bascula - Windows
echo ========================================
echo Puerto Serial: %SERIAL_PORT%
echo Bascula: %BASCULA_NOMBRE%
echo ========================================
echo.

REM Cambiar al directorio del script (windows/)
cd /d "%~dp0"

REM Ejecutar el cliente Python (con GUI)
echo.
echo Iniciando aplicación de báscula...
echo.

REM Ejecutar aplicación con GUI
python raspberry_bascula_gui.py

pause

