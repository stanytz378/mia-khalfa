/**
 *  MIA KHALIFA - Configuration File
 *  Copyright (c) 2026 STANY TZ
 * 
 *  GitHub: https://github.com/Stanytz378
 *  YouTube: https://youtube.com/@STANYTZ
 *  WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p
 */

import dotenv from 'dotenv';
dotenv.config();

// ==================== API CONFIGURATION ====================
global.APIs = {
    xteam: 'https://api.xteam.xyz',
    dzx: 'https://api.dhamzxploit.my.id',
    lol: 'https://api.lolhuman.xyz',
    violetics: 'https://violetics.pw',
    neoxr: 'https://api.neoxr.my.id',
    zenzapis: 'https://zenzapis.xyz',
    akuari: 'https://api.akuari.my.id',
    akuari2: 'https://apimu.my.id',
    nrtm: 'https://fg-nrtm.ddns.net',
    bg: 'http://bochil.ddns.net',
    fgmods: 'https://api-fgmods.ddns.net'
};

global.APIKeys = {
    'https://api.xteam.xyz': 'd90a9e986e18778b',
    'https://api.lolhuman.xyz': '85faf717d0545d14074659ad',
    'https://api.neoxr.my.id': process.env.NEOXR_KEY || 'yourkey',
    'https://violetics.pw': 'beta',
    'https://zenzapis.xyz': process.env.ZENZAPIS_KEY || 'yourkey',
    'https://api-fgmods.ddns.net': 'fg-dylux'
};

// ==================== BOT SETTINGS ====================
export default {
    // Bot Identity
    botName: process.env.BOT_NAME || 'MIA🍑KHALIFA',
    ownerNumber: process.env.OWNER_NUMBER || '255787079580',
    botOwner: process.env.BOT_OWNER || 'STANY TZ',
    prefixes: (process.env.PREFIXES || '.,!,/,#').split(','),
    
    // Time & Version
    timeZone: process.env.TIMEZONE || 'Africa/Nairobi',
    version: '2.0.0',
    
    // Store & Performance
    storeWriteInterval: 10000,
    maxStoreMessages: 20,
    
    // Session
    pairingNumber: process.env.PAIRING_NUMBER || '',
    
    // Features
    themeemoji: '•',
    anticallEnabled: process.env.ANTICALL_ENABLED !== 'false', // default true
    
    // Newsletter (for forwarded messages)
    newsletterJid: '120363404317544295@newsletter',
    
    // Warn system
    WARN_COUNT: 3,
    
    // API (expose for other modules)
    APIs: global.APIs,
    APIKeys: global.APIKeys
};