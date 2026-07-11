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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nocturnal-admin';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// Endpoint: Información del Proyecto
app.get('/project-info', (req, res) => {
  res.json({
    projectName: 'Nocturnal Pro Editor',
    rootPath: __dirname
  });
});

// Endpoint: Carpetas recientes
app.get('/recent-folders', (req, res) => {
  // En una implementación real, esto vendría de una DB o archivo de config
  res.json([
    { name: 'Proyecto Actual', path: __dirname },
    { name: 'Public Assets', path: path.join(__dirname, 'public') },
    { name: 'Documentación', path: path.join(__dirname, 'docs') }
  ]);
});

// Endpoint: Abrir carpeta en el explorador
app.post('/open-folder-browser', (req, res) => {
  const { folderPath } = req.body;
  try {
    const absolutePath = validatePath(folderPath);
    // En un servidor real esto no "abre" una ventana, pero el frontend espera éxito
    res.json({ success: true, message: `Carpeta ${absolutePath} abierta` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// Middleware para proteger endpoints críticos
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (process.env.NODE_ENV === 'production') {
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
      return res.status(401).json({ error: 'No autorizado. Se requiere contraseña de administrador.' });
    }
  }
  next();
}

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
const FEED_DATA_DIR = path.join(__dirname, '.editor-data', 'public-feed');
const GLOBAL_DATA_DIR = path.join(__dirname, '.editor-data', 'global');

if (!fs.existsSync(CHAT_DATA_DIR)) fs.mkdirSync(CHAT_DATA_DIR, { recursive: true });
if (!fs.existsSync(FEED_DATA_DIR)) fs.mkdirSync(FEED_DATA_DIR, { recursive: true });
if (!fs.existsSync(GLOBAL_DATA_DIR)) fs.mkdirSync(GLOBAL_DATA_DIR, { recursive: true });

const FEED_FILE = path.join(FEED_DATA_DIR, 'feed.json');
if (!fs.existsSync(FEED_FILE)) fs.writeFileSync(FEED_FILE, JSON.stringify([], null, 2));

const GLOBAL_CHAT_FILE = path.join(GLOBAL_DATA_DIR, 'chat.json');
if (!fs.existsSync(GLOBAL_CHAT_FILE)) fs.writeFileSync(GLOBAL_CHAT_FILE, JSON.stringify([], null, 2));

const BLOG_FILE = path.join(GLOBAL_DATA_DIR, 'blog.json');
if (!fs.existsSync(BLOG_FILE)) {
  const initialBlog = [
    {
      id: 1,
      title: "Bienvenido a Nocturnal Pro",
      content: "Estamos emocionados de lanzar esta nueva versión con reproductor de video y chat global.",
      author: "Admin",
      date: new Date().toISOString()
    },
    {
      id: 2,
      title: "Novedades en el Reproductor",
      content: "Ahora soportamos HLS (.m3u8) para transmisiones en vivo de alta calidad. ¡Pruébalo en la pestaña Nocturnal Player!",
      author: "Nocturnal Dev",
      date: new Date().toISOString()
    },
    {
      id: 3,
      title: "Comunidad y Chat Global",
      content: "Interactúa con otros usuarios en tiempo real. No se requiere registro ni invitación. ¡Únete a la conversación!",
      author: "Comunidad",
      date: new Date().toISOString()
    }
  ];
  fs.writeFileSync(BLOG_FILE, JSON.stringify(initialBlog, null, 2));
}

function getChatPath(sessionId) {
  // Sanitize sessionId to prevent path traversal
  const safeSessionId = String(sessionId).replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(CHAT_DATA_DIR, `${safeSessionId}.json`);
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

// --- GLOBAL CHAT & BLOG ---

// Endpoint: Obtener chat global
app.get('/global-chat', (req, res) => {
  try {
    const chat = JSON.parse(fs.readFileSync(GLOBAL_CHAT_FILE, 'utf8'));
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Enviar mensaje al chat global
app.post('/global-chat', (req, res) => {
  const { user, message } = req.body;
  if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

  try {
    const chat = JSON.parse(fs.readFileSync(GLOBAL_CHAT_FILE, 'utf8'));
    const newMessage = {
      id: Date.now(),
      user: user || 'Anónimo',
      message,
      timestamp: new Date().toISOString()
    };

    chat.push(newMessage);
    // Mantener solo los últimos 100 mensajes
    const trimmedChat = chat.slice(-100);
    fs.writeFileSync(GLOBAL_CHAT_FILE, JSON.stringify(trimmedChat, null, 2));

    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Obtener blog
app.get('/blog', (req, res) => {
  try {
    const blog = JSON.parse(fs.readFileSync(BLOG_FILE, 'utf8'));
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PUBLIC FEED ---

// Endpoint: Obtener feed publico
app.get('/public-feed', (req, res) => {
  try {
    const feed = JSON.parse(fs.readFileSync(FEED_FILE, 'utf8'));
    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Agregar al feed
app.post('/public-feed', (req, res) => {
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requerida' });

  try {
    const feed = JSON.parse(fs.readFileSync(FEED_FILE, 'utf8'));
    const newItem = {
      id: Date.now(),
      url,
      title: title || url.split('/').pop() || 'Video sin título',
      timestamp: new Date().toISOString()
    };

    // Evitar duplicados simples
    if (!feed.some(item => item.url === url)) {
      feed.unshift(newItem);
      fs.writeFileSync(FEED_FILE, JSON.stringify(feed.slice(0, 50), null, 2)); // Guardar últimos 50
    }

    res.json({ success: true, item: newItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
app.post('/execute', authMiddleware, (req, res) => {
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
app.post('/chat-execute', authMiddleware, (req, res) => {
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
