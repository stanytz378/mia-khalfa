/**
 *  MIA KHALIFA - A WhatsApp Bot
 *  Copyright (c) 2026 STANY TZ
 * 
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the MIT License.
 * 
 *  Credits:
 *  - Baileys Library by @adiwajshing
 *  - Session ID implementation inspired by IAM LEGEND
 *  - Developer: STANY TZ
 * 
 *  GitHub: https://github.com/Stanytz378
 *  YouTube: https://youtube.com/@STANYTZ
 *  WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p
 */

require('./config'); // Load config.js first (sets global variables)
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { Boom } = require('@hapi/boom');
const PhoneNumber = require('awesome-phonenumber');
const readline = require('readline');
const pino = require('pino');
const NodeCache = require('node-cache');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require('@whiskeysockets/baileys');

// Import custom modules
const { smsg, isUrl, getBuffer, getSizeMedia, sleep, reSize } = require('./lib/myfunc');
const { handleMessages, handleGroupParticipantUpdate, handleStatus } = require('./main');
const store = require('./lib/lightweight_store');
const { downloadSession } = require('./lib/session'); // <- session downloader

// ==================== CONFIGURATION ====================
const config = require('./config'); // botName, ownerNumber, prefixes, etc.
global.botname = config.botName || 'MIA KHALIFA';
global.themeemoji = config.themeemoji || '•';
global.owner = [];
try {
    global.owner = JSON.parse(fs.readFileSync('./data/owner.json', 'utf-8'));
} catch {
    global.owner = [config.ownerNumber];
}

// Store write interval
setInterval(() => store.writeToFile(), config.storeWriteInterval || 10000);

// ==================== SESSION MANAGEMENT ====================
let sessionId = process.env.SESSION_ID || '';
let pairingMode = !sessionId || process.argv.includes('--pairing'); // if no session, fallback to pairing

// If sessionId provided, download session before starting
if (sessionId && sessionId !== '') {
    console.log(chalk.yellow('📥 Downloading session from server...'));
    const success = await downloadSession(sessionId);
    if (!success) {
        console.log(chalk.red('❌ Failed to download session. Falling back to pairing mode.'));
        pairingMode = true;
    } else {
        console.log(chalk.green('✅ Session downloaded successfully!'));
        pairingMode = false;
    }
} else {
    pairingMode = true;
}

// ==================== BOT START ====================
async function startMiaKhalifa() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const msgRetryCounterCache = new NodeCache();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: pairingMode,
        browser: ['MIA KHALIFA', 'Chrome', '120.0.0'],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id);
            return msg?.message || '';
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined
    });

    store.bind(sock.ev);
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid;
        }
        return jid;
    };
    sock.public = true;
    sock.serializeM = (m) => smsg(sock, m, store);

    // ==================== EVENT HANDLERS ====================
    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key?.remoteJid === 'status@broadcast') {
                await handleStatus(sock, chatUpdate);
                return;
            }
            if (!sock.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            if (sock.msgRetryCounterCache) sock.msgRetryCounterCache.clear();

            await handleMessages(sock, chatUpdate);
        } catch (err) {
            console.error('Messages.upsert error:', err);
        }
    });

    sock.ev.on('contacts.update', (update) => {
        for (let contact of update) {
            let id = sock.decodeJid(contact.id);
            if (store.contacts) store.contacts[id] = { id, name: contact.notify };
        }
    });

    sock.getName = (jid, withoutContact = false) => {
        const id = sock.decodeJid(jid);
        withoutContact = withoutContact || false;
        if (id.endsWith('@g.us')) {
            return new Promise(async (resolve) => {
                let v = store.contacts[id] || {};
                if (!(v.name || v.subject)) v = await sock.groupMetadata(id).catch(() => ({}));
                resolve(v.name || v.subject || PhoneNumber(`+${id.replace('@s.whatsapp.net', '')}`).getNumber('international'));
            });
        } else {
            let v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : id === sock.decodeJid(sock.user.id) ? sock.user : (store.contacts[id] || {});
            return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber(`+${jid.replace('@s.whatsapp.net', '')}`).getNumber('international');
        }
    };

    // ==================== PAIRING CODE (if no session) ====================
    if (pairingMode && !state.creds.registered) {
        let phoneNumberInput;
        if (config.pairingNumber) {
            phoneNumberInput = config.pairingNumber;
        } else {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            phoneNumberInput = await new Promise((resolve) => {
                rl.question(chalk.bgBlack(chalk.greenBright(`📱 Enter your WhatsApp number (without +): `)), resolve);
            });
            rl.close();
        }
        phoneNumberInput = phoneNumberInput.replace(/[^0-9]/g, '');
        const pn = PhoneNumber(`+${phoneNumberInput}`);
        if (!pn.isValid()) {
            console.log(chalk.red('Invalid phone number. Exiting.'));
            process.exit(1);
        }
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(phoneNumberInput);
                code = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(chalk.black(chalk.bgGreen(`🔑 Pairing Code: ${code}`)));
            } catch (err) {
                console.error('Pairing error:', err);
            }
        }, 3000);
    }

    // ==================== CONNECTION UPDATE ====================
    sock.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === 'open') {
            console.log(chalk.green('✅ Bot connected successfully!'));
            console.log(chalk.magenta(`\n${global.themeemoji} Bot: ${global.botname}`));
            console.log(chalk.magenta(`${global.themeemoji} Number: ${sock.user.id.split(':')[0]}`));
            console.log(chalk.magenta(`${global.themeemoji} Developer: STANY TZ`));
            console.log(chalk.cyan(`\n${global.themeemoji} GitHub: https://github.com/Stanytz378`));
            console.log(chalk.cyan(`${global.themeemoji} YouTube: https://youtube.com/@STANYTZ`));
            console.log(chalk.cyan(`${global.themeemoji} WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p`));
            console.log(chalk.green(`\n✅ Bot is ready!`));

            // Send welcome message to owner
            const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            await sock.sendMessage(botNumber, {
                text: `🤖 *${global.botname}* is now online!\n⏰ ${new Date().toLocaleString()}\n✅ Status: ACTIVE\n\n👨‍💻 Developed by STANY TZ`
            }).catch(() => {});
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log(chalk.red('Session logged out. Please restart with a valid session ID or pair again.'));
                // Do not auto-restart – user must manually restart
                return;
            }
            // Reconnect without process.exit
            console.log(chalk.yellow('Connection closed. Reconnecting...'));
            setTimeout(startMiaKhalifa, 5000);
        }
    });

    // ==================== ANTICALL ====================
    const anticallNotified = new Set();
    sock.ev.on('call', async (calls) => {
        try {
            const anticallEnabled = global.anticallEnabled !== false; // can be toggled via command
            if (!anticallEnabled) return;
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId;
                if (!callerJid) continue;
                try {
                    if (typeof sock.rejectCall === 'function' && call.id) await sock.rejectCall(call.id, callerJid);
                    else if (typeof sock.sendCallOfferAck === 'function' && call.id) await sock.sendCallOfferAck(call.id, callerJid, 'reject');
                } catch {}
                if (!anticallNotified.has(callerJid)) {
                    anticallNotified.add(callerJid);
                    setTimeout(() => anticallNotified.delete(callerJid), 60000);
                    await sock.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' });
                }
                setTimeout(async () => {
                    try { await sock.updateBlockStatus(callerJid, 'block'); } catch {}
                }, 800);
            }
        } catch (e) {}
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('group-participants.update', (update) => handleGroupParticipantUpdate(sock, update));
    sock.ev.on('status.update', (status) => handleStatus(sock, status));
    sock.ev.on('messages.reaction', (reaction) => handleStatus(sock, reaction));

    return sock;
}

// ==================== START BOT ====================
startMiaKhalifa().catch(err => {
    console.error('Fatal error:', err);
    // No process.exit – just log and keep alive? Bot will stop but you can restart manually.
});

// Graceful shutdown
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});
