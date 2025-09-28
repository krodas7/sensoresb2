#!/bin/bash

echo "🧹 LIMPIEZA COMPLETA DE SERVICE WORKERS"
echo "======================================"

# 1. Detener todos los procesos
echo "🛑 Deteniendo procesos..."
pkill -f "python.*manage.py runserver" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# 2. Limpiar cache del navegador (Chrome/Chromium)
echo "🗑️ Limpiando cache del navegador..."
if command -v google-chrome >/dev/null 2>&1; then
    google-chrome --clear-browsing-data --clear-cache --clear-cookies --clear-storage 2>/dev/null || true
fi

if command -v chromium-browser >/dev/null 2>&1; then
    chromium-browser --clear-browsing-data --clear-cache --clear-cookies --clear-storage 2>/dev/null || true
fi

# 3. Limpiar cache de Node.js
echo "🧹 Limpiando cache de Node.js..."
cd /Users/krodas7/Desktop/beneficio/frontend
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .vite 2>/dev/null || true

# 4. Limpiar archivos temporales
echo "🗑️ Limpiando archivos temporales..."
find /Users/krodas7/Desktop/beneficio -name "*.log" -delete 2>/dev/null || true
find /Users/krodas7/Desktop/beneficio -name "*.tmp" -delete 2>/dev/null || true

# 5. Verificar que no hay archivos de Service Worker
echo "🔍 Verificando archivos de Service Worker..."
find /Users/krodas7/Desktop/beneficio/frontend -name "sw.js" -delete 2>/dev/null || true
find /Users/krodas7/Desktop/beneficio/frontend -name "workbox-*" -delete 2>/dev/null || true

echo "✅ Limpieza completada!"
echo ""
echo "🚀 Para continuar:"
echo "1. Abre http://localhost:5173/kill-all-sw.html en tu navegador"
echo "2. Haz clic en 'ELIMINAR TODOS LOS SERVICE WORKERS'"
echo "3. Espera a que se cierre el navegador"
echo "4. Reinicia el proyecto con: ./setup.sh"
