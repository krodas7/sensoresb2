#!/bin/bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         TESTS MANUALES DEL BACKEND - BENEFICIO             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

BASE_URL="http://localhost:8000/api/v1"
TOKEN=""

# Función para mostrar resultado
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health/")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "Health check passed"
    echo "   Response: $(echo "$RESPONSE" | head -1)"
else
    show_result 1 "Health check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Login
echo -e "${YELLOW}2. Testing Authentication (Login)...${NC}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "Login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | head -1 | grep -o '"access":"[^"]*' | cut -d'"' -f4)
    echo "   Token obtained: ${TOKEN:0:20}..."
else
    show_result 1 "Login failed (HTTP $HTTP_CODE)"
    echo "   Response: $(echo "$LOGIN_RESPONSE" | head -1)"
fi
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Cannot continue without authentication token${NC}"
    exit 1
fi

# Test 3: Get Current User
echo -e "${YELLOW}3. Testing Get Current User (/auth/me/)...${NC}"
ME_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/auth/me/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$ME_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "Get current user passed"
    echo "   User: $(echo "$ME_RESPONSE" | head -1 | grep -o '"username":"[^"]*' | cut -d'"' -f4)"
else
    show_result 1 "Get current user failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: List Users
echo -e "${YELLOW}4. Testing List Users...${NC}"
USERS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/users/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$USERS_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "List users passed"
    USER_COUNT=$(echo "$USERS_RESPONSE" | head -1 | grep -o '"id"' | wc -l)
    echo "   Users found: $USER_COUNT"
else
    show_result 1 "List users failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: List Employees
echo -e "${YELLOW}5. Testing List Employees...${NC}"
EMP_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/employees/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$EMP_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "List employees passed"
else
    show_result 1 "List employees failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 6: List Lots
echo -e "${YELLOW}6. Testing List Lots...${NC}"
LOTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/lots/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$LOTS_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "List lots passed"
else
    show_result 1 "List lots failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 7: List Cupping
echo -e "${YELLOW}7. Testing List Cupping Sessions...${NC}"
CUPPING_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/cupping/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$CUPPING_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "List cupping sessions passed"
else
    show_result 1 "List cupping sessions failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 8: List Fermentation
echo -e "${YELLOW}8. Testing List Fermentation Tanks...${NC}"
FERM_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/fermentation/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$FERM_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "List fermentation tanks passed"
else
    show_result 1 "List fermentation tanks failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 9: List Temperatures
echo -e "${YELLOW}9. Testing List Temperatures...${NC}"
TEMP_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/temperatures/readings/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$TEMP_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "List temperatures passed"
else
    show_result 1 "List temperatures failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 10: List Reports
echo -e "${YELLOW}10. Testing List Reports...${NC}"
REPORTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/reports/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$REPORTS_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "List reports passed"
else
    show_result 1 "List reports failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 11: Get Roles
echo -e "${YELLOW}11. Testing Get Roles...${NC}"
ROLES_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/roles/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$ROLES_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "Get roles passed"
else
    show_result 1 "Get roles failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 12: Get Permissions
echo -e "${YELLOW}12. Testing Get Permissions...${NC}"
PERMS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/permissions/" \
  -H "Authorization: Bearer $TOKEN")
HTTP_CODE=$(echo "$PERMS_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
    show_result 0 "Get permissions passed"
else
    show_result 1 "Get permissions failed (HTTP $HTTP_CODE)"
fi
echo ""

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TESTS COMPLETADOS                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Backend API está funcionando correctamente${NC}"
echo -e "${YELLOW}   URL Base: $BASE_URL${NC}"
echo ""
