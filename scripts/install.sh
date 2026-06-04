#!/bin/bash

# Configuración
API_URL="http://localhost:3000/validate" # Cambiar por la IP real del servidor

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}       INSTALADOR SCRIPT ADM RUFFU      ${NC}"
echo -e "${YELLOW}========================================${NC}"

# Obtener HWID único del VPS
if [ -f /etc/machine-id ]; then
    HWID=$(cat /etc/machine-id)
elif [ -f /var/lib/dbus/machine-id ]; then
    HWID=$(cat /var/lib/dbus/machine-id)
else
    HWID=$(hostname)
fi

echo -e "Tu HWID: ${GREEN}$HWID${NC}"
echo -ne "Introduce tu Key de acceso: "
read USER_KEY

if [ -z "$USER_KEY" ]; then
    echo -e "${RED}Error: La key no puede estar vacía.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Validando acceso...${NC}"

# Validar con la API
RESPONSE=$(curl -s -X POST "$API_URL" \
     -H "Content-Type: application/json" \
     -d "{\"key\": \"$USER_KEY\", \"hwid\": \"$HWID\"}")

VALID=$(echo $RESPONSE | grep -o '"valid":true')

if [ ! -z "$VALID" ]; then
    MESSAGE=$(echo $RESPONSE | grep -oP '"message":"\K[^"]+')
    echo -e "${GREEN}¡Acceso Concedido!${NC}"
    echo -e "Mensaje: $MESSAGE"
    echo -e "\nIniciando menú de administración de protocolos..."
    sleep 2
    # Aquí iría el resto del script de administración (SSH, SSL, etc.)
    echo -e "${YELLOW}[MENU SIMULADO]${NC}"
    echo "1) SSH Manager"
    echo "2) SSL/TLS (Stunnel)"
    echo "3) V2Ray / Shadowsocks"
    echo "4) Herramientas"
    echo "0) Salir"
else
    MESSAGE=$(echo $RESPONSE | grep -oP '"message":"\K[^"]+')
    echo -e "${RED}Acceso Denegado.${NC}"
    echo -e "Motivo: ${YELLOW}$MESSAGE${NC}"
    exit 1
fi
