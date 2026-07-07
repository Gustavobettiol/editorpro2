# 🚀 GUÍA DE DESPLIEGUE EN RENDER - Editor Pro 2

Este proyecto está configurado para desplegarse fácilmente en **Render**. Sigue estas especificaciones:

## 📋 Especificaciones del Servicio

| Campo | Valor |
|-------|-------|
| **Service Type** | Web Service |
| **Runtime** | Node |
| **Root Directory** | `.` (Raíz) |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | Free |

## 🔑 Variables de Entorno (Environment Variables)

Añade estas variables en la pestaña **Environment** de tu servicio en Render:

| Variable | Valor Sugerido | Descripción |
|----------|----------------|-------------|
| `PORT` | `3000` | Puerto en el que corre la app |
| `NODE_ENV` | `production` | Modo de ejecución |
| `LM_STUDIO_URL` | `http://tu-ip:1234/v1/chat/completions` | URL de tu instancia de LM Studio (opcional) |
| `OLLAMA_URL` | `http://tu-ip:11434/api/generate` | URL de tu instancia de Ollama (opcional) |

## 🛠️ Solución a errores comunes

### Error: "Couldn't find a package.json"
Si tus archivos están dentro de una subcarpeta en GitHub, debes configurar el **Root Directory** en Render con el nombre de esa carpeta (ej: `ai-studio-applet`). Si están en la raíz del repositorio, déjalo vacío o pon `.`.

### Persistencia de Datos
En el plan **Free** de Render, los archivos del historial de chat en `.editor-data/` se borrarán cada vez que el servicio se reinicie. Para persistencia real, se recomienda usar un **Render Disk** (requiere plan de pago) montado en `/.editor-data`.

---
*Editor Pro 2 - Desarrollado para alta productividad.*
