/**
 *  MIA KHALIFA - WhatsApp Bot
 *  Copyright (c) 2026 STANY TZ
 * 
 *  GitHub: https://github.com/Stanytz378
 *  YouTube: https://youtube.com/@STANYTZ
 *  WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p
 * 
 *  Credits:
 *  - Baileys Library by @adiwajshing
 *  - Pair Code implementation inspired by OGCHAMP
 */

import './settings.js'
import { Boom } from '@hapi/boom'
import fs from 'fs'
import { existsSync, rmSync } from 'fs'
import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import FileType from 'file-type'
import path from 'path'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import { handleMessages, handleGroupParticipantUpdate, handleStatus } from './main.js'
import PhoneNumber from 'awesome-phonenumber'
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from './lib/exif.js'
import { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch, await, sleep, reSize } from './lib/myfunc.js'
import makeWASocket from '@whiskeysockets/baileys'
import {
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} from '@whiskeysockets/baileys'
import NodeCache from 'node-cache'
import pino from 'pino'
import readline from 'readline'
import { parsePhoneNumber } from 'libphonenumber-js'
import { PHONENUMBER_MCC } from '@whiskeysockets/baileys/lib/Utils/generics'

// ESM equivalents for __dirname and __filename
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Import lightweight store
import store from './lib/lightweight_store.js'

// Import settings as default import
import settings from './settings.js'

// Initialize store
store.readFromFile()
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10000)

// ==================== SESSION DOWNLOAD (using lib/session.js) ====================
const sessionDir = join(process.cwd(), 'session')
const credsPath = join(sessionDir, 'creds.json')
const sessionId = process.env.SESSION_ID || ''

if (sessionId && sessionId !== '') {
    console.log(chalk.yellow('📥 Downloading session using SESSION_ID...'))
    // Dynamic import for session download module
    import('./lib/session.js').then(async ({ downloadSession }) => {
        try {
            const success = await downloadSession(sessionId)
            if (success && existsSync(credsPath)) {
                console.log(chalk.green('✅ Session downloaded and saved to session/creds.json'))
            } else {
                console.log(chalk.red('❌ Failed to download session. Falling back to normal auth.'))
            }
        } catch (err) {
            console.error('Session download error:', err)
        }
    })
} else {
    console.log(chalk.yellow('⚠️ No SESSION_ID provided. Will use existing session/creds.json or pairing mode.'))
}

let phoneNumber = "255618558502"
let owner = JSON.parse(fs.readFileSync('./data/owner.json', 'utf8'))

global.botname = "MIA🍑KHALFA"
global.themeemoji = "•"
const customPairingCode = "STANYTECH"
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code")
const useMobile = process.argv.includes("--mobile")

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => {
    if (rl) {
        return new Promise((resolve) => rl.question(text, resolve))
    } else {
        return Promise.resolve(settings.ownerNumber || phoneNumber)
    }
}

async function startXeonBotInc() {
    let { version, isLatest } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const msgRetryCounterCache = new NodeCache()

    const XeonBotInc = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: !pairingCode,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        getMessage: async (key) => {
            let jid = jidNormalizedUser(key.remoteJid)
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        },
        msgRetryCounterCache,
        defaultQueryTimeoutMs: undefined,
    })

    store.bind(XeonBotInc.ev)

    XeonBotInc.ev.on('messages.upsert', async chatUpdate => {
        try {
            const mek = chatUpdate.messages[0]
            if (!mek.message) return
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                await handleStatus(XeonBotInc, chatUpdate)
                return
            }
            if (!XeonBotInc.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return

            if (XeonBotInc?.msgRetryCounterCache) {
                XeonBotInc.msgRetryCounterCache.clear()
            }

            try {
                await handleMessages(XeonBotInc, chatUpdate, true)
            } catch (err) {
                console.error("Error in handleMessages:", err)
                if (mek.key && mek.key.remoteJid) {
                    await XeonBotInc.sendMessage(mek.key.remoteJid, {
                        text: '❌ An error occurred while processing your message.',
                        contextInfo: {
                            forwardingScore: 1,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363404317544295@newsletter',
                                newsletterName: 'MIA🍑KHALFA',
                                serverMessageId: -1
                            }
                        }
                    }).catch(console.error)
                }
            }
        } catch (err) {
            console.error("Error in messages.upsert:", err)
        }
    })

    XeonBotInc.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

    XeonBotInc.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = XeonBotInc.decodeJid(contact.id)
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
        }
    })

    XeonBotInc.getName = (jid, withoutContact = false) => {
        let id = XeonBotInc.decodeJid(jid)
        withoutContact = XeonBotInc.withoutContact || withoutContact
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
            v = store.contacts[id] || {}
            if (!(v.name || v.subject)) v = XeonBotInc.groupMetadata(id) || {}
            resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
            id,
            name: 'WhatsApp'
        } : id === XeonBotInc.decodeJid(XeonBotInc.user.id) ?
            XeonBotInc.user :
            (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
    }

    XeonBotInc.public = true
    XeonBotInc.serializeM = (m) => smsg(XeonBotInc, m, store)

    if (pairingCode && !XeonBotInc.authState.creds.registered) {
        if (useMobile) throw new Error('Cannot use pairing code with mobile api')

        let phoneNumberInput
        if (!!global.phoneNumber) {
            phoneNumberInput = global.phoneNumber
        } else {
            phoneNumberInput = await question(chalk.bgBlack(chalk.greenBright(`Please type your WhatsApp number 😍\nFormat: 22896231860 (without + or spaces) : `)))
        }

        phoneNumberInput = phoneNumberInput.replace(/[^0-9]/g, '')
        const pn = PhoneNumber
        if (!pn('+' + phoneNumberInput).isValid()) {
            console.log(chalk.red('Invalid phone number. Exiting.'))
            process.exit(1)
        }

        setTimeout(async () => {
            try {
                let code = await XeonBotInc.requestPairingCode(phoneNumberInput.trim(), customPairingCode)
                code = code?.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(`Your Pairing Code : `)), chalk.black(chalk.white(code)))
                console.log(chalk.yellow(`\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`))
            } catch (error) {
                console.error('Error requesting pairing code:', error)
                console.log(chalk.red('Failed to get pairing code. Please check your phone number and try again.'))
            }
        }, 3000)
    }

    XeonBotInc.ev.on('connection.update', async (s) => {
        const { connection, lastDisconnect } = s
        if (connection == "open") {
            console.log(chalk.magenta(` `))
            console.log(chalk.yellow(`🌿Connected to => ` + JSON.stringify(XeonBotInc.user, null, 2)))

            const botNumber = XeonBotInc.user.id.split(':')[0] + '@s.whatsapp.net'
            await XeonBotInc.sendMessage(botNumber, {
                text: `⏣ *BOT WORKS GEE* !\n\n⏣ Time: ${new Date().toLocaleString()}\n⏣ Status: *ACTIVE* !
                \n⏣Make sure to join below channel 
━━━━━━━━━━━━━━━━━━━━━━━
🔥FOLLOW US FOR MORE UPDATE👨‍💻: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p 
🔥SUPPORT GROUP👨‍💻: https://chat.whatsapp.com/J19JASXoaK0GVSoRvShr4Y?mode=gi_t`,

                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363404317544295@newsletter',
                        newsletterName: 'MIA🍑KALIFA',
                        serverMessageId: -1
                    }
                }
            })
            await delay(1999)
            console.log(chalk.yellow(`\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'MIA KHALIFA'} ]`)}\n\n`))
            console.log(chalk.cyan(`< ================================================== >`))
            console.log(chalk.magenta(`\n${global.themeemoji || '•'} GitHub: https://github.com/Stanytz378`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} YouTube: https://youtube.com/@STANYTZ`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} WA Number: ${owner[0] || settings.ownerNumber}`))
            console.log(chalk.magenta(`${global.themeemoji || '•'} CREDIT: STANY TZ`))
            console.log(chalk.green(`${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`))
            console.log(chalk.blue(`Bot Version: ${settings.version}`))
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                try {
                    rmSync('./session', { recursive: true, force: true })
                } catch { }
                console.log(chalk.red('Session logged out. Please re-authenticate.'))
                startXeonBotInc()
            } else {
                startXeonBotInc()
            }
        }
    })

    const antiCallNotified = new Set()
    XeonBotInc.ev.on('call', async (calls) => {
        try {
            // Dynamic import for anticall state
            const { readState: readAnticallState } = await import('./commands/anticall.js')
            const state = readAnticallState()
            if (!state.enabled) return
            for (const call of calls) {
                const callerJid = call.from || call.peerJid || call.chatId
                if (!callerJid) continue
                try {
                    try {
                        if (typeof XeonBotInc.rejectCall === 'function' && call.id) {
                            await XeonBotInc.rejectCall(call.id, callerJid)
                        } else if (typeof XeonBotInc.sendCallOfferAck === 'function' && call.id) {
                            await XeonBotInc.sendCallOfferAck(call.id, callerJid, 'reject')
                        }
                    } catch {}
                    if (!antiCallNotified.has(callerJid)) {
                        antiCallNotified.add(callerJid)
                        setTimeout(() => antiCallNotified.delete(callerJid), 60000)
                        await XeonBotInc.sendMessage(callerJid, { text: '📵 Anticall is enabled. Your call was rejected and you will be blocked.' })
                    }
                } catch {}
                setTimeout(async () => {
                    try { await XeonBotInc.updateBlockStatus(callerJid, 'block') } catch {}
                }, 800)
            }
        } catch (e) {}
    })

    XeonBotInc.ev.on('creds.update', saveCreds)
    XeonBotInc.ev.on('group-participants.update', async (update) => {
        await handleGroupParticipantUpdate(XeonBotInc, update)
    })
    XeonBotInc.ev.on('messages.upsert', async (m) => {
        if (m.messages[0].key && m.messages[0].key.remoteJid === 'status@broadcast') {
            await handleStatus(XeonBotInc, m)
        }
    })
    XeonBotInc.ev.on('status.update', async (status) => {
        await handleStatus(XeonBotInc, status)
    })
    XeonBotInc.ev.on('messages.reaction', async (status) => {
        await handleStatus(XeonBotInc, status)
    })

    return XeonBotInc
}

startXeonBotInc().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
})

// Hot reload (ESM version)
const file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright(`Update ${file}`))
    // Let process manager restart (or simply exit)
    process.exit(0)
})