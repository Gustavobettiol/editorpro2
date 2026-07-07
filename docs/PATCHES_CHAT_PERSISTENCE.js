/**
 * PARCHES PARA EDITOR.JS - PERSISTENCIA DE CHAT
 * 
 * Aplicar estos cambios al editor.js para habilitar:
 * - Historial de chat persistente
 * - Sesiones
 * - Limpieza de chat
 */

// =========================================
// PARCHE 1: AGREGAR AL ESTADO GLOBAL (línea ~11)
// =========================================

/*
Busca:
  let state = {
    projectRoot: '',
    openFiles: [],
    activeFileIndex: 0,
    expandedFolders: new Set(),
    chatHistory: [],
    terminalHistory: [],
    chatProvider: 'lmstudio',
    chatModel: '',
    aiStatus: { lmstudio: false, ollama: false }
  };

Reemplaza con:
*/

let state = {
  projectRoot: '',
  openFiles: [],
  activeFileIndex: 0,
  expandedFolders: new Set(),
  chatHistory: [],
  terminalHistory: [],
  chatProvider: 'lmstudio',
  chatModel: '',
  aiStatus: { lmstudio: false, ollama: false },
  sessionId: localStorage.getItem('chatSessionId') || 'session-' + Date.now() // NUEVO
};

// Guardar sessionId en localStorage
if (!localStorage.getItem('chatSessionId')) {
  localStorage.setItem('chatSessionId', state.sessionId);
}

// =========================================
// PARCHE 2: CARGAR HISTORIAL AL INICIAR (en función init())
// =========================================

/*
En la función init(), agrega esto después de cargar la información del proyecto:
*/

// Cargar historial de chat persistente
async function loadChatHistory() {
  try {
    const response = await fetch(`/chat-history?sessionId=${state.sessionId}`);
    const history = await response.json();
    state.chatHistory = history || [];
    
    // Mostrar mensajes previos
    for (const msg of state.chatHistory) {
      if (msg.role) {
        addChatMessage(msg.content, msg.role);
      }
    }
    
    console.log(`✓ Historial cargado: ${state.chatHistory.length} mensajes`);
  } catch (error) {
    console.error('Error cargando historial:', error);
  }
}

// Llamar después de inicializar Monaco
loadChatHistory();

// =========================================
// PARCHE 3: ACTUALIZAR sendChatMessage() 
// =========================================

/*
En la función sendChatMessage(), actualiza el fetch a /chat:

Busca:
  const response = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      provider: state.chatProvider,
      model: document.getElementById('chatModel').value,
      history: state.chatHistory
    })
  });

Reemplaza con:
*/

const response = await fetch('/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: message,
    provider: state.chatProvider,
    model: document.getElementById('chatModel').value,
    history: state.chatHistory,
    sessionId: state.sessionId // NUEVO - pasar sessionId
  })
});

// =========================================
// PARCHE 4: AGREGAR BOTÓN PARA LIMPIAR CHAT
// =========================================

/*
En editor.html, encuentra la sección del chat (busca por "chatMessages")
y agrega este botón cerca de los otros controles del chat:

HTML a agregar en editor.html (dentro del panel de chat):
*/

// Después del botón de ejecutar, agrega:
`<button id="clearChatBtn" class="chat-btn" title="Limpiar historial de chat">
  🗑️ Limpiar Chat
</button>`

// Luego, en editor.js, agrega este listener (dentro de init() o initEventListeners()):

document.getElementById('clearChatBtn').addEventListener('click', async () => {
  if (!confirm('¿Deseas borrar todo el historial del chat?')) return;
  
  try {
    const response = await fetch('/clear-chat-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId })
    });
    
    const data = await response.json();
    if (data.success) {
      state.chatHistory = [];
      document.getElementById('chatMessages').innerHTML = '';
      addChatMessage('✅ Historial limpiado', 'system');
    }
  } catch (error) {
    addChatMessage(`❌ Error limpiando historial: ${error.message}`, 'assistant');
  }
});

// =========================================
// PARCHE 5: AGREGAR INFORMACIÓN DE SESIÓN
// =========================================

/*
En el footer o barra de estado, agrega esto para mostrar el ID de sesión:

En editor.html, busca la barra de estado y agrega:
*/

`<span id="sessionInfo">Sesión: ${state.sessionId}</span>`

// O añade en CSS:

#sessionInfo {
  color: #888;
  font-size: 12px;
  margin-left: auto;
  font-family: monospace;
}

// =========================================
// PARCHE 6: AGREGAR FUNCIÓN PARA EXPORTAR CHAT
// =========================================

/*
Función para descargar el historial del chat como JSON:
*/

async function exportChatHistory() {
  try {
    const response = await fetch(`/chat-history?sessionId=${state.sessionId}`);
    const history = await response.json();
    
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${state.sessionId}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    addChatMessage('✅ Historial exportado', 'system');
  } catch (error) {
    addChatMessage(`❌ Error exportando: ${error.message}`, 'assistant');
  }
}

// =========================================
// PARCHE 7: MIGRAR SESIONES (OPCIONAL)
// =========================================

/*
Si el usuario tiene múltiples navegadores, puede cambiar de sesión:
*/

function switchChatSession(newSessionId) {
  localStorage.setItem('chatSessionId', newSessionId);
  state.sessionId = newSessionId;
  state.chatHistory = [];
  document.getElementById('chatMessages').innerHTML = '';
  loadChatHistory();
  addChatMessage(`✅ Sesión cambiada: ${newSessionId}`, 'system');
}

// =========================================
// IMPLEMENTACIÓN COMPLETA
// =========================================

/*
Orden de aplicación:
1. Reemplaza el objeto state (PARCHE 1)
2. Agrega loadChatHistory() y llámalo en init() (PARCHE 2)
3. Actualiza sendChatMessage() (PARCHE 3)
4. Agrega botón en HTML y su listener (PARCHE 4)
5. Agrega indicador de sesión (PARCHE 5)
6. Agrega exportChatHistory() (PARCHE 6)
7. Agrega switchChatSession() (PARCHE 7)

Alternativa: Aplica directamente usando editor-v2.js (abajo)
*/

// =========================================
// FUNCIÓN HELPER: addChatMessage (por si no existe)
// =========================================

function addChatMessage(text, role) {
  const messagesDiv = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${role}`;
  
  // Procesar markdown simple
  let html = text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  
  messageDiv.innerHTML = html;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// =========================================
// NOTA IMPORTANTE
// =========================================

/*
El nuevo server-v2.js incluye:
✓ Persistencia automática de chat en JSON
✓ Almacenamiento en .editor-data/chat-history/
✓ Límite de 100 mensajes por sesión
✓ Timestamps automáticos
✓ API /chat-history para cargar
✓ API /clear-chat-history para limpiar

Solo necesitas aplicar los parches al editor.js para que cargue
el historial al iniciar. El servidor ya se encarga del guardado.
*/
