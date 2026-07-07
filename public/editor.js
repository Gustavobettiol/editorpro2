// =========================================
// Estado Global
// =========================================

let editor;
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
  sessionId: localStorage.getItem('chatSessionId') || 'session-' + Date.now()
};

// Guardar sessionId en localStorage
if (!localStorage.getItem('chatSessionId')) {
  localStorage.setItem('chatSessionId', state.sessionId);
}

// Split Divider State
let isResizing = false;
let lastY = 0;

async function fetchJsonOrThrow(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  let payload = null;
  let rawText = '';

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch (error) {
      throw new Error(`Respuesta JSON invalida en ${url}`);
    }
  } else {
    rawText = await response.text();
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch (error) {
        // Keep raw text for HTTP error diagnostics.
      }
    }
  }

  if (!response.ok) {
    const serverMessage = payload?.error || payload?.message;
    const fallback = rawText ? rawText.slice(0, 180) : `HTTP ${response.status} ${response.statusText}`;
    throw new Error(serverMessage || fallback);
  }

  if (payload === null) {
    throw new Error(`Respuesta invalida en ${url}`);
  }

  return payload;
}

// =========================================
// Split Divider Initialization
// =========================================

function initSplitDivider() {
  const divider = document.getElementById('splitDivider');
  const container = document.querySelector('.split-container');
  const editorPane = document.querySelector('.editor-pane');
  const terminalPane = document.querySelector('.terminal-pane');

  divider.addEventListener('mousedown', (e) => {
    isResizing = true;
    lastY = e.clientY;
    divider.classList.add('dragging');
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const deltaY = e.clientY - lastY;
    const editorHeight = editorPane.clientHeight + deltaY;
    const terminalHeight = terminalPane.clientHeight - deltaY;
    const minHeight = 80;

    if (editorHeight > minHeight && terminalHeight > minHeight) {
      editorPane.style.flex = '0';
      editorPane.style.height = editorHeight + 'px';
      terminalPane.style.flex = '0';
      terminalPane.style.height = terminalHeight + 'px';
      lastY = e.clientY;

      // Trigger layout en Monaco mientras se redimensiona
      if (editor) {
        editor.layout();
      }
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
    divider.classList.remove('dragging');

    // Asegurar layout final
    if (editor) {
      setTimeout(() => {
        editor.layout();
      }, 10);
    }
  });
}

// =========================================
// Inicialización
// =========================================

async function init() {
  // Inicializar split divider
  initSplitDivider();

  // Cargar información del proyecto
  try {
    const projectInfo = await fetchJsonOrThrow('/project-info');
    state.projectRoot = projectInfo.rootPath;
    document.getElementById('projectName').textContent = `📁 ${projectInfo.projectName}`;

    // Actualizar info de sesión en el UI
    const sessionInfo = document.getElementById('sessionInfo');
    if (sessionInfo) {
      sessionInfo.textContent = `Sesión: ${state.sessionId}`;
    }
  } catch (e) {
    console.error('Error cargando proyecto:', e);
  }

  // Cargar historial de chat persistente
  await loadChatHistory();

  // Inicializar Monaco Editor
  require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
  require(['vs/editor/editor.main'], () => {
    try {
      const container = document.getElementById('editorContainer');

      // Asegurar que el contenedor tenga tamaño
      if (!container) {
        console.error('editorContainer no encontrado');
        return;
      }

      editor = monaco.editor.create(container, {
        value: '// Bienvenido a Editor Pro 2\n// Selecciona un archivo para comenzar',
        language: 'javascript',
        theme: 'vs-dark',
        fontSize: 14,
        fontFamily: '"Consolas", "Monaco", monospace',
        minimap: { enabled: true },
        automaticLayout: true,
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        mouseWheelZoom: true
      });

      // Forzar resizing después de un pequeno delay
      setTimeout(() => {
        editor.layout();
      }, 100);

      editor.onDidChangeModelContent(() => {
        if (state.activeFileIndex >= 0 && state.openFiles[state.activeFileIndex]) {
          state.openFiles[state.activeFileIndex].modified = true;
          renderTabs();
        }
      });

      console.log('Monaco Editor inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando Monaco:', error);
    }
  });

  // Cargar árbol de archivos
  await loadFileTree();

  // Cargar modelos de IA
  await updateModels();

  // Cargar guía de despliegue
  await loadDeployGuide();

  // Verificar estado de IA
  await checkAIStatus();

  // Agregar listener para tecla Enter en chat
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      sendChatMessage();
    }
  });

  // Agregar listener para tecla Enter en terminal
  document.getElementById('terminalInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      executeTerminalCommand();
    }
  });

  addTerminalLine('📌 Terminal inicializada. Escribe "help" para ver comandos.', 'info');
}

// =========================================
// Chat IA
// =========================================

async function updateModels() {
  const provider = document.getElementById('chatProvider').value;
  const modelSelect = document.getElementById('chatModel');
  state.chatProvider = provider;

  try {
    const data = await fetchJsonOrThrow(`/models?provider=${provider}`);

    modelSelect.innerHTML = '';
    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
      });
      state.chatModel = data.models[0];
    } else {
      const option = document.createElement('option');
      option.textContent = 'No hay modelos disponibles';
      modelSelect.appendChild(option);
    }
  } catch (error) {
    console.error('Error cargando modelos:', error);
    const option = document.createElement('option');
    option.textContent = 'Error cargando modelos';
    modelSelect.appendChild(option);
  }
}

async function checkAIStatus() {
  try {
    const data = await fetchJsonOrThrow('/ai-status');
    state.aiStatus = {
      lmstudio: data.lmstudio?.ok || false,
      ollama: data.ollama?.ok || false
    };
    updateChatStatus();
  } catch (e) {
    console.error('Error verificando IA:', e);
    updateChatStatus();
  }
}

function updateChatStatus() {
  const indicator = document.getElementById('chatStatus');
  const provider = document.getElementById('chatProvider').value;
  const isConnected = state.aiStatus[provider];

  if (isConnected) {
    indicator.classList.add('connected');
    indicator.title = `${provider.toUpperCase()} conectado`;
  } else {
    indicator.classList.remove('connected');
    indicator.title = `${provider.toUpperCase()} desconectado`;
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  let message = input.value.trim();

  if (!message) return;

  // Mostrar mensaje del usuario
  addChatMessage(message, 'user');
  input.value = '';
  input.style.height = 'auto';

  // Detectar si es un comando de acción
  const actionMatch = message.match(/^(crear|ejecutar|run|create|make|delete|rm)\s+(.+)/i);

  if (actionMatch) {
    const command = actionMatch[1].toLowerCase();
    const args = actionMatch[2];

    // Procesar comando de acción
    if (command === 'crear' || command === 'create' || command === 'make') {
      if (args.toLowerCase().startsWith('archivo')) {
        const fileMatch = args.match(/archivo\s+(.+?)\s+(?:con|with)?\s*(?:contenido|content)?\s*:?\s*(.+)/i) ||
                         args.match(/archivo\s+(.+)/i);
        if (fileMatch) {
          const fileName = fileMatch[1];
          const fileContent = fileMatch[2] || '';
          await chatExecuteAction('create-file', { path: fileName, content: fileContent });
          return;
        }
      } else if (args.toLowerCase().startsWith('carpeta')) {
        const folderMatch = args.match(/carpeta\s+(.+)/i);
        if (folderMatch) {
          const folderName = folderMatch[1];
          await chatExecuteAction('create-folder', { folderPath: folderName });
          return;
        }
      }
    } else if (command === 'ejecutar' || command === 'execute' || command === 'run') {
      await chatExecuteAction('terminal', { command: args });
      return;
    }
  }

  // Si no es un comando de acción, enviar al chat IA
  try {
    const data = await fetchJsonOrThrow('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        provider: state.chatProvider,
        model: document.getElementById('chatModel').value,
        history: state.chatHistory,
        sessionId: state.sessionId
      })
    });

    if (data.error) {
      addChatMessage(`❌ Error: ${data.error}`, 'assistant');
    } else {
      const response_text = data.response;
      addChatMessage(response_text, 'assistant');
      state.chatHistory.push({ role: 'user', content: message });
      state.chatHistory.push({ role: 'assistant', content: response_text });

      // Procesar acciones sugeridas por el chat
      await processChatActions(response_text);
    }
  } catch (error) {
    addChatMessage(`❌ Error de conexión: ${error.message}`, 'assistant');
  }
}

// Ejecutar acción desde el chat
async function chatExecuteAction(type, params) {
  try {
    let data;
    if (type === 'terminal') {
      const executeResponse = await fetchJsonOrThrow('/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'cmd', code: params.command || '' })
      });
      data = executeResponse.error
        ? { success: false, error: executeResponse.error }
        : { success: true, output: executeResponse.output, message: 'Comando ejecutado' };
    } else {
      data = await fetchJsonOrThrow('/chat-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...params })
      });
    }

    if (data.success) {
      addChatMessage(`✅ ${data.message || 'Acción completada'}\n${data.output || ''}`, 'assistant');
      addTerminalLine(`✅ ${data.message || 'Acción ejecutada'}`, 'success');

      // Actualizar el explorador si fue creación de archivo/carpeta
      if (type === 'create-file' || type === 'create-folder') {
        await loadFileTree();
      }
    } else {
      addChatMessage(`❌ Error: ${data.error}`, 'assistant');
      addTerminalLine(`❌ Error: ${data.error}`, 'error');
    }
  } catch (error) {
    addChatMessage(`❌ Error ejecutando acción: ${error.message}`, 'assistant');
  }
}

// Procesar acciones sugeridas por el chat (palabras clave)
async function processChatActions(text) {
  // Buscar sugerencias de acciones en la respuesta del chat
  const patterns = [
    { regex: /crear.*archivo.*`([^`]+)`/gi, action: 'file-created' },
    { regex: /crear.*carpeta.*`([^`]+)`/gi, action: 'folder-created' },
    { regex: /ejecutar.*`([^`]+)`/gi, action: 'command-executed' }
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern.regex);
    for (const match of matches) {
      if (match[1]) {
        console.log(`Acción sugerida: ${pattern.action} - ${match[1]}`);
        // Aquí podrías agregar lógica para ejecutar automáticamente
      }
    }
  }
}

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

async function loadChatHistory() {
  try {
    const history = await fetchJsonOrThrow(`/chat-history?sessionId=${state.sessionId}`);
    state.chatHistory = history || [];

    // Mostrar mensajes previos
    document.getElementById('chatMessages').innerHTML = '';
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

async function clearChatHistory() {
  if (!confirm('¿Deseas borrar todo el historial del chat?')) return;

  try {
    const data = await fetchJsonOrThrow('/clear-chat-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: state.sessionId })
    });

    if (data.success) {
      state.chatHistory = [];
      document.getElementById('chatMessages').innerHTML = '';
      addChatMessage('✅ Historial limpiado', 'assistant');
    }
  } catch (error) {
    addChatMessage(`❌ Error limpiando historial: ${error.message}`, 'assistant');
  }
}

async function exportChatHistory() {
  try {
    const history = await fetchJsonOrThrow(`/chat-history?sessionId=${state.sessionId}`);

    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-history-${state.sessionId}.json`;
    link.click();

    URL.revokeObjectURL(url);
    addChatMessage('✅ Historial exportado', 'assistant');
  } catch (error) {
    addChatMessage(`❌ Error exportando: ${error.message}`, 'assistant');
  }
}

async function loadDeployGuide() {
  const container = document.getElementById('deployGuideContent');
  try {
    const data = await fetchJsonOrThrow('/deploy-guide');
    // Simple markdown-ish to HTML conversion
    let html = data.content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/\| (.*) \| (.*) \|/g, '<tr><td>$1</td><td>$2</td></tr>')
      .replace(/---/g, '<hr>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');

    container.innerHTML = `<div style="padding: 10px;">${html}</div>`;
  } catch (error) {
    container.innerHTML = `<p style="color: var(--error);">Error cargando guía: ${error.message}</p>`;
  }
}

function loadVideo() {
  const url = document.getElementById('videoUrlInput').value.trim();
  const display = document.getElementById('videoDisplay');

  if (!url) return;

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let videoId = '';
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else {
      videoId = url.split('/').pop();
    }
    display.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  } else if (url.endsWith('.m3u8')) {
    // Para HLS necesitamos una librería como hls.js, pero por ahora usamos el tag de video nativo que funciona en Safari/Chrome Android
    display.innerHTML = `<video controls width="100%" height="100%" style="object-fit: contain;">
      <source src="${url}" type="application/x-mpegURL">
      Tu navegador no soporta HLS nativo.
    </video>`;
  } else {
    display.innerHTML = `<video controls width="100%" height="100%" style="object-fit: contain;">
      <source src="${url}">
      Tu navegador no soporta este formato de video.
    </video>`;
  }
}

// =========================================
// File Tree
// =========================================

async function loadFileTree() {
  try {
    const tree = await fetchJsonOrThrow('/file-tree');
    const treeContainer = document.getElementById('fileTree');
    treeContainer.innerHTML = '';
    tree.forEach(node => {
      treeContainer.appendChild(renderTreeNode(node, 0));
    });
  } catch (error) {
    console.error('Error cargando árbol:', error);
  }
}

function renderTreeNode(node, depth) {
  const div = document.createElement('div');
  div.className = 'tree-node';
  div.style.marginLeft = `${depth * 12}px`;

  const content = document.createElement('div');
  content.className = 'tree-node-content';

  if (node.type === 'directory') {
    const toggle = document.createElement('button');
    toggle.className = 'tree-toggle';
    toggle.textContent = state.expandedFolders.has(node.path) ? '▼' : '▶';
    toggle.onclick = (e) => {
      e.stopPropagation();
      if (state.expandedFolders.has(node.path)) {
        state.expandedFolders.delete(node.path);
      } else {
        state.expandedFolders.add(node.path);
      }
      loadFileTree();
    };
    content.appendChild(toggle);

    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = '📁';
    content.appendChild(icon);

    const name = document.createElement('span');
    name.textContent = node.name;
    content.appendChild(name);

    div.appendChild(content);

    if (state.expandedFolders.has(node.path) && node.children) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'tree-children';
      node.children.forEach(child => {
        childrenDiv.appendChild(renderTreeNode(child, depth + 1));
      });
      div.appendChild(childrenDiv);
    }
  } else {
    const icon = document.createElement('span');
    icon.className = 'tree-icon';
    icon.textContent = getFileIcon(node.name);
    content.appendChild(icon);

    const name = document.createElement('span');
    name.textContent = node.name;
    content.appendChild(name);

    content.onclick = (e) => {
      e.stopPropagation();
      loadFile(node.path, node.language);
    };

    div.appendChild(content);
  }

  return div;
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    'js': '📜', 'ts': '📘', 'json': '📋', 'html': '🌐', 'css': '🎨',
    'py': '🐍', 'java': '☕', 'xml': '📄', 'md': '📝', 'txt': '📄'
  };
  return icons[ext] || '📄';
}

async function loadFile(path, language) {
  try {
    const data = await fetchJsonOrThrow(`/read-file?path=${encodeURIComponent(path)}`);

    // Agregar/actualizar archivo en openFiles
    let fileIndex = state.openFiles.findIndex(f => f.path === path);
    if (fileIndex === -1) {
      state.openFiles.push({
        path: path,
        content: data.content,
        language: data.language || language,
        modified: false
      });
      fileIndex = state.openFiles.length - 1;
    }

    state.activeFileIndex = fileIndex;

    if (editor) {
      editor.setModel(
        monaco.editor.createModel(
          state.openFiles[fileIndex].content,
          getMonacoLanguage(state.openFiles[fileIndex].language),
          monaco.Uri.parse(`file:///${path}`)
        )
      );

      // Trigger layout después de cambiar modelo
      setTimeout(() => {
        if (editor) editor.layout();
      }, 50);
    }

    renderTabs();
    document.getElementById('currentFile').textContent = `📄 ${path}`;
  } catch (error) {
    console.error('Error cargando archivo:', error);
  }
}

function getMonacoLanguage(lang) {
  const mapping = {
    'python': 'python',
    'java': 'java',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'xml': 'xml',
    'markdown': 'markdown',
    'plaintext': 'plaintext'
  };
  return mapping[lang] || 'plaintext';
}

function renderTabs() {
  const tabsContainer = document.getElementById('tabsContainer');
  tabsContainer.innerHTML = '';

  state.openFiles.forEach((file, index) => {
    const tab = document.createElement('div');
    tab.className = `tab ${index === state.activeFileIndex ? 'active' : ''}`;

    const icon = document.createElement('span');
    icon.className = 'tab-icon';
    icon.textContent = getFileIcon(file.path.split('/').pop());
    tab.appendChild(icon);

    const name = document.createElement('span');
    name.textContent = file.path.split('/').pop();
    tab.appendChild(name);

    if (file.modified) {
      const modified = document.createElement('span');
      modified.className = 'tab-modified';
      tab.appendChild(modified);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.textContent = '✕';
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeFile(index);
    };
    tab.appendChild(closeBtn);

    tab.onclick = () => switchToFile(index);
    tabsContainer.appendChild(tab);
  });

  updateLanguageIndicator();
}

function switchToFile(index) {
  state.activeFileIndex = index;
  renderTabs();
}

function closeFile(index) {
  state.openFiles.splice(index, 1);
  if (state.activeFileIndex >= state.openFiles.length) {
    state.activeFileIndex = state.openFiles.length - 1;
  }
  renderTabs();
}

function updateLanguageIndicator() {
  const indicator = document.getElementById('languageIndicator');
  if (state.activeFileIndex >= 0 && state.openFiles[state.activeFileIndex]) {
    const lang = state.openFiles[state.activeFileIndex].language;
    indicator.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
  }
}

function createNewFile() {
  const name = prompt('Nombre del archivo:');
  if (name) {
    // Implementar créación de archivo
    addTerminalLine(`Crear archivo: ${name}`, 'info');
  }
}

function createNewFolder() {
  const name = prompt('Nombre de la carpeta:');
  if (name) {
    // Implementar creación de carpeta
    addTerminalLine(`Crear carpeta: ${name}`, 'info');
  }
}

function refreshFileTree() {
  loadFileTree();
  addTerminalLine('Árbol actualizado', 'success');
}

// =========================================
// Terminal
// =========================================

function switchPanel(panelName) {
  // Actualizar pestañas activas
  document.querySelectorAll('.bottom-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');

  // Actualizar contenido de paneles
  document.querySelectorAll('.panel-content').forEach(panel => {
    panel.classList.remove('active');
  });
  document.getElementById(panelName).classList.add('active');
}

async function executeTerminalCommand() {
  const input = document.getElementById('terminalInput');
  const command = input.value.trim();

  if (!command) return;

  addTerminalLine(`$ ${command}`, 'info');
  input.value = '';
  state.terminalHistory.push(command);

  // Comandos locales
  if (command === 'help') {
    addTerminalLine('Comandos disponibles:', 'info');
    addTerminalLine('  help        - Mostrar esta ayuda', 'info');
    addTerminalLine('  clear       - Limpiar pantalla', 'info');
    addTerminalLine('  ls          - Listar archivos', 'info');
    addTerminalLine('  python      - Ejecutar Python', 'info');
    addTerminalLine('  node        - Ejecutar Node.js', 'info');
    addTerminalLine('  javac/java  - Compilar/ejecutar Java', 'info');
    return;
  }

  if (command === 'clear') {
    document.getElementById('terminalOutput').innerHTML = '';
    return;
  }

  if (command.startsWith('ls') || command.startsWith('dir')) {
    await listDirectory();
    return;
  }

  // Para otros comandos, enviar al servidor
  try {
    const data = await fetchJsonOrThrow('/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'cmd', code: command })
    });
    if (data.output) {
      addTerminalLine(data.output, 'success');
    } else if (data.error) {
      addTerminalLine(data.error, 'error');
    }
  } catch (error) {
    addTerminalLine(`Error: ${error.message}`, 'error');
  }
}

async function listDirectory() {
  try {
    const tree = await fetchJsonOrThrow('/file-tree');

    addTerminalLine('Directorio:', 'info');
    tree.forEach(item => {
      const icon = item.type === 'directory' ? '[DIR] ' : '[FILE]';
      addTerminalLine(`  ${icon} ${item.name}`, 'info');
    });
  } catch (error) {
    addTerminalLine(`Error: ${error.message}`, 'error');
  }
}

function addTerminalLine(text, type = 'info') {
  const output = document.getElementById('terminalOutput');
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;
  line.textContent = text;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

// =========================================
// Modal: Abrir Carpeta
// =========================================

async function showFolderModal() {
  const modal = document.getElementById('openFolderModal');
  modal.classList.add('show');

  // Cargar carpetas recientes
  try {
    const folders = await fetchJsonOrThrow('/recent-folders');
    const list = document.getElementById('recentFoldersList');
    list.innerHTML = '';

    folders.forEach(folder => {
      const item = document.createElement('div');
      item.className = 'folder-item';
      item.onclick = () => openFolder(folder.path);
      item.innerHTML = `
        <div class="folder-item-name">${folder.name}</div>
        <div class="folder-item-path">${folder.path}</div>
      `;
      list.appendChild(item);
    });
  } catch (error) {
    console.error('Error cargando carpetas:', error);
  }
}

function closeFolderModal() {
  const modal = document.getElementById('openFolderModal');
  modal.classList.remove('show');
  document.getElementById('folderPathInput').value = '';
}

async function openFolderInExplorer() {
  const pathInput = document.getElementById('folderPathInput');
  const folderPath = pathInput.value.trim();

  if (!folderPath) {
    alert('Por favor ingresa una ruta válida o selecciona una carpeta reciente');
    return;
  }

  await openFolder(folderPath);
}

async function openFolder(folderPath) {
  try {
    const data = await fetchJsonOrThrow('/open-folder-browser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath: folderPath })
    });

    if (data.error) {
      addTerminalLine(`❌ Error: ${data.error}`, 'error');
    } else {
      addTerminalLine(`✅ Explorador abierto: ${folderPath || 'carpeta actual'}`, 'success');
      closeFolderModal();

      // Recargar árbol de archivos si es una carpeta válida
      await loadFileTree();
    }
  } catch (error) {
    addTerminalLine(`❌ Error: ${error.message}`, 'error');
  }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
  const modal = document.getElementById('openFolderModal');
  if (e.target === modal) {
    closeFolderModal();
  }
});

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFolderModal();
  }
});

// =========================================
// Utilidades
// =========================================

// Handlevar window resize
window.addEventListener('resize', () => {
  if (editor) {
    editor.layout();
  }
});

document.addEventListener('DOMContentLoaded', init);
