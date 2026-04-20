// lib/session.js
import fs from 'fs';
import path from 'path';
import axios from 'axios';

function extractPasteId(txt) {
    const parts = txt.split('_');
    return parts[parts.length - 1];
}

async function fetchFromPastebin(pasteId) {
    try {
        const url = `https://pastebin.com/raw/${pasteId}`;
        console.log(`[SESSION] Trying Pastebin: ${url}`);
        const response = await axios.get(url, { timeout: 15000 });
        const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        const trimmed = content.trim();
        if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            console.log(`[SESSION] Pastebin success, length: ${content.length}`);
            return content;
        }
        console.warn('[SESSION] Pastebin returned non‑JSON content');
        return null;
    } catch (error) {
        console.warn(`[SESSION] Pastebin fetch failed: ${error.message}`);
        return null;
    }
}

async function fetchFromPasteRs(pasteId) {
    try {
        const url = `https://paste.rs/${pasteId}`;
        console.log(`[SESSION] Trying paste.rs: ${url}`);
        const response = await axios.get(url, { timeout: 15000 });
        const content = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        const trimmed = content.trim();
        if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
            console.log(`[SESSION] paste.rs success, length: ${content.length}`);
            return content;
        }
        console.warn('[SESSION] paste.rs returned non‑JSON content');
        return null;
    } catch (error) {
        console.warn(`[SESSION] paste.rs fetch failed: ${error.message}`);
        return null;
    }
}

export async function downloadSession(txt) {
    const pasteId = extractPasteId(txt);
    if (!pasteId) {
        throw new Error('Invalid session ID format. Expected: Stanytz378/iamlegendv2_<pasteId>');
    }

    console.log(`📥 Downloading session (paste ID: ${pasteId})`);

    let data = await fetchFromPastebin(pasteId);
    if (!data) {
        data = await fetchFromPasteRs(pasteId);
    }

    if (!data) {
        throw new Error('Failed to download credentials from both Pastebin and paste.rs.\n' +
            'The paste may have expired or the session ID is invalid.\n' +
            `Paste ID: ${pasteId}`);
    }

    try {
        JSON.parse(data);
    } catch (e) {
        throw new Error(`Downloaded session data is not valid JSON: ${data.substring(0, 100)}...`);
    }

    const sessionDir = path.join(process.cwd(), 'session');
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
        console.log(`[SESSION] Created session directory: ${sessionDir}`);
    }

    const credsPath = path.join(sessionDir, 'creds.json');
    fs.writeFileSync(credsPath, data);
    console.log('✅ Credentials saved to session/creds.json');
    return true;
}