# 📚 GUÍA DE DEPLOYMENT - Editor Pro 2

## Tabla de Contenidos
1. [Deployment en VPS](#deployment-en-vps)
2. [Configuración con Cloudflare](#configuración-con-cloudflare)
3. [Configuración de IA Remota](#configuración-de-ia-remota)
4. [Troubleshooting](#troubleshooting)

---

## Deployment en VPS

### Requisitos Previos
- Node.js 18+ instalado
- npm o yarn
- Acceso SSH al VPS
- Dominio (opcional pero recomendado)

### Paso 1: Preparar el VPS

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git

# Verificar instalación
node --version
npm --version
```

### Paso 2: Clonar o Cargar el Proyecto

```bash
# Opción A: Clonar desde GitHub (si tienes repo)
git clone https://github.com/tu-usuario/editor-pro2.git
cd editor-pro2

# Opción B: Transferir archivos con SCP
scp -r ./editor-pro2 usuario@tu-vps.com:/home/usuario/

# O usar rsync
rsync -avz ./editor-pro2/ usuario@tu-vps.com:/home/usuario/editor-pro2/
```

### Paso 3: Instalar Dependencias

```bash
cd ~/editor-pro2
npm install
```

### Paso 4: Configurar Environment

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus configuraciones
nano .env
```

**Ejemplo de .env para VPS:**
```
PORT=3000
NODE_ENV=production

# Si LM Studio está en la misma máquina
LM_STUDIO_URL=http://127.0.0.1:1234/v1/chat/completions
LM_STUDIO_MODELS_URL=http://127.0.0.1:1234/v1/models

# O si está en otra máquina
LM_STUDIO_URL=http://192.168.1.100:1234/v1/chat/completions
LM_STUDIO_MODELS_URL=http://192.168.1.100:1234/v1/models
```

### Paso 5: Usar PM2 para Ejecutar en Segundo Plano

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar la aplicación con PM2
pm2 start server-v2.js --name "editor-pro2"

# Configurar para que inicie al reiniciar
pm2 startup
pm2 save

# Verificar estado
pm2 status
pm2 logs editor-pro2
```

### Paso 6: Configurar Reverse Proxy con Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Crear configuración
sudo nano /etc/nginx/sites-available/editor-pro2
```

**Contenido de la configuración:**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Redirect HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com;

    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/editor-pro2 /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Paso 7: Configurar SSL con Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado
sudo certbot certonly --nginx -d tu-dominio.com

# Renovación automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## Configuración con Cloudflare

### Opción 1: Usar Cloudflare como CDN

Si tu servidor está en VPS, puedes usar Cloudflare como proxy/CDN:

1. **Registrar dominio en Cloudflare**
   - Ve a cloudflare.com
   - Agrega tu dominio
   - Actualiza los nameservers en tu registrador

2. **Configurar DNS en Cloudflare**
   - Tipo: A
   - Nombre: tu-dominio.com (o subdomain)
   - IPv4: IP de tu VPS
   - Proxy: Proxied (nube naranja)

3. **Habilitar SSL/TLS**
   - En Cloudflare: SSL/TLS > Overview
   - Selecciona "Flexible" o "Full"

4. **Configurar reglas (opcional)**
   - Cloudflare > Rules > Firewall Rules
   - Agrega protección contra bots
   - Rate limiting

### Opción 2: Usar Cloudflare Workers (Advanced)

Para un setup más avanzado con Workers:

```javascript
// wrangler.toml
name = "editor-pro2"
main = "src/index.js"
compatibility_date = "2024-01-01"

[env.production]
routes = [
  { pattern = "tu-dominio.com/*", zone_name = "tu-dominio.com" }
]
```

```javascript
// src/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Proxy a tu VPS
    if (url.pathname.startsWith('/api')) {
      return fetch(new Request('https://tu-vps.com' + url.pathname, request));
    }
    
    // Servir desde Cloudflare
    return fetch(request);
  }
};
```

Deploy con Wrangler:
```bash
npm install -g wrangler
wrangler publish
```

---

## Configuración de IA Remota

### Opción 1: LM Studio en otra máquina

En la máquina con LM Studio:

1. **Habilitar acceso remoto en LM Studio**
   - Settings > Server
   - Cambiar binding de localhost a 0.0.0.0

2. **En el VPS, configurar .env:**
```
LM_STUDIO_URL=http://192.168.1.100:1234/v1/chat/completions
LM_STUDIO_MODELS_URL=http://192.168.1.100:1234/v1/models
```

### Opción 2: Usar API externa (OpenAI, etc.)

Modificar server-v2.js para soportar OpenAI:

```javascript
// Agregar a server-v2.js
app.post("/chat-openai", async (req, res) => {
  const { message, history = [] } = req.body;
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [...history, { role: "user", content: message }]
    })
  });
  
  const data = await response.json();
  res.json({ response: data.choices[0].message.content });
});
```

---

## Troubleshooting

### El servidor no inicia

```bash
# Ver logs
pm2 logs editor-pro2

# O ejecutar directamente
npm start

# Verificar puerto
sudo netstat -tlnp | grep 3000
```

### No se puede conectar a LM Studio

```bash
# Verificar que LM Studio está corriendo
curl http://127.0.0.1:1234/v1/models

# Desde otra máquina
curl http://192.168.1.100:1234/v1/models

# Si falla, revisar firewall
sudo ufw allow 1234
```

### Archivos no persisten

```bash
# Verificar permisos
ls -la /home/usuario/editor-pro2/.editor-data

# Asegurar permisos
chmod -R 755 /home/usuario/editor-pro2/.editor-data

# Verificar espacio disponible
df -h
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar que Node está corriendo
pm2 status

# Revisar logs de Nginx
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### CORS issues

Ya está configurado en server-v2.js, pero si necesitas ajustarlo:

```javascript
const corsOptions = {
  origin: 'https://tu-dominio.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
```

---

## Monitoreo

### Ver uso de recursos

```bash
# Con PM2
pm2 monit

# O con htop
htop

# Logs en tiempo real
pm2 logs editor-pro2 --lines 100
```

### Backup de datos

```bash
# Hacer backup del historial de chat
tar -czf chat-backup-$(date +%Y%m%d).tar.gz .editor-data/

# O copiar a otra máquina
scp -r usuario@vps.com:/home/usuario/editor-pro2/.editor-data ./backup/
```

---

## Actualización

Para actualizar a una nueva versión:

```bash
# Detener aplicación
pm2 stop editor-pro2

# Actualizar código
git pull origin main
# O
rsync -avz ./editor-pro2/ usuario@vps.com:/home/usuario/editor-pro2/

# Instalar nuevas dependencias si hay
npm install

# Reiniciar
pm2 start editor-pro2
```

---

## Seguridad

### Recomendaciones:

1. **Usar HTTPS siempre** (Let's Encrypt + Nginx)
2. **Firewall habilitado**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

3. **Actualizaciones del sistema**
   ```bash
   sudo apt install -y unattended-upgrades
   ```

4. **Proteger .env**
   ```bash
   chmod 600 .env
   ```

5. **Restricción de acceso (opcional)**
   - En Cloudflare: Firewall Rules
   - En Nginx: IP whitelist

---

¡Listo! Tu Editor Pro 2 está en línea y accesible globalmente.
