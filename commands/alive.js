/**
 *  MIA KHALIFA - Alive Command
 *  Copyright (c) 2026 STANY TZ
 * 
 *  GitHub: https://github.com/Stanytz378
 *  YouTube: https://youtube.com/@STANYTZ
 *  WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p
 */

import config = from('../config');  // or settings, depending on your structure

async function aliveCommand(sock, chatId, message) {
    try {
        const message1 = `*🤖 MIA KHALIFA IS ACTIVE!*\n\n` +
                       `*Bot:* ${config.botName || 'MIA🍑KHALIFA'}\n` +
                       `*Version:* ${config.version || '2.0.0'}\n` +
                       `*Status:* Online ✅\n` +
                       `*Mode:* Public 🌐\n\n` +
                       `*🌟 Features:*\n` +
                       `• Group Management\n` +
                       `• Antilink Protection\n` +
                       `• Fun Commands\n` +
                       `• AI Chatbot\n` +
                       `• And more!\n\n` +
                       `📝 Type *.menu* for full command list\n\n` +
                       `👨‍💻 Developed by STANY TZ`;

        await sock.sendMessage(chatId, {
            text: message1,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: config.newsletterJid || '120363404317544295@newsletter',
                    newsletterName: config.botName || 'MIA🍑KHALIFA',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: '🤖 Bot is alive and running!' }, { quoted: message });
    }
}

module.exports = aliveCommand;
