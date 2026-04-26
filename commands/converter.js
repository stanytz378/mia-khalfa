const { gmd, toAudio, toVideo, toPtt, stickerToImage, gmdRandom, getSetting, runFFmpeg, getVideoDuration, gmdSticker } = require("../stanytz");
const fs = require("fs").promises;
const { StickerTypes } = require("wa-sticker-formatter");

// Default pack info – inaweza kubadilishwa kupitia database
const DEFAULT_PACK_NAME = "Stany TZ";
const DEFAULT_PACK_AUTHOR = "255787079580";

// --------------------------------------------------------------
// STICKER – convert image/video/sticker to sticker
// --------------------------------------------------------------
gmd({
    pattern: "sticker",
    aliases: ["st", "take"],
    category: "converter",
    react: "🔄",
    description: "Convert image/video/sticker to sticker",
}, async (from, Gifted, conText) => {
    const { q, mek, reply, react, quoted, packName, packAuthor } = conText;

    try {
        if (!quoted) {
            await react("❌");
            return reply("📌 *Reply to an image, video or sticker*");
        }

        const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
        const quotedSticker = quoted?.stickerMessage || quoted?.message?.stickerMessage;
        const quotedVideo = quoted?.videoMessage || quoted?.message?.videoMessage;

        if (!quotedImg && !quotedSticker && !quotedVideo) {
            await react("❌");
            return reply("❌ *Unsupported media* – only image, video or sticker");
        }

        let tempFilePath;
        try {
            if (quotedImg || quotedVideo) {
                tempFilePath = await Gifted.downloadAndSaveMediaMessage(
                    quotedImg || quotedVideo,
                    "temp_media"
                );

                let fileExt = quotedImg ? ".jpg" : ".mp4";
                let mediaFile = gmdRandom(fileExt);
                const data = await fs.readFile(tempFilePath);
                await fs.writeFile(mediaFile, data);

                // If video → convert to webp (trim to 10s max)
                if (quotedVideo) {
                    const compressedFile = gmdRandom(".webp");
                    let duration = 8;
                    try {
                        duration = await getVideoDuration(mediaFile);
                        if (duration > 10) duration = 10;
                    } catch (e) {
                        console.error("Duration error:", e);
                    }
                    await runFFmpeg(mediaFile, compressedFile, 320, 15, duration);
                    await fs.unlink(mediaFile).catch(() => {});
                    mediaFile = compressedFile;
                }

                const stickerBuffer = await gmdSticker(mediaFile, {
                    pack: packName || DEFAULT_PACK_NAME,
                    author: packAuthor || DEFAULT_PACK_AUTHOR,
                    type: q.includes("--crop") || q.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                    categories: ["✨", "🎉"],
                    id: "12345",
                    quality: 75,
                    background: "transparent"
                });

                await fs.unlink(mediaFile).catch(() => {});
                await react("✅");
                return Gifted.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

            } else if (quotedSticker) {
                // Sticker → re‑compress
                tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedSticker, "temp_media");
                const stickerData = await fs.readFile(tempFilePath);
                const stickerFile = gmdRandom(".webp");
                await fs.writeFile(stickerFile, stickerData);

                const newStickerBuffer = await gmdSticker(stickerFile, {
                    pack: packName || DEFAULT_PACK_NAME,
                    author: packAuthor || DEFAULT_PACK_AUTHOR,
                    type: q.includes("--crop") || q.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                    categories: ["✨", "🎉"],
                    id: "12345",
                    quality: 75,
                    background: "transparent"
                });

                await fs.unlink(stickerFile).catch(() => {});
                await react("✅");
                return Gifted.sendMessage(from, { sticker: newStickerBuffer }, { quoted: mek });
            }
        } finally {
            if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
        }
    } catch (e) {
        console.error("Sticker error:", e);
        await react("❌");
        await reply("❌ *Failed to create sticker* – try again later");
    }
});

// --------------------------------------------------------------
// TOIMG – sticker → image
// --------------------------------------------------------------
gmd({
    pattern: "toimg",
    aliases: ["s2img"],
    category: "converter",
    react: "🖼️",
    description: "Convert sticker to image",
}, async (from, Gifted, conText) => {
    const { mek, reply, react, quoted, botFooter, newsletterJid, botName, sender } = conText;

    try {
        if (!quoted) {
            await react("❌");
            return reply("📌 *Reply to a sticker*");
        }
        const quotedSticker = quoted?.stickerMessage || quoted?.message?.stickerMessage;
        if (!quotedSticker) {
            await react("❌");
            return reply("❌ *That is not a sticker*");
        }
        let tempFilePath;
        try {
            tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedSticker, 'temp_media');
            const stickerBuffer = await fs.readFile(tempFilePath);
            const imageBuffer = await stickerToImage(stickerBuffer);
            await Gifted.sendMessage(from, {
                image: imageBuffer,
                caption: `🖼️ *Your image is ready*\n> ${botFooter}`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 5,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: newsletterJid,
                        newsletterName: botName,
                        serverMessageId: 143
                    },
                },
            }, { quoted: mek });
            await react("✅");
        } finally {
            if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
        }
    } catch (e) {
        console.error("Toimg error:", e);
        await react("❌");
        await reply("❌ *Failed to convert sticker to image*");
    }
});

// --------------------------------------------------------------
// TOAUDIO – video → mp3
// --------------------------------------------------------------
gmd({
    pattern: "toaudio",
    aliases: ['tomp3'],
    category: "converter",
    react: "🎵",
    description: "Convert video to audio (MP3)"
}, async (from, Gifted, conText) => {
    const { mek, reply, react, botPic, quoted, newsletterUrl } = conText;

    if (!quoted) {
        await react("❌");
        return reply("📌 *Reply to a video*");
    }
    const quotedVideo = quoted?.videoMessage || quoted?.message?.videoMessage;
    if (!quotedVideo) {
        await react("❌");
        return reply("❌ *No video found in reply*");
    }

    let tempFilePath;
    try {
        tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedVideo, 'temp_media');
        const buffer = await fs.readFile(tempFilePath);
        const convertedBuffer = await toAudio(buffer);

        await Gifted.sendMessage(from, {
            audio: convertedBuffer,
            mimetype: "audio/mpeg",
            externalAdReply: {
                title: '🎵 Converted Audio',
                body: 'Video → MP3',
                mediaType: 1,
                thumbnailUrl: botPic,
                sourceUrl: newsletterUrl,
                renderLargerThumbnail: false,
                showAdAttribution: true,
            }
        }, { quoted: mek });

        await react("✅");
    } catch (e) {
        console.error("Toaudio error:", e);
        await react("❌");
        const errMsg = e.message || String(e);
        if (errMsg.includes('no audio')) {
            await reply("❌ *This video has no audio track*");
        } else {
            await reply("❌ *Failed to extract audio* – try another video");
        }
    } finally {
        if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
    }
});

// --------------------------------------------------------------
// TOPTT – audio → voice note
// --------------------------------------------------------------
gmd({
    pattern: "toptt",
    aliases: ['tovoice', 'tovn', 'tovoicenote'],
    category: "converter",
    react: "🎙️",
    description: "Convert audio to WhatsApp voice note"
}, async (from, Gifted, conText) => {
    const { mek, reply, react, quoted } = conText;

    if (!quoted) {
        await react("❌");
        return reply("📌 *Reply to an audio*");
    }
    const quotedAudio = quoted?.audioMessage || quoted?.message?.audioMessage;
    if (!quotedAudio) {
        await react("❌");
        return reply("❌ *No audio found in reply*");
    }

    let tempFilePath;
    try {
        tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedAudio, 'temp_media');
        const buffer = await fs.readFile(tempFilePath);
        const convertedBuffer = await toPtt(buffer);

        await Gifted.sendMessage(from, {
            audio: convertedBuffer,
            mimetype: "audio/ogg; codecs=opus",
            ptt: true,
        }, { quoted: mek });

        await react("✅");
    } catch (e) {
        console.error("Toptt error:", e);
        await react("❌");
        await reply("❌ *Failed to convert to voice note*");
    } finally {
        if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
    }
});

// --------------------------------------------------------------
// TOVIDEO – audio → video (black screen)
// --------------------------------------------------------------
gmd({
    pattern: "tovideo",
    aliases: ['tomp4', 'tovid', 'toblackscreen', 'blackscreen'],
    category: "converter",
    react: "🎥",
    description: "Convert audio to video with black screen"
}, async (from, Gifted, conText) => {
    const { mek, reply, react, quoted } = conText;

    if (!quoted) {
        await react("❌");
        return reply("📌 *Reply to an audio*");
    }
    const quotedAudio = quoted?.audioMessage || quoted?.message?.audioMessage;
    if (!quotedAudio) {
        await react("❌");
        return reply("❌ *No audio found in reply*");
    }

    let tempFilePath;
    try {
        tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedAudio, 'temp_media');
        const buffer = await fs.readFile(tempFilePath);
        const convertedBuffer = await toVideo(buffer);

        await Gifted.sendMessage(from, {
            video: convertedBuffer,
            mimetype: "video/mp4",
            caption: "🎬 *Converted video*",
        }, { quoted: mek });

        await react("✅");
    } catch (e) {
        console.error("Tovideo error:", e);
        await react("❌");
        await reply("❌ *Failed to convert audio to video*");
    } finally {
        if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
    }
});