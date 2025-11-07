#!/bin/bash

# ════════════════════════════════════════════════════════════════════════════════
# Script de Despliegue Rápido - Sistema IoT SensoresB2
# ════════════════════════════════════════════════════════════════════════════════
# Este script contiene todos los comandos necesarios para desplegar el sistema
# en las 4 Raspberry Pis. Ejecuta los comandos manualmente o por secciones.
# ════════════════════════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════════════════════════"
echo "                    🚀 DESPLIEGUE SISTEMA IoT - SENSORESB2"
echo "════════════════════════════════════════════════════════════════════════════════"

# ════════════════════════════════════════════════════════════════════════════════
# 1. RASPBERRY PI 100 - PILAS DE FERMENTACIÓN
# ════════════════════════════════════════════════════════════════════════════════

echo ""
echo "1️⃣  RASPBERRY PI 100 - FERMENTACIÓN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copiar archivos a Raspberry Pi 100:"
echo "  scp -r raspberry_100_fermentacion/ laptop@192.168.0.100:/home/laptop/sensoresb2/"
echo ""
echo "Conectar e instalar:"
echo "  ssh laptop@192.168.0.100"
echo "  cd /home/laptop/sensoresb2/raspberry_100_fermentacion/"
echo "  chmod +x install_fermentacion_service.sh"
echo "  ./install_fermentacion_service.sh"
echo ""
echo "Verificar:"
echo "  sudo systemctl status fermentacion-sensor-client"
echo "  sudo journalctl -u fermentacion-sensor-client -f"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# 2. RASPBERRY PI 101 - PILAS DE SECADO
# ════════════════════════════════════════════════════════════════════════════════

echo ""
echo "2️⃣  RASPBERRY PI 101 - SECADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copiar archivos a Raspberry Pi 101:"
echo "  scp -r raspberry_101_secado/ laptop@192.168.0.101:/home/laptop/sensoresb2/"
echo ""
echo "Conectar e instalar:"
echo "  ssh laptop@192.168.0.101"
echo "  cd /home/laptop/sensoresb2/raspberry_101_secado/"
echo "  chmod +x install_secado_service.sh"
echo "  ./install_secado_service.sh"
echo ""
echo "Verificar:"
echo "  sudo systemctl status secado-sensor-client"
echo "  sudo journalctl -u secado-sensor-client -f"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# 3. RASPBERRY PI 102 - GUARDIOLAS 1-2
# ════════════════════════════════════════════════════════════════════════════════

echo ""
echo "3️⃣  RASPBERRY PI 102 - GUARDIOLAS 1-2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copiar archivos a Raspberry Pi 102:"
echo "  scp -r raspberry_102_guardiolas_12/ laptop@192.168.0.102:/home/laptop/sensoresb2/"
echo ""
echo "Conectar e instalar:"
echo "  ssh laptop@192.168.0.102"
echo "  cd /home/laptop/sensoresb2/raspberry_102_guardiolas_12/"
echo "  chmod +x install_guardiolas_12_service.sh"
echo "  ./install_guardiolas_12_service.sh"
echo ""
echo "Verificar:"
echo "  sudo systemctl status guardiolas-12-sensor-client"
echo "  sudo journalctl -u guardiolas-12-sensor-client -f"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# 4. RASPBERRY PI 103 - GUARDIOLAS 3-4
# ════════════════════════════════════════════════════════════════════════════════

echo ""
echo "4️⃣  RASPBERRY PI 103 - GUARDIOLAS 3-4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Copiar archivos a Raspberry Pi 103:"
echo "  scp -r raspberry_103_guardiolas_34/ laptop@192.168.0.103:/home/laptop/sensoresb2/"
echo ""
echo "Conectar e instalar:"
echo "  ssh laptop@192.168.0.103"
echo "  cd /home/laptop/sensoresb2/raspberry_103_guardiolas_34/"
echo "  chmod +x install_guardiolas_34_service.sh"
echo "  ./install_guardiolas_34_service.sh"
echo ""
echo "Verificar:"
echo "  sudo systemctl status guardiolas-34-sensor-client"
echo "  sudo journalctl -u guardiolas-34-sensor-client -f"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# VERIFICACIÓN DEL SISTEMA
# ════════════════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                        🔍 VERIFICACIÓN DEL SISTEMA"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Desde el servidor (192.168.0.150), ejecutar:"
echo ""
echo "1. Ver resumen de fermentación:"
echo "   curl http://localhost:8000/api/v1/sensors/fermentacion/resumen/ | python3 -m json.tool"
echo ""
echo "2. Ver resumen de secado:"
echo "   curl http://localhost:8000/api/v1/sensors/secado/resumen/ | python3 -m json.tool"
echo ""
echo "3. Ver resumen de temperaturas (guardiolas):"
echo "   curl http://localhost:8000/api/v1/sensors/temperatura/resumen/ | python3 -m json.tool"
echo ""
echo "4. Ver estadísticas generales:"
echo "   curl http://localhost:8000/api/v1/sensors/medicion/estadisticas/ | python3 -m json.tool"
echo ""
echo "5. Desde Django shell:"
echo "   cd backend && python manage.py shell"
echo ""
echo "   from apps.sensors.models import Medicion, MedicionTemperatura"
echo "   print(f'Mediciones distancia: {Medicion.objects.count()}')"
echo "   print(f'Mediciones temperatura: {MedicionTemperatura.objects.count()}')"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# COMANDOS ÚTILES
# ════════════════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                        🛠️  COMANDOS ÚTILES"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Reiniciar un servicio:"
echo "  sudo systemctl restart [nombre-servicio]"
echo ""
echo "Ver logs en tiempo real:"
echo "  sudo journalctl -u [nombre-servicio] -f"
echo ""
echo "Ver últimas 50 líneas de logs:"
echo "  sudo journalctl -u [nombre-servicio] -n 50"
echo ""
echo "Detener un servicio:"
echo "  sudo systemctl stop [nombre-servicio]"
echo ""
echo "Ver estado del servicio:"
echo "  sudo systemctl status [nombre-servicio]"
echo ""

# ════════════════════════════════════════════════════════════════════════════════
# FINAL
# ════════════════════════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "                        ✅ GUÍA DE DESPLIEGUE COMPLETA"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📖 Para más detalles, consultar: RASPBERRY_DEPLOYMENT.md"
echo ""
echo "🚀 Sistema configurado para servidor: 192.168.0.150:8000"
echo ""
echo "✅ Todo listo para desplegar en las Raspberry Pis!"
echo ""

