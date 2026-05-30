# Guía de Configuración de MCP para VS Code

Esta guía explica cómo conectar el servidor MCP (Model Context Protocol) de **Editor Pro** a VS Code para que la IA (como GitHub Copilot) pueda interactuar directamente con tu proyecto.

## Requisitos

- VS Code instalado.
- Extensión de GitHub Copilot Chat instalada.
- Node.js instalado en tu máquina.

## Pasos para la Configuración

### 1. Obtener la ruta del servidor

Asegúrate de conocer la ruta completa al archivo `mcp-server.js` en tu máquina. Por ejemplo:
`C:\proyectos\editorpro2\mcp-server.js` o `/home/usuario/editorpro2/mcp-server.js`.

### 2. Configurar VS Code

1. Abre VS Code.
2. Abre la paleta de comandos (`Ctrl+Shift+P` o `Cmd+Shift+P`).
3. Busca y selecciona **"Preferences: Open User Settings (JSON)"**.
4. Busca la sección `github.copilot.chat.mcp.servers` (o agrégala si no existe).
5. Añade la configuración del servidor:

```json
"github.copilot.chat.mcp.servers": {
  "editor-pro": {
    "command": "node",
    "args": ["/ruta/a/tu/proyecto/mcp-server.js"],
    "env": {}
  }
}
```

*Nota: Reemplaza `/ruta/a/tu/proyecto/mcp-server.js` con la ruta real de tu archivo.*

### 3. Reiniciar VS Code

Para que los cambios surtan efecto, reinicia VS Code.

### 4. Verificar en el Chat

En el chat de GitHub Copilot, ahora deberías poder pedir cosas como:
- "Lista los archivos de mi proyecto"
- "Lee el contenido de server-v2.js"

La IA utilizará automáticamente las herramientas proporcionadas por el servidor MCP para darte respuestas precisas basadas en tu código actual.

## Herramientas Disponibles

El servidor MCP de Editor Pro expone las siguientes herramientas:

- `list_files`: Permite a la IA ver la estructura de archivos de tu proyecto.
- `read_file`: Permite a la IA leer el contenido de cualquier archivo para analizarlo.
