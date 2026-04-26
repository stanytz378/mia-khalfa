const {
    gmd,
    MAX_MEDIA_SIZE,
    getFileSize,
    getMimeCategory,
    getMimeFromUrl,
} = require("../stanytz");
const GIFTED_DLS = require("gifted-dls");
const giftedDls = new GIFTED_DLS();
const axios = require("axios");
const { sendButtons } = require("gifted-btns");

// Fallback owner info (used if not provided by settings)
const DEFAULT_OWNER_NAME = "Stany TZ";
const DEFAULT_OWNER_NUMBER = "255787079580";

function extractButtonId(msg) {
    if (!msg) return null;
    if (msg.templateButtonReplyMessage?.selectedId)
        return msg.templateButtonReplyMessage.selectedId;
    if (msg.buttonsResponseMessage?.selectedButtonId)
        return msg.buttonsResponseMessage.selectedButtonId;
    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
        return msg.listResponseMessage.singleSelectReply.selectedRowId;
    if (msg.interactiveResponseMessage) {
        const nf = msg.interactiveResponseMessage.nativeFlowResponseMessage;
        if (nf?.paramsJson) {
            try {
                const p = JSON.parse(nf.paramsJson);
                if (p.id) return p.id;
            } catch {}
        }
        return msg.interactiveResponseMessage.buttonId || null;
    }
    return null;
}

// -------------------------------------------------------------------
//  SPOTIFY – download tracks by URL or search
// -------------------------------------------------------------------
gmd(
    {
        pattern: "spotify",
        category: "downloader",
        react: "🎧",
        aliases: ["spotifydl", "spotidl", "spoti"],
        description: "Download Spotify tracks by URL or song name",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            newsletterJid,
            gmdBuffer,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;
        const ownerName = conText.ownerName || DEFAULT_OWNER_NAME;

        if (!q) {
            await react("❌");
            return reply(
                "📌 *Provide a Spotify URL or song name*\n\n*Examples:*\n.spotify https://open.spotify.com/track/...\n.spotify The Spectre Alan Walker"
            );
        }

        const truncate = (str, len) =>
            str && str.length > len ? str.substring(0, len - 2) + ".." : str;

        const downloadAndSend = async (trackUrl, quotedMsg) => {
            const endpoints = ["spotifydl", "spotifydlv2"];
            const result = await Promise.any(
                endpoints.map(endpoint => {
                    const apiUrl = `${GiftedTechApi}/api/download/${endpoint}?apikey=${GiftedApiKey}&url=${encodeURIComponent(trackUrl)}`;
                    return axios.get(apiUrl, { timeout: 20000 }).then(res => {
                        if (res.data?.success && res.data?.result?.download_url)
                            return res.data.result;
                        throw new Error(`${endpoint}: no download_url`);
                    });
                })
            ).catch(() => null);

            if (!result || !result.download_url) {
                await react("❌");
                return reply("❌ *Failed to fetch track* – please try again.", quotedMsg);
            }

            const { title, download_url } = result;
            const audioBuffer = await gmdBuffer(download_url);
            const formattedAudio = await formatAudio(audioBuffer);
            const fileSize = formattedAudio.length;

            if (fileSize > MAX_MEDIA_SIZE) {
                await Gifted.sendMessage(
                    from,
                    {
                        document: formattedAudio,
                        fileName: `${(title || "spotify_track").replace(/[^\w\s.-]/gi, "")}.mp3`,
                        mimetype: "audio/mpeg",
                    },
                    { quoted: quotedMsg }
                );
            } else {
                await Gifted.sendMessage(
                    from,
                    { audio: formattedAudio, mimetype: "audio/mpeg" },
                    { quoted: quotedMsg }
                );
            }
            await react("✅");
        };

        try {
            // If direct Spotify URL, download immediately
            if (q.includes("spotify.com")) {
                await downloadAndSend(q, mek);
                return;
            }

            // Search for tracks
            const searchUrl = `${GiftedTechApi}/api/search/spotifysearch?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
            const searchResponse = await axios.get(searchUrl, { timeout: 30000 });
            const data = searchResponse.data;

            if (!data?.success || !data?.results) {
                await react("❌");
                return reply("❌ *Search failed* – please use a direct Spotify URL.");
            }

            const results = data.results;
            let tracks = [];
            if (Array.isArray(results)) {
                tracks = results.slice(0, 3);
            } else if (results?.tracks && Array.isArray(results.tracks)) {
                tracks = results.tracks.slice(0, 3);
            } else if (typeof results === "object" && (results.url || results.link)) {
                tracks = [results];
            }

            if (tracks.length === 0) {
                await react("❌");
                return reply("❌ *No tracks found* – try a different query.");
            }

            const dateNow = Date.now();
            const buttons = tracks.map((track, index) => {
                const title = track.title || track.name || "Unknown Track";
                const artist = track.artist || track.artists?.join(", ") || "";
                const displayName = artist ? `${title} - ${artist}` : title;
                return { id: `sp_${index}_${dateNow}`, text: truncate(displayName, 20) };
            });

            const trackList = tracks
                .map((track, i) => {
                    const title = track.title || track.name || "Unknown";
                    const artist = track.artist || track.artists?.join(", ") || "Unknown";
                    return `${i + 1}. ${title} - ${artist}`;
                })
                .join("\n");

            const thumbnailUrl =
                tracks[0]?.thumbnail ||
                tracks[0]?.image ||
                tracks[0]?.album?.images?.[0]?.url ||
                "";

            await sendButtons(Gifted, from, {
                title: `${botName} SPOTIFY`,
                text: `*Search Results:*\n\n${trackList}\n\n*Select a track:*`,
                footer: botFooter,
                image: { url: thumbnailUrl },
                buttons: buttons,
            });

            const handleResponse = async (event) => {
                const messageData = event.messages[0];
                if (!messageData.message) return;
                const selectedButtonId = extractButtonId(messageData.message);
                if (!selectedButtonId || !selectedButtonId.includes(`_${dateNow}`)) return;
                if (messageData.key?.remoteJid !== from) return;

                await react("⬇️");
                try {
                    const index = parseInt(selectedButtonId.split("_")[1]);
                    const selectedTrack = tracks[index];
                    const trackUrl =
                        selectedTrack?.url ||
                        selectedTrack?.link ||
                        selectedTrack?.external_urls?.spotify ||
                        selectedTrack?.spotify_url;
                    if (!trackUrl) {
                        await react("❌");
                        return reply("❌ *Track URL not available*", messageData);
                    }
                    await downloadAndSend(trackUrl, messageData);
                } catch (error) {
                    console.error("Spotify download error:", error);
                    await react("❌");
                    await reply("❌ *Download failed* – please try again.", messageData);
                }
            };

            Gifted.ev.on("messages.upsert", handleResponse);
            setTimeout(() => Gifted.ev.off("messages.upsert", handleResponse), 300000);
        } catch (error) {
            console.error("Spotify API error:", error);
            await react("❌");
            return reply("❌ *An error occurred* – please try again.");
        }
    }
);

// -------------------------------------------------------------------
//  GOOGLE DRIVE – download files from Google Drive
// -------------------------------------------------------------------
gmd(
    {
        pattern: "gdrive",
        category: "downloader",
        react: "📁",
        aliases: ["googledrive", "drive", "gdrivedl"],
        description: "Download from Google Drive",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            gmdBuffer,
            formatAudio,
            formatVideo,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("📌 *Please provide a Google Drive URL*");
        }
        if (!q.includes("drive.google.com")) {
            await react("❌");
            return reply("❌ *Invalid Google Drive URL*");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/gdrivedl?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });
            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply("❌ *Failed to fetch file* – check URL and public access.");
            }

            const { name, download_url } = response.data.result;
            if (!download_url) {
                await react("❌");
                return reply("❌ *No download URL available*");
            }

            // Get mime type from the actual download URL (not from the file name)
            let mimetype = "application/octet-stream";
            let mimeCategory = "document";
            try {
                const head = await axios.head(download_url, { timeout: 15000 });
                if (head.headers["content-type"]) {
                    mimetype = head.headers["content-type"].split(";")[0].trim();
                    mimeCategory = getMimeCategory(mimetype);
                }
            } catch (headErr) {
                // fallback: guess from file name
                const ext = name ? name.split(".").pop()?.toLowerCase() : "";
                if (["mp3", "m4a", "wav"].includes(ext)) mimeCategory = "audio";
                else if (["mp4", "mkv", "avi"].includes(ext)) mimeCategory = "video";
                else if (["jpg", "jpeg", "png", "gif"].includes(ext)) mimeCategory = "image";
            }

            let fileBuffer;
            try {
                fileBuffer = await gmdBuffer(download_url);
            } catch (dlErr) {
                if (dlErr.response?.status === 404 || dlErr.message?.includes("404")) {
                    await react("❌");
                    return reply("❌ *File not found* – it may have been deleted.");
                }
                throw dlErr;
            }

            const fileSize = fileBuffer.length;
            const sendAsDoc = fileSize > MAX_MEDIA_SIZE || mimeCategory === "document";

            if (mimeCategory === "audio" && !sendAsDoc) {
                const formattedAudio = await formatAudio(fileBuffer);
                await Gifted.sendMessage(from, { audio: formattedAudio, mimetype: "audio/mpeg" }, { quoted: mek });
            } else if (mimeCategory === "video" && !sendAsDoc) {
                const formattedVideo = await formatVideo(fileBuffer);
                await Gifted.sendMessage(from, { video: formattedVideo, mimetype: "video/mp4", caption: `*${name || "Google Drive File"}*` }, { quoted: mek });
            } else if (mimeCategory === "image" && !sendAsDoc) {
                await Gifted.sendMessage(from, { image: fileBuffer, caption: `*${name || "Google Drive File"}*` }, { quoted: mek });
            } else {
                await Gifted.sendMessage(from, { document: fileBuffer, fileName: name || "gdrive_file", mimetype: mimetype }, { quoted: mek });
            }

            await react("✅");
            await reply(`✅ *File sent successfully*\n> ${botFooter}`);
        } catch (error) {
            console.error("Google Drive error:", error);
            await react("❌");
            const msg = error.response?.status === 404 ? "❌ *File not found*" : "❌ *An error occurred* – please try again.";
            return reply(msg);
        }
    }
);

// -------------------------------------------------------------------
//  MEDIAFIRE – download files from MediaFire
// -------------------------------------------------------------------
gmd(
    {
        pattern: "mediafire",
        category: "downloader",
        react: "🔥",
        aliases: ["mfire", "mediafiredl", "mfiredl"],
        description: "Download from MediaFire",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            gmdBuffer,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("📌 *Please provide a MediaFire URL*");
        }
        if (!q.includes("mediafire.com")) {
            await react("❌");
            return reply("❌ *Invalid MediaFire URL*");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/mediafire?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });
            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply("❌ *Failed to fetch file* – check URL.");
            }

            const { fileName, fileSize, fileType, mimeType, downloadUrl } = response.data.result;
            if (!downloadUrl) {
                await react("❌");
                return reply("❌ *No download URL available*");
            }

            // Determine mime type
            let mimetype = mimeType || "application/octet-stream";
            let mimeCategory = getMimeCategory(mimetype);
            if (mimeCategory === "document" && fileName) {
                const ext = fileName.split(".").pop()?.toLowerCase();
                if (["mp3", "m4a", "wav"].includes(ext)) mimeCategory = "audio";
                else if (["mp4", "mkv", "avi"].includes(ext)) mimeCategory = "video";
                else if (["jpg", "jpeg", "png", "gif"].includes(ext)) mimeCategory = "image";
            }

            // Parse size (e.g., "2.5 MB")
            const sizeMatch = fileSize?.match(/([\d.]+)\s*(KB|MB|GB)/i);
            let sizeBytes = MAX_MEDIA_SIZE + 1; // default: send as doc
            if (sizeMatch) {
                const num = parseFloat(sizeMatch[1]);
                const unit = sizeMatch[2].toUpperCase();
                if (unit === "KB") sizeBytes = num * 1024;
                else if (unit === "MB") sizeBytes = num * 1024 * 1024;
                else if (unit === "GB") sizeBytes = num * 1024 * 1024 * 1024;
            }

            const sendAsDoc = sizeBytes > MAX_MEDIA_SIZE || mimeCategory === "document";

            const caption = `*${fileName || "MediaFire File"}*\n*Size:* ${fileSize || "Unknown"}\n*Type:* ${fileType || "Unknown"}`;

            if (mimeCategory === "audio" && !sendAsDoc) {
                const audioBuffer = await gmdBuffer(downloadUrl);
                const formattedAudio = await formatAudio(audioBuffer);
                await Gifted.sendMessage(from, { audio: formattedAudio, mimetype: "audio/mpeg" }, { quoted: mek });
            } else if (mimeCategory === "video" && !sendAsDoc) {
                await Gifted.sendMessage(from, { video: { url: downloadUrl }, mimetype: mimetype, caption: caption }, { quoted: mek });
            } else if (mimeCategory === "image" && !sendAsDoc) {
                await Gifted.sendMessage(from, { image: { url: downloadUrl }, caption: caption }, { quoted: mek });
            } else {
                await Gifted.sendMessage(from, { document: { url: downloadUrl }, fileName: fileName || "mediafire_file", mimetype: mimetype, caption: caption }, { quoted: mek });
            }

            await react("✅");
        } catch (error) {
            console.error("MediaFire error:", error);
            await react("❌");
            return reply("❌ *An error occurred* – please try again.");
        }
    }
);

// -------------------------------------------------------------------
//  APK – search and download Android apps
// -------------------------------------------------------------------
gmd(
    {
        pattern: "apk",
        category: "downloader",
        react: "📱",
        aliases: ["app", "apkdl", "appdownload"],
        description: "Download Android APK files",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("📌 *Provide an app name*\n\n*Example:* .apk WhatsApp");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/apkdl?apikey=${GiftedApiKey}&appName=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });
            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply("❌ *App not found* – try a different name.");
            }

            const { appname, appicon, developer, mimetype, download_url } = response.data.result;
            if (!download_url) {
                await react("❌");
                return reply("❌ *No download URL available*");
            }

            const caption = `*${botName} APK DOWNLOADER*\n\n*App:* ${appname || q}\n*Developer:* ${developer || "Unknown"}\n\n_Downloading APK..._`;
            await Gifted.sendMessage(from, { image: { url: appicon }, caption: caption }, { quoted: mek });
            await Gifted.sendMessage(from, {
                document: { url: download_url },
                fileName: `${(appname || q).replace(/[^\w\s.-]/gi, "")}.apk`,
                mimetype: mimetype || "application/vnd.android.package-archive",
            }, { quoted: mek });

            await react("✅");
        } catch (error) {
            console.error("APK download error:", error);
            await react("❌");
            return reply("❌ *An error occurred* – please try again.");
        }
    }
);

// -------------------------------------------------------------------
//  PASTEBIN – fetch content from Pastebin
// -------------------------------------------------------------------
gmd(
    {
        pattern: "pastebin",
        category: "downloader",
        react: "📋",
        aliases: ["getpaste", "getpastebin", "pastedl", "pastebindl", "paste"],
        description: "Fetch content from Pastebin",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("📌 *Provide a Pastebin URL*\n\n*Example:* .pastebin https://pastebin.com/xxxxxx");
        }
        if (!q.includes("pastebin.com")) {
            await react("❌");
            return reply("❌ *Invalid Pastebin URL*");
        }

        try {
            await reply("⏳ *Fetching paste content...*");
            const apiUrl = `${GiftedTechApi}/api/download/pastebin?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });
            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply("❌ *Failed to fetch paste* – check URL.");
            }

            let content = response.data.result;
            content = content.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
            content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

            const pasteId = q.split("/").pop().split("?")[0];
            const header = `*${botName} PASTEBIN VIEWER*\n*Paste ID:* ${pasteId}\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            const fullMessage = header + content;

            if (fullMessage.length > 65000) {
                const textBuffer = Buffer.from(content, "utf-8");
                await Gifted.sendMessage(from, {
                    document: textBuffer,
                    fileName: `pastebin_${pasteId}.txt`,
                    mimetype: "text/plain",
                    caption: `*Paste ID:* ${pasteId}\n_Content too long, sent as file_`,
                }, { quoted: mek });
            } else {
                await Gifted.sendMessage(from, { text: fullMessage }, { quoted: mek });
            }

            await react("✅");
        } catch (error) {
            console.error("Pastebin error:", error);
            await react("❌");
            return reply("❌ *An error occurred* – please try again.");
        }
    }
);

// -------------------------------------------------------------------
//  YTV – download YouTube videos (360p, 720p, 1080p)
// -------------------------------------------------------------------
gmd(
    {
        pattern: "ytv",
        category: "downloader",
        react: "📽",
        description: "Download Video from YouTube",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            sender,
            botPic,
            botName,
            botFooter,
            newsletterUrl,
            newsletterJid,
            gmdJson,
            gmdBuffer,
            formatVideo,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("📌 *Please provide a YouTube URL*");
        }
        if (!q.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//)) {
            await react("❌");
            return reply("❌ *Invalid YouTube URL*");
        }

        try {
            const searchResponse = await gmdJson(`${GiftedTechApi}/search/yts?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`);
            const videoInfo = searchResponse.results[0];
            const infoMessage = {
                image: { url: videoInfo.thumbnail || botPic },
                caption: `> *${botName} VIDEO DOWNLOADER*\n\n*Title:* ${videoInfo.title}\n*Duration:* ${videoInfo.timestamp}\n*Views:* ${videoInfo.views}\n*Uploaded:* ${videoInfo.ago}\n*Artist:* ${videoInfo.author.name}\n\n*Reply With:*\n1 - Download 360p\n2 - Download 720p\n3 - Download 1080p`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 5,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: botName, serverMessageId: 143 },
                },
            };
            const sentMessage = await Gifted.sendMessage(from, infoMessage, { quoted: mek });
            const messageId = sentMessage.key.id;

            const handleResponse = async (event) => {
                const messageData = event.messages[0];
                if (!messageData.message) return;
                const isReplyToPrompt = messageData.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;
                if (!isReplyToPrompt) return;

                const userChoice = messageData.message.conversation || messageData.message.extendedTextMessage?.text;
                await react("⬇️");

                try {
                    let quality;
                    switch (userChoice?.trim()) {
                        case "1": quality = 360; break;
                        case "2": quality = 720; break;
                        case "3": quality = 1080; break;
                        default:
                            return reply("❌ *Invalid option* – please reply with 1, 2 or 3", messageData);
                    }

                    const downloadResult = await giftedDls.ytmp4(q, quality);
                    const downloadUrl = downloadResult.result.download_url;
                    const videoBuffer = await gmdBuffer(downloadUrl);
                    if (videoBuffer instanceof Error) throw new Error("Download failed");

                    const fileSize = videoBuffer.length;
                    const sendAsDoc = fileSize > MAX_MEDIA_SIZE;

                    if (sendAsDoc) {
                        await Gifted.sendMessage(from, {
                            document: videoBuffer,
                            fileName: `${videoInfo.title.replace(/[^\w\s.-]/gi, "")}.mp4`,
                            mimetype: "video/mp4",
                        }, { quoted: messageData });
                    } else {
                        const formattedVideo = await formatVideo(videoBuffer);
                        await Gifted.sendMessage(from, { video: formattedVideo, mimetype: "video/mp4" }, { quoted: messageData });
                    }

                    await react("✅");
                    Gifted.ev.off("messages.upsert", handleResponse);
                } catch (error) {
                    console.error("YTV error:", error);
                    await react("❌");
                    await reply("❌ *Failed to download video* – please try again.", messageData);
                    Gifted.ev.off("messages.upsert", handleResponse);
                }
            };

            Gifted.ev.on("messages.upsert", handleResponse);
            setTimeout(() => Gifted.ev.off("messages.upsert", handleResponse), 300000);
        } catch (error) {
            console.error("YouTube API error:", error);
            await react("❌");
            return reply("❌ *An error occurred* – please try again.");
        }
    }
);