const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

/**
 * Extracts paste ID from session string.
 * Expected format: anything_<pasteId>  (e.g., Stanytz/iamalegendv2_abc123)
 * @param {string} sessionId
 * @returns {string|null}
 */
function extractPasteId(sessionId) {
    const parts = sessionId.split('_');
    if (parts.length < 2) return null;
    return parts[parts.length - 1];
}

/**
 * Fetches raw data from Pastebin.
 * @param {string} pasteId
 * @returns {Promise<Buffer|null>}
 */
async function fetchFromPastebin(pasteId) {
    try {
        const url = `https://pastebin.com/raw/${pasteId}`;
        console.log(`[SESSION] Trying Pastebin: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        const buffer = Buffer.from(response.data);
        if (buffer.length > 0) {
            console.log(`[SESSION] Pastebin success, size: ${buffer.length} bytes`);
            return buffer;
        }
        return null;
    } catch (error) {
        console.warn(`[SESSION] Pastebin fetch failed: ${error.message}`);
        return null;
    }
}

/**
 * Fetches raw data from paste.rs.
 * @param {string} pasteId
 * @returns {Promise<Buffer|null>}
 */
async function fetchFromPasteRs(pasteId) {
    try {
        const url = `https://paste.rs/${pasteId}`;
        console.log(`[SESSION] Trying paste.rs: ${url}`);
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
        const buffer = Buffer.from(response.data);
        if (buffer.length > 0) {
            console.log(`[SESSION] paste.rs success, size: ${buffer.length} bytes`);
            return buffer;
        }
        return null;
    } catch (error) {
        console.warn(`[SESSION] paste.rs fetch failed: ${error.message}`);
        return null;
    }
}

/**
 * Saves session data (JSON or ZIP) to ./session folder.
 * @param {Buffer} data - Raw data from paste
 * @param {string} sessionDir - Target directory (default './session')
 * @returns {boolean}
 */
function saveSessionData(data, sessionDir = './session') {
    // Ensure session directory exists
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log(`[SESSION] Created directory: ${sessionDir}`);
    }

    // Check if it's a ZIP file (magic bytes PK)
    const isZip = data.length >= 2 && data[0] === 0x50 && data[1] === 0x4B;

    if (isZip) {
        console.log('[SESSION] Detected ZIP archive');
        const zipPath = path.join(sessionDir, 'session.zip');
        fs.writeFileSync(zipPath, data);
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(sessionDir, true);
        fs.unlinkSync(zipPath);
        console.log('[SESSION] Extracted ZIP to', sessionDir);
    } else {
        // Assume it's JSON (creds.json)
        const dataStr = data.toString('utf-8');
        try {
            JSON.parse(dataStr); // validate
            const credsPath = path.join(sessionDir, 'creds.json');
            fs.writeFileSync(credsPath, dataStr);
            console.log('[SESSION] Saved credentials to creds.json');
        } catch (err) {
            console.error('[SESSION] Data is not valid JSON');
            return false;
        }
    }

    // Verify that creds.json exists (critical)
    const credsPath = path.join(sessionDir, 'creds.json');
    if (!fs.existsSync(credsPath)) {
        console.error('[SESSION] creds.json missing after extraction');
        return false;
    }

    console.log('✅ Session ready');
    return true;
}

/**
 * Main function to download session using custom ID format.
 * @param {string} sessionId - e.g., "Stanytz/iamalegendv2_abc123"
 * @param {string} sessionDir - Directory to save session (default './session')
 * @returns {Promise<boolean>}
 */
async function downloadSession(sessionId, sessionDir = './session') {
    if (!sessionId || sessionId === '') {
        console.log('⚠️ No SESSION_ID provided');
        return false;
    }

    const pasteId = extractPasteId(sessionId);
    if (!pasteId) {
        console.error('❌ Invalid session ID format. Expected: anything_<pasteId>');
        return false;
    }

    console.log(`📥 Downloading session (paste ID: ${pasteId})`);

    // Try Pastebin first, then paste.rs
    let data = await fetchFromPastebin(pasteId);
    if (!data) {
        data = await fetchFromPasteRs(pasteId);
    }

    if (!data) {
        console.error(`❌ Failed to download from both Pastebin and paste.rs (ID: ${pasteId})`);
        return false;
    }

    return saveSessionData(data, sessionDir);
}

// Also export a simple loadSession function for compatibility with existing stany.js
// (it calls downloadSession and returns boolean)
async function loadSession() {
    const config = require('../config');
    const sessionId = config.SESSION_ID || process.env.SESSION_ID || '';
    return await downloadSession(sessionId, './session');
}

module.exports = {
    downloadSession,
    loadSession
};
