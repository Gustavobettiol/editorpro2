const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../data/database.json');

function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        return { keys: {} };
    }
    const data = fs.readFileSync(DB_PATH);
    return JSON.parse(data);
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function generateKey(days = 30) {
    const db = loadDB();
    const key = 'RUFU-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    db.keys[key] = {
        hwid: null,
        expires: expiryDate.toISOString(),
        active: true,
        createdAt: new Date().toISOString()
    };

    saveDB(db);
    return { key, expires: db.keys[key].expires };
}

function validateKey(key, hwid) {
    const db = loadDB();
    const keyData = db.keys[key];

    if (!keyData) return { valid: false, message: 'Key no encontrada.' };
    if (!keyData.active) return { valid: false, message: 'Key inactiva.' };

    const now = new Date();
    const expiry = new Date(keyData.expires);
    if (now > expiry) {
        keyData.active = false;
        saveDB(db);
        return { valid: false, message: 'Key expirada.' };
    }

    if (!keyData.hwid) {
        // Vincular HWID en el primer uso
        keyData.hwid = hwid;
        saveDB(db);
        return { valid: true, message: 'Key vinculada exitosamente a este HWID.' };
    }

    if (keyData.hwid !== hwid) {
        return { valid: false, message: 'HWID no coincide. Key vinculada a otro dispositivo.' };
    }

    return { valid: true, message: 'Acceso concedido.' };
}

function deleteKey(key) {
    const db = loadDB();
    if (db.keys[key]) {
        delete db.keys[key];
        saveDB(db);
        return true;
    }
    return false;
}

function resetHWID(key) {
    const db = loadDB();
    if (db.keys[key]) {
        db.keys[key].hwid = null;
        saveDB(db);
        return true;
    }
    return false;
}

function listKeys() {
    const db = loadDB();
    return db.keys;
}

module.exports = {
    generateKey,
    validateKey,
    deleteKey,
    resetHWID,
    listKeys
};
