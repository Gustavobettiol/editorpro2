require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// Endpoint: Información del Proyecto
app.get('/project-info', (req, res) => {
  res.json({
    projectName: 'editor pro2',
    rootPath: __dirname
  });
});

// Endpoint: Guía de despliegue
app.get('/deploy-guide', (req, res) => {
  try {
    const guidePath = path.join(__dirname, 'docs', 'RENDER_SPEC.md');
    if (fs.existsSync(guidePath)) {
      const content = fs.readFileSync(guidePath, 'utf8');
      res.json({ content });
    } else {
      res.status(404).json({ error: 'Guía no encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper para validar rutas y prevenir path traversal
function validatePath(userPath) {
  if (!userPath) return __dirname;
  const resolvedPath = path.resolve(__dirname, userPath);
  if (!resolvedPath.startsWith(__dirname)) {
    throw new Error('Acceso denegado: Intento de path traversal');
  }
  return resolvedPath;
}

// Endpoint: Árbol de archivos
app.get('/file-tree', (req, res) => {
  const root = __dirname;

  function getTree(dir, relativePath = '') {
    const files = fs.readdirSync(dir);
    return files
      .filter(file => !file.startsWith('.') && file !== 'node_modules')
      .map(file => {
        const filePath = path.join(dir, file);
        const relPath = path.join(relativePath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
          return {
            name: file,
            type: 'directory',
            path: relPath,
            children: getTree(filePath, relPath)
          };
        } else {
          return {
            name: file,
            type: 'file',
            path: relPath,
            language: getLanguage(file)
          };
        }
      });
  }

  function getLanguage(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
      '.js': 'javascript', '.ts': 'typescript', '.html': 'html',
      '.css': 'css', '.json': 'json', '.py': 'python',
      '.java': 'java', '.md': 'markdown', '.txt': 'plaintext'
    };
    return map[ext] || 'plaintext';
  }

  try {
    const tree = getTree(root);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CHAT IA & PERSISTENCIA ---

const CHAT_DATA_DIR = path.join(__dirname, '.editor-data', 'chat-history');
if (!fs.existsSync(CHAT_DATA_DIR)) {
  fs.mkdirSync(CHAT_DATA_DIR, { recursive: true });
}

function getChatPath(sessionId) {
  return path.join(CHAT_DATA_DIR, `${sessionId}.json`);
}

function saveChatHistory(sessionId, history) {
  const chatPath = getChatPath(sessionId);
  fs.writeFileSync(chatPath, JSON.stringify(history, null, 2));
}

function loadChatHistory(sessionId) {
  const chatPath = getChatPath(sessionId);
  if (fs.existsSync(chatPath)) {
    return JSON.parse(fs.readFileSync(chatPath, 'utf8'));
  }
  return [];
}

// Endpoint: Estado de IA
app.get('/ai-status', async (req, res) => {
  const status = {
    lmstudio: { ok: false },
    ollama: { ok: false }
  };

  try {
    const lmRes = await axios.get(process.env.LM_STUDIO_MODELS_URL || 'http://127.0.0.1:1234/v1/models', { timeout: 1000 });
    status.lmstudio.ok = true;
  } catch (e) {}

  try {
    const ollamaRes = await axios.get(process.env.OLLAMA_MODELS_URL || 'http://127.0.0.1:11434/api/tags', { timeout: 1000 });
    status.ollama.ok = true;
  } catch (e) {}

  res.json(status);
});

// Endpoint: Modelos disponibles
app.get('/models', async (req, res) => {
  const { provider } = req.query;
  let models = [];

  try {
    if (provider === 'lmstudio') {
      const resp = await axios.get(process.env.LM_STUDIO_MODELS_URL || 'http://127.0.0.1:1234/v1/models');
      models = resp.data.data.map(m => m.id);
    } else if (provider === 'ollama') {
      const resp = await axios.get(process.env.OLLAMA_MODELS_URL || 'http://127.0.0.1:11434/api/tags');
      models = resp.data.models.map(m => m.name);
    }
    res.json({ models });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Chat IA
app.post('/chat', async (req, res) => {
  const { message, provider, model, history, sessionId } = req.body;
  let responseText = '';

  try {
    if (provider === 'lmstudio') {
      const resp = await axios.post(process.env.LM_STUDIO_URL || 'http://127.0.0.1:1234/v1/chat/completions', {
        model,
        messages: [...history, { role: 'user', content: message }]
      });
      responseText = resp.data.choices[0].message.content;
    } else if (provider === 'ollama') {
      const resp = await axios.post(process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate', {
        model,
        prompt: message,
        stream: false
      });
      responseText = resp.data.response;
    } else {
      responseText = `Proveedor ${provider} no soportado en esta implementación básica.`;
    }

    // Persistir historial si hay sessionId
    if (sessionId) {
      const currentHistory = loadChatHistory(sessionId);
      currentHistory.push({ role: 'user', content: message, timestamp: new Date().toISOString() });
      currentHistory.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString() });
      saveChatHistory(sessionId, currentHistory.slice(-100)); // Guardar últimos 100
    }

    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Historial de chat
app.get('/chat-history', (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: 'Session ID requerido' });
  res.json(loadChatHistory(sessionId));
});

// Endpoint: Limpiar historial
app.post('/clear-chat-history', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID requerido' });
  saveChatHistory(sessionId, []);
  res.json({ success: true });
});

// Endpoint: Leer archivo
app.get('/read-file', (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Ruta no especificada' });

    const absolutePath = validatePath(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    res.json({ content, language: path.extname(absolutePath).slice(1) || 'plaintext' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Ejecutar comando
app.post('/execute', (req, res) => {
  const { code, language } = req.body;
  if (!code) return res.status(400).json({ error: 'Comando no especificado' });

  // Limitamos un poco lo que se puede ejecutar por seguridad básica
  const forbidden = ['rm -rf /', 'format', 'mkfs', 'dd'];
  if (forbidden.some(cmd => code.includes(cmd))) {
    return res.status(403).json({ error: 'Comando no permitido' });
  }

  exec(code, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ error: stderr || error.message });
    }
    res.json({ output: stdout || stderr });
  });
});

// Endpoint: Ejecutar acción de chat
app.post('/chat-execute', (req, res) => {
  const { type, path: targetPath, content, folderPath } = req.body;

  try {
    if (type === 'create-file') {
      const fullPath = validatePath(targetPath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content || '');
      return res.json({ success: true, message: `Archivo ${targetPath} creado` });
    } else if (type === 'create-folder') {
      const fullPath = validatePath(folderPath);
      fs.mkdirSync(fullPath, { recursive: true });
      return res.json({ success: true, message: `Carpeta ${folderPath} creada` });
    }
    res.status(400).json({ error: 'Tipo de acción no válido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start basic server structure
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Editor Pro 2 Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
