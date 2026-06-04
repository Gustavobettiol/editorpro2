require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const keyManager = require('./src/keyManager');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Endpoint de validación para el script VPS
app.post('/validate', (req, res) => {
    const { key, hwid } = req.body;

    if (!key || !hwid) {
        return res.status(400).json({
            valid: false,
            message: 'Faltan parámetros: key y hwid son obligatorios.'
        });
    }

    const result = keyManager.validateKey(key, hwid);

    if (result.valid) {
        res.json(result);
    } else {
        res.status(403).json(result);
    }
});

// Health check
app.get('/status', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Servidor de validación ADM Ruffu ejecutándose en el puerto ${PORT}`);
});
