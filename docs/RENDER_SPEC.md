# 🚀 GUÍA DE DESPLIEGUE EN RENDER - Nocturnal Pro

Este proyecto está optimizado para desplegarse en **Render**. A continuación, las especificaciones exactas para evitar errores comunes.

---

## 🛠️ Solución al Error Crítico: "Couldn't find a package.json"

Este es el fallo más común cuando se despliega desde un repositorio que tiene el proyecto en una subcarpeta.

1. Ve al panel de control de tu servicio en Render.
2. Ve a la pestaña **Settings** (Configuración).
3. Busca el campo **Root Directory** (Directorio Raíz).
4. Escribe el nombre exacto de la carpeta contenedora (ej: `ai-studio-applet` o déjalo vacío si está en la raíz).
5. Guarda los cambios y Render reiniciará la compilación detectando correctamente el `package.json`.

---

## 📦 Método A: Despliegue Estándar (Recomendado)

Compila la aplicación directamente sobre el entorno Node.js de Render.

### Especificaciones:
* **Environment / Runtime:** `Node`
* **Region:** Selecciona la más cercana (ej: Oregon o Frankfurt).
* **Branch:** `main`
* **Build Command:** `npm install`
* **Start Command:** `npm start`
* **Plan:** `Free`

### Variables de Entorno:
* `NODE_VERSION`: `20` (Recomendado)
* `PORT`: `3000`
* `GEMINI_API_KEY`: (Tu clave de API de Gemini)
* `ADMIN_PASSWORD`: (Tu contraseña para ejecutar comandos en la terminal)

---

## ⚠️ Seguridad en Producción

Por defecto, los endpoints de **Terminal** (`/execute`) y **Acciones de Archivo** (`/chat-execute`) están protegidos en modo producción.

Si configuras `NODE_ENV=production`, deberás asegurarte de que tu frontend envíe la cabecera `Authorization: Bearer <ADMIN_PASSWORD>` o las peticiones fallarán con un error 401.

---

## 🐳 Método B: Despliegue con Docker

Si prefieres usar contenedores para mayor aislamiento.

### Especificaciones:
* **Environment / Runtime:** `Docker`
* **Root Directory:** (Igual que en el Método A)
* **Dockerfile Path:** `Dockerfile` (Si existe)
* **Plan:** `Free`

---

## 🎬 Nocturnal Video Player
La aplicación incluye un panel interactivo de streaming diseñado para funcionar perfectamente con:
* Streams **HLS (.m3u8)** de alta calidad.
* Videos directos (MP4, WebM).
* Integración con YouTube.

*Desarrollado para Nocturnal App - Potencia y Estilo.*
