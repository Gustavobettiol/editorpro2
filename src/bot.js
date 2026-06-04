require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const keyManager = require('./keyManager');

const token = process.env.TELEGRAM_TOKEN;
const adminId = process.env.ADMIN_ID;

if (!token || token === 'tu_token_de_bot_aqui') {
    console.error('ERROR: TELEGRAM_TOKEN no configurado en .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('Bot de Telegram ADM Ruffu iniciado...');

// Middleware para verificar si es administrador
function isAdmin(msg) {
    return msg.from.id.toString() === adminId.toString();
}

bot.onText(/\/start/, (msg) => {
    if (!isAdmin(msg)) return;
    bot.sendMessage(msg.chat.id,
        "🛠 *Generador de Keys ADM Ruffu*\n\n" +
        "Comandos disponibles:\n" +
        "/genkey <dias> - Generar nueva key\n" +
        "/list - Listar todas las keys\n" +
        "/delkey <key> - Eliminar una key\n" +
        "/resethwid <key> - Resetear HWID de una key",
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/genkey (.+)/, (msg, match) => {
    if (!isAdmin(msg)) return;
    const days = parseInt(match[1]);

    if (isNaN(days) || days <= 0) {
        return bot.sendMessage(msg.chat.id, "❌ Por favor, introduce un número válido de días (ej: /genkey 30).");
    }

    const { key, expires } = keyManager.generateKey(days);

    bot.sendMessage(msg.chat.id,
        `✅ *Key Generada*\n\n` +
        `🔑 Key: \`${key}\`\n` +
        `📅 Expira: ${new Date(expires).toLocaleDateString()}\n` +
        `⏳ Duración: ${days} días`,
        { parse_mode: 'Markdown' }
    );
});

bot.onText(/\/list/, (msg) => {
    if (!isAdmin(msg)) return;
    const keys = keyManager.listKeys();
    let response = "📋 *Lista de Keys:*\n\n";

    for (const [key, data] of Object.entries(keys)) {
        const hwidStatus = data.hwid ? `🔗 \`${data.hwid.substring(0, 8)}...\`` : "🔓 Sin vincular";
        const expiry = new Date(data.expires).toLocaleDateString();
        response += `• \`${key}\` | ${expiry} | ${hwidStatus}\n`;
    }

    if (Object.keys(keys).length === 0) response = "No hay keys generadas.";

    bot.sendMessage(msg.chat.id, response, { parse_mode: 'Markdown' });
});

bot.onText(/\/delkey (.+)/, (msg, match) => {
    if (!isAdmin(msg)) return;
    const key = match[1];
    if (keyManager.deleteKey(key)) {
        bot.sendMessage(msg.chat.id, `🗑 Key \`${key}\` eliminada.`, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(msg.chat.id, "❌ Key no encontrada.");
    }
});

bot.onText(/\/resethwid (.+)/, (msg, match) => {
    if (!isAdmin(msg)) return;
    const key = match[1];
    if (keyManager.resetHWID(key)) {
        bot.sendMessage(msg.chat.id, `🔄 HWID de la key \`${key}\` reseteado.`, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(msg.chat.id, "❌ Key no encontrada.");
    }
});
