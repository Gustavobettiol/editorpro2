# Guía: Configuración para Generar Imágenes

## 🎯 Requisitos Previos

### Hardware Mínimo
- **GPU**: NVIDIA con 8GB+ VRAM (o equivalente AMD)
- **RAM**: 32GB mínimo
- **Espacio**: 20-30GB para modelos
- **Disco SSD**: Recomendado para mejor rendimiento

### Software
- **Node.js**: v18.0.0 o superior
- **LM Studio**: v0.2.0 o superior
- **npm**: versión reciente

---

## 📦 Instalación de Dependencias

### 1. Actualizar Node Packages
```bash
npm install --legacy-peer-deps
```

Esto instala:
- **sharp**: Procesamiento de imágenes
- **canvas**: Manipulación de gráficos
- **axios**: Cliente HTTP mejorado
- **dotenv**: Configuración de variables de entorno

### 2. Instalar Dependencias Opcionales del Sistema
**Para Windows (PowerShell - como Admin):**
```powershell
# Si necesitas canvas con soporte completo
npm install canvas --build-from-source
```

**Para Linux/Mac:**
```bash
sudo apt-get install build-essential python3
npm install sharp --build-from-source
```

---

## 🖼️ Modelos para Generar Imágenes

### Modelos Recomendados en LM Studio

| Modelo | Tamaño | Velocidad | Calidad | VRAM |
|--------|--------|-----------|---------|------|
| Stable Diffusion 3 | ~7GB | Lenta | Excelente | 8GB+ |
| SDXL Turbo | ~6GB | Rápida | Muy Buena | 6GB+ |
| Flux Schnell | ~13GB | Normal | Excelente | 10GB+ |
| DreamShaper | ~4GB | Muy Rápida | Buena | 4GB+ |

### Pasos para Cargar Modelo de Imagen

1. **Abre LM Studio**
2. Ve a **Search** y busca "stable diffusion" o "flux"
3. Selecciona el modelo deseado
4. Click en **Download**
5. Una vez descargado, click en el ▶️ (play) para cargar el modelo
6. Verifica que aparezca en la pestaña **Loaded Models**

---

## ⚙️ Configuración de LM Studio

### Para Activar API de Generación de Imágenes

1. En LM Studio, ve a **Developer** > **API Server**
2. Asegúrate que esto esté habilitado:
   ```
   - Chat Completions: ✓
   - Completions: ✓
   - Embeddings: ✓
   - Images: ✓ (IMPORTANTE)
   ```
3. Verifica el puerto (por defecto `1234`)
4. Los endpoints disponibles serán:
   ```
   GET  http://127.0.0.1:1234/v1/models
   POST http://127.0.0.1:1234/v1/chat/completions
   POST http://127.0.0.1:1234/v1/images/generations
   ```

---

## 🎮 Usar la Generación de Imágenes

### Desde el Editor Web

```javascript
// Ejemplo de solicitud
fetch('http://localhost:3000/api/generate-image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: "Un gato durmiendo en un sillón cómodo, estilo digital art",
    model: "stable-diffusion-xl", // o el modelo que tengas cargado
    width: 512,
    height: 512,
    steps: 25,
    guidance_scale: 7.5
  })
})
.then(res => res.json())
.then(data => console.log('Imagen generada:', data.url))
```

### Parámetros Disponibles

| Parámetro | Tipo | Rango | Descripción |
|-----------|------|-------|-------------|
| `prompt` | string | - | Descripción de la imagen que deseas |
| `negative_prompt` | string | - | Qué NO quieres en la imagen |
| `width` | number | 256-2048 | Ancho de la imagen (múltiplos de 64) |
| `height` | number | 256-2048 | Alto de la imagen (múltiplos de 64) |
| `steps` | number | 1-50 | Iteraciones (más = mejor calidad, más lento) |
| `guidance_scale` | number | 1-20 | Adherencia al prompt (7.5 es común) |
| `seed` | number | -1 a ∞ | Para reproducibilidad (-1 = aleatorio) |

---

## 🚀 Optimización de Rendimiento

### Para Mejor Velocidad

1. **Usa modelos más pequeños**
   ```
   DreamShaper (4GB) vs Stable Diffusion 3 (7GB)
   ```

2. **Reduce dimensiones**
   ```
   512x512 en lugar de 768x768 o 1024x1024
   ```

3. **Baja los pasos**
   ```
   15-20 pasos en lugar de 50 (rápido pero ok)
   ```

4. **Activa cuantización en LM Studio**
   - Menores requisitos de VRAM
   - Menos calidad pero más rápido

### Para Mejor Calidad

1. **Incrementa los pasos** (30-50)
2. **Usa prompts más detallados**
   ```
   ❌ Mal: "gato"
   ✅ Bien: "Un gato naranja con ojos verdes, sentado, estilo 
   fotografía profesional 8k, iluminación suave, fondo desenfocado"
   ```
3. **Ajusta guidance_scale** (7.5-12 es ideal)

---

## 🐛 Troubleshooting

### Error: "Images endpoint not available"
- Verifica que LM Studio esté corriendo
- Comprueba que el modelo de imagen esté cargado
- Ve a LM Studio > Status y confirma que esté disponible

### Error: "Out of memory"
- Reduce las dimensiones de imagen
- Reduce los pasos
- Descarga modelos más pequeños
- Cierra otras aplicaciones

### Generación muy lenta
- El modelo está en CPU, no GPU
  - Solución: Ve a Settings en LM Studio > GPU
- Demasiados pasos
  - Solución: Reduce a 15-20 pasos

### Puerto 1234 en uso
- Cambia en LM Studio: Developer > API Server > Port
- Actualiza `.env` con el nuevo puerto

---

## 📝 Ejemplo Completo de Uso

```bash
# 1. Instala dependencias
npm install

# 2. Inicia LM Studio y carga modelo de imagen (Stable Diffusion XLBB, Flux, etc.)

# 3. Inicia el servidor
npm start

# 4. Abre en navegador
http://localhost:3000

# 5. Usa la interfaz para generar imágenes
# O haz llamadas HTTP al endpoint /api/generate-image
```

---

## 📡 Endpoints Disponibles

### POST /api/generate-image
Genera una imagen a partir de un prompt

**Request:**
```json
{
  "prompt": "Descripción de la imagen",
  "width": 512,
  "height": 512,
  "steps": 25,
  "guidance_scale": 7.5
}
```

**Response:**
```json
{
  "success": true,
  "url": "/generated_images/image_xxxxx.png",
  "timestamp": "2026-04-20T10:30:00Z"
}
```

---

## 💡 Tips Pro

1. **Guarda prompts efectivos** - Los buenos prompts son la clave
2. **Usa semillas (seeds)** - Para reproducir imágenes
3. **Experimenta con negative prompts** - Mejora mucho la calidad
4. **Combina modelos** - Usa diferentes modelos para casos diferentes
5. **Procesa en lotes** - Para múltiples imágenes

---

**Última actualización**: 20 de abril de 2026
