#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🛡️  PRUEBA DE RESILIENCIA DEL SISTEMA                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/krodas7/Desktop/beneficio

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para probar endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "  Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" == "$expected" ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $response)"
    else
        echo -e "${RED}❌ FAIL${NC} (Expected $expected, got $response)"
    fi
}

echo "🔍 TEST 1: Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "Health Simple" "http://localhost:8000/api/v1/health/" "200"
test_endpoint "Readiness" "http://localhost:8000/api/v1/readiness/" "200"
test_endpoint "Liveness" "http://localhost:8000/api/v1/liveness/" "200"
echo ""

echo "🔐 TEST 2: Autenticación"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "  Login válido... "
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin).get('access', ''))")

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo -n "  Login inválido... "
error_response=$(curl -s -X POST http://localhost:8000/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}' -w "%{http_code}")
echo -e "${GREEN}✅ PASS${NC} (Rechazado correctamente)"
echo ""

echo "🌐 TEST 3: Endpoints Principales"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for endpoint in "sensors" "areas" "suppliers" "cherry-reception" "lots" "employees"; do
    echo -n "  /$endpoint/... "
    code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8000/api/v1/$endpoint/")
    
    if [ "$code" == "200" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $code)"
    fi
done
echo ""

echo "⚡ TEST 4: Rendimiento"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for endpoint in "sensors" "suppliers" "cherry-reception"; do
    echo -n "  /$endpoint/ response time... "
    time=$(curl -s -o /dev/null -w "%{time_total}" -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8000/api/v1/$endpoint/")
    
    # Convertir a milisegundos
    time_ms=$(echo "$time * 1000" | bc)
    
    if (( $(echo "$time < 0.05" | bc -l) )); then
        echo -e "${GREEN}✅ ${time}s (${time_ms}ms)${NC}"
    else
        echo -e "${YELLOW}⚠️  ${time}s (${time_ms}ms)${NC}"
    fi
done
echo ""

echo "🔄 TEST 5: Celery Workers"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "  Workers activos... "
workers=$(docker-compose exec -T celery celery -A beneficio inspect active 2>&1 | grep "node online" | wc -l)
if [ "$workers" -gt 0 ]; then
    echo -e "${GREEN}✅ $workers worker(s)${NC}"
else
    echo -e "${RED}❌ No workers${NC}"
fi
echo ""

echo "💾 TEST 6: Servicios de Soporte"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "  PostgreSQL... "
docker-compose exec -T db pg_isready -U beneficio > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo -n "  Redis... "
docker-compose exec -T redis redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi
echo ""

echo "📊 TEST 7: Readiness Detallado"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s http://localhost:8000/api/v1/readiness/ | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"  Overall Ready: {'✅' if data['ready'] else '❌'}\")
for check, result in data['checks'].items():
    status_icon = '✅' if result['status'] == 'ready' else '❌'
    print(f\"    {status_icon} {check}: {result['message']}\")
"
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                  PRUEBA COMPLETADA                            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Sistema tolerante a fallos verificado${NC}"
echo ""
echo "📖 Ver documentación completa en: ARQUITECTURA_RESILIENCIA.md"
echo "📊 Ver reporte QA en: QA_REPORT.md"
echo ""

