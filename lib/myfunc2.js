/**
 *  MIA KHALIFA - Additional Utility Functions
 *  Copyright (c) 2026 STANY TZ
 * 
 *  GitHub: https://github.com/Stanytz378
 *  YouTube: https://youtube.com/@STANYTZ
 *  WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p
 */

import axios = from("axios");
import cheerio = from("cheerio");
import { resolve } = from("path");
import util = from("util");
let BodyForm = from('form-data');
let { fromBuffer } = from('file-type');
let fs = require('fs');
const child_process = from('child_process');
const ffmpeg = from('fluent-ffmpeg');
const { unlink } = from('fs').promises;
const path = from('path');

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

exports.sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

exports.fetchJson = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

exports.fetchBuffer = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: "GET",
            url,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

exports.webp2mp4File = async (path) => {
    return new Promise((resolve, reject) => {
        const form = new BodyForm();
        form.append('new-image-url', '');
        form.append('new-image', fs.createReadStream(path));
        axios({
            method: 'post',
            url: 'https://s6.ezgif.com/webp-to-mp4',
            data: form,
            headers: {
                'Content-Type': `multipart/form-data; boundary=${form._boundary}`
            }
        }).then(({ data }) => {
            const bodyFormThen = new BodyForm();
            const $ = cheerio.load(data);
            const file = $('input[name="file"]').attr('value');
            bodyFormThen.append('file', file);
            bodyFormThen.append('convert', "Convert WebP to MP4!");
            axios({
                method: 'post',
                url: 'https://ezgif.com/webp-to-mp4/' + file,
                data: bodyFormThen,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}`
                }
            }).then(({ data }) => {
                const $ = cheerio.load(data);
                const result = 'https:' + $('div#output > p.outfile > video > source').attr('src');
                resolve({
                    status: true,
                    message: "Converted by MIA KHALIFA",
                    result: result
                });
            }).catch(reject);
        }).catch(reject);
    });
};

exports.fetchUrl = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        return err;
    }
};

exports.WAVersion = async () => {
    let get = await exports.fetchUrl("https://web.whatsapp.com/check-update?version=1&platform=web");
    let version = [get.currentVersion.replace(/[.]/g, ", ")];
    return version;
};

exports.getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

exports.isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, 'gi'));
};

exports.isNumber = (number) => {
    const int = parseInt(number);
    return typeof int === 'number' && !isNaN(int);
};

exports.TelegraPh = (Path) => {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(Path)) return reject(new Error("File not Found"));
        try {
            const form = new BodyForm();
            form.append("file", fs.createReadStream(Path));
            const data = await axios({
                url: "https://telegra.ph/upload",
                method: "POST",
                headers: {
                    ...form.getHeaders()
                },
                data: form
            });
            return resolve("https://telegra.ph" + data.data[0].src);
        } catch (err) {
            return reject(new Error(String(err)));
        }
    });
};

const sleepy = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

exports.buffergif = async (image) => {
    const filename = `${Math.random().toString(36)}`;
    const tempGif = path.join(tempDir, `${filename}.gif`);
    const tempMp4 = path.join(tempDir, `${filename}.mp4`);
    
    await fs.writeFileSync(tempGif, image);
    child_process.execSync(
        `ffmpeg -i ${tempGif} -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ${tempMp4}`,
        { stdio: 'ignore' }
    );
    await sleepy(4000);
    const buffer5 = await fs.readFileSync(tempMp4);
    await Promise.all([unlink(tempMp4), unlink(tempGif)].catch(() => { }));
    return buffer5;
};
