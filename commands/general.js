const { gmd, commands, formatBytes } = require("../stanytz"),
  fs = require("fs"),
  axios = require("axios"),
  BOT_START_TIME = Date.now(),
  { totalmem: totalMemoryBytes, freemem: freeMemoryBytes } = require("os"),
  moment = require("moment-timezone"),
  more = String.fromCharCode(8206),
  readmore = more.repeat(4001),
  ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;
const { sendButtons } = require("gifted-btns");

// --------------------------------------------------------------
// Helper: extract selected row id from interactive list response
// --------------------------------------------------------------
function extractListId(msg) {
  if (!msg) return null;
  const listResp = msg.listResponseMessage || msg.interactiveResponseMessage?.listResponseMessage;
  if (listResp?.singleSelectReply?.selectedRowId) return listResp.singleSelectReply.selectedRowId;
  return null;
}

// --------------------------------------------------------------
// PING – simple response
// --------------------------------------------------------------
gmd(
  {
    pattern: "ping",
    aliases: ["pi", "p"],
    react: "⚡",
    category: "general",
    description: "Check bot response speed",
  },
  async (from, Gifted, conText) => {
    const { mek, react, newsletterUrl, botFooter, botPrefix } = conText;
    const startTime = process.hrtime();
    await new Promise((resolve) => setTimeout(resolve, Math.floor(80 + Math.random() * 420)));
    const elapsed = process.hrtime(startTime);
    const responseTime = Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000);
    await sendButtons(Gifted, from, {
      title: "⚡ Speed Test",
      text: `🏓 *Pong* : ${responseTime}ms`,
      footer: `> ${botFooter}`,
      buttons: [
        { id: `${botPrefix}uptime`, text: "⏱️ Uptime" },
        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: newsletterUrl }) },
      ],
    });
    await react("✅");
  },
);

// --------------------------------------------------------------
// REPORT – owner only (nice design)
// --------------------------------------------------------------
gmd(
  {
    pattern: "report",
    aliases: ["request"],
    react: "💫",
    description: "Request new features or report issues",
    category: "owner",
  },
  async (from, Gifted, conText) => {
    const { mek, q, sender, react, pushName, botPrefix, isSuperUser, reply } = conText;
    const reportedMessages = {};
    const devNumber = "255787069580";
    try {
      if (!isSuperUser) return reply("*Owner Only*");
      if (!q) return reply(`📝 Example: ${botPrefix}request down command not working`);
      const msgId = mek.key.id;
      if (reportedMessages[msgId]) return reply("⏳ Already reported");
      reportedMessages[msgId] = true;
      const text = `*📢 REQUEST / REPORT*\n\n👤 User: @${sender.split("@")[0]}\n📝 Message: ${q}`;
      await Gifted.sendMessage(devNumber + "@s.whatsapp.net", { text, mentions: [sender] }, { quoted: mek });
      reply("✅ Request sent to owner. Thank you!");
      await react("✅");
    } catch (e) { reply(e.message); console.log(e); }
  },
);

// --------------------------------------------------------------
// MENUS – beautiful stats card
// --------------------------------------------------------------
gmd(
  {
    pattern: "menus",
    aliases: ["mainmenu", "mainmens"],
    react: "📊",
    category: "general",
    description: "Display bot stats in a beautiful card",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, pushName, botPic, botMode, botVersion, botName, timeZone, newsletterJid, reply, ownerNumber } = conText;
    try {
      const uptime = (() => {
        let s = process.uptime();
        const d = Math.floor(s / 86400); s %= 86400;
        const h = Math.floor(s / 3600); s %= 3600;
        const m = Math.floor(s / 60); s %= 60;
        return `${d}d ${h}h ${m}m ${Math.floor(s)}s`;
      })();
      const now = new Date();
      const date = new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).format(now);
      const time = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
      const totalCmds = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

      const stats = `
╭━━━━━━━━━━━━━━━━━━━━╮
┃   🤖 *${botName}* STATS   🤖
╰━━━━━━━━━━━━━━━━━━━━╯

┌──────────────────────┐
│ 🕒 *Uptime*    : ${uptime}
│ 📅 *Date*      : ${date}
│ ⏰ *Time*      : ${time}
│ 👤 *User*      : ${pushName}
│ 👑 *Owner*     : Stany TZ (${ownerNumber})
│ 🧠 *RAM*       : ${ram}
│ 🎮 *Commands*  : ${totalCmds}
│ 🛠️ *Mode*      : ${botMode}
│ 📦 *Version*   : ${botVersion}
└──────────────────────┘

💡 *Tip* : Type .menu for interactive categories
> © 2026 Stany TZ
      `.trim();

      await Gifted.sendMessage(from, { image: { url: botPic }, caption: stats, contextInfo: { mentionedJid: [sender], forwardingScore: 5, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: botName, serverMessageId: 0 } } }, { quoted: mek });
      await react("💎");
    } catch (e) { console.error(e); reply(`❌ ${e.message}`); }
  },
);

// --------------------------------------------------------------
// LIST – all commands with categories (clean layout)
// --------------------------------------------------------------
gmd(
  {
    pattern: "list",
    aliases: ["listmenu", "listmen"],
    react: "📋",
    category: "general",
    description: "Show all commands with descriptions",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, pushName, botPic, botMode, botVersion, botName, timeZone, botPrefix, newsletterJid, reply } = conText;
    try {
      const uptime = (() => {
        let s = process.uptime();
        const d = Math.floor(s / 86400); s %= 86400;
        const h = Math.floor(s / 3600); s %= 3600;
        const m = Math.floor(s / 60); s %= 60;
        return `${d}d ${h}h ${m}m ${Math.floor(s)}s`;
      })();
      const totalCmds = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

      let list = `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   📋 *${botName}* COMMANDS   ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
      list += `👤 User: ${pushName}  |  🧩 ${totalCmds} plugins\n`;
      list += `⏱️ Uptime: ${uptime}  |  🛠️ Mode: ${botMode}\n`;
      list += `📅 ${new Date().toLocaleString()}\n\n`;

      const cats = {};
      commands.forEach(cmd => {
        if (cmd.pattern && !cmd.dontAddCommandList) {
          const cat = cmd.category || "general";
          if (!cats[cat]) cats[cat] = [];
          cats[cat].push({ pattern: cmd.pattern, desc: cmd.description || "No description" });
        }
      });
      for (const [cat, cmds] of Object.entries(cats).sort()) {
        list += `▸ *${cat.toUpperCase()}* (${cmds.length})\n`;
        cmds.forEach(c => {
          list += `   ✦ ${botPrefix}${c.pattern}\n      ↳ ${c.desc}\n`;
        });
        list += `\n`;
      }
      list += `💡 *Type .menu for interactive category selection*\n> © 2026 Stany TZ`;

      await Gifted.sendMessage(from, { image: { url: botPic }, caption: list, contextInfo: { mentionedJid: [sender], forwardingScore: 5, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: botName, serverMessageId: 0 } } }, { quoted: mek });
      await react("✅");
    } catch (e) { console.error(e); reply(`${e.message}`); }
  },
);

// --------------------------------------------------------------
// INTERACTIVE MENU – categories as buttons (modern style)
// --------------------------------------------------------------
gmd(
  {
    pattern: "menu",
    aliases: ["help", "men", "allmenu"],
    react: "📌",
    category: "general",
    description: "Interactive menu – tap a category to see commands",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, pushName, botPic, botName, botFooter, botPrefix, reply } = conText;

    try {
      // Collect categories
      const cats = {};
      commands.forEach(cmd => {
        if (cmd.pattern && !cmd.dontAddCommandList) {
          const cat = cmd.category || "general";
          if (!cats[cat]) cats[cat] = [];
          cats[cat].push({ pattern: cmd.pattern, desc: cmd.description || "No description", isBody: cmd.on === "body" });
        }
      });
      const sortedCats = Object.keys(cats).sort((a, b) => {
        if (a === "owner") return 1;
        if (b === "owner") return -1;
        return a.localeCompare(b);
      });

      // Build rows for interactive list
      const rows = sortedCats.map(cat => ({
        title: `${cat.toUpperCase()}`,
        description: `📦 ${cats[cat].length} commands`,
        rowId: `cat_${cat}`
      }));

      // Send bot logo with greeting
      const greeting = `╭━━━━━━━━━━━━━━━━━━╮\n│   🤖 *${botName}*   🤖   │\n╰━━━━━━━━━━━━━━━━━━╯\n\n👋 Hello @${sender.split("@")[0]}\nTap the button below to explore categories.`;
      await Gifted.sendMessage(from, { image: { url: botPic }, caption: greeting, mentions: [sender] }, { quoted: mek });

      // Send interactive list
      const listMsg = {
        text: "📂 *Select a category* to view all its commands.",
        footer: `> ${botFooter}`,
        interactive: {
          header: { title: botName, hasMedia: false },
          body: { text: "👇 Tap anywhere 👇" },
          footer: { text: botFooter },
          action: {
            button: "☰ OPEN MENU",
            sections: [{ title: "🔖 CATEGORIES", rows }]
          }
        }
      };
      await Gifted.sendMessage(from, listMsg, { quoted: mek });
      await react("💠");

      // Listener for category selection
      const handler = async (event) => {
        const msg = event.messages[0];
        if (!msg?.message) return;
        let selected = null;
        if (msg.message.listResponseMessage?.singleSelectReply?.selectedRowId) selected = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
        else if (msg.message.interactiveResponseMessage?.listResponseMessage?.singleSelectReply?.selectedRowId) selected = msg.message.interactiveResponseMessage.listResponseMessage.singleSelectReply.selectedRowId;
        if (!selected || !selected.startsWith("cat_")) return;
        if (msg.key?.remoteJid !== from) return;
        const catName = selected.replace("cat_", "");
        const cmds = cats[catName];
        if (!cmds) return;
        let cmdList = `╭━━━━━━━━━━━━━━━━━━━━╮\n┃   📂 *${catName.toUpperCase()}*   ┃\n╰━━━━━━━━━━━━━━━━━━━━╯\n\n`;
        cmds.forEach(c => {
          const prefix = c.isBody ? "" : botPrefix;
          cmdList += `✦ *${prefix}${c.pattern}*\n   ↳ ${c.desc}\n\n`;
        });
        cmdList += `➡️ *Type ${botPrefix}menu* to go back.\n> © 2026 Stany TZ`;
        await Gifted.sendMessage(from, { text: cmdList.trim(), mentions: [sender] }, { quoted: msg });
        Gifted.ev.off("messages.upsert", handler);
      };
      Gifted.ev.on("messages.upsert", handler);
      setTimeout(() => Gifted.ev.off("messages.upsert", handler), 120000);
    } catch (err) {
      console.error(err);
      reply(`❌ ${err.message}`);
    }
  }
);

// --------------------------------------------------------------
// RETURN – raw JSON (owner only)
// --------------------------------------------------------------
gmd(
  {
    pattern: "return",
    aliases: ["details", "det", "ret"],
    react: "⚡",
    category: "owner",
    description: "Show raw quoted message JSON",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, quotedMsg, isSuperUser, botFooter, newsletterUrl } = conText;
    if (!isSuperUser) return reply("🔒 Owner only");
    if (!quotedMsg) return reply("Reply to a message");
    try {
      const json = JSON.stringify(quotedMsg, null, 2);
      const chunks = json.match(/[\s\S]{1,100000}/g) || [];
      for (const chunk of chunks) {
        await sendButtons(Gifted, from, {
          title: "",
          text: `\`\`\`\n${chunk}\n\`\`\``,
          footer: `> ${botFooter}`,
          buttons: [
            { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "📋 Copy", copy_code: chunk }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: newsletterUrl }) },
          ],
        });
      }
      await react("✅");
    } catch (e) { reply(`❌ ${e.message}`); }
  },
);

// --------------------------------------------------------------
// UPTIME
// --------------------------------------------------------------
gmd(
  {
    pattern: "uptime",
    aliases: ["up"],
    react: "⏳",
    category: "general",
    description: "Check how long bot has been active",
  },
  async (from, Gifted, conText) => {
    const { react, newsletterUrl, botFooter, botPrefix } = conText;
    const ms = Date.now() - BOT_START_TIME;
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / (1000 * 60)) % 60;
    const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
    const d = Math.floor(ms / (1000 * 60 * 60 * 24));
    await sendButtons(Gifted, from, {
      title: "",
      text: `⏱️ *Uptime* : ${d}d ${h}h ${m}m ${s}s`,
      footer: `> ${botFooter}`,
      buttons: [
        { id: `${botPrefix}ping`, text: "⚡ Ping" },
        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: newsletterUrl }) },
      ],
    });
    await react("✅");
  },
);

// --------------------------------------------------------------
// REPO – GitHub repository info
// --------------------------------------------------------------
gmd(
  {
    pattern: "repo",
    aliases: ["sc", "rep", "script"],
    react: "💜",
    category: "general",
    description: "Get bot repository info",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, pushName, botPic, botName, botFooter, newsletterUrl, ownerName, newsletterJid, giftedRepo } = conText;
    const { data } = await axios.get(`https://api.github.com/repos/${giftedRepo}`);
    const { name, forks_count, stargazers_count, created_at, updated_at } = data;
    const msg = `👋 Hello ${pushName},\n\n🤖 *${botName}* – built by *${ownerName}*\n\n📛 Repo: ${name}\n⭐ Stars: ${stargazers_count}\n🍴 Forks: ${forks_count}\n📅 Created: ${new Date(created_at).toLocaleDateString()}\n🔄 Updated: ${new Date(updated_at).toLocaleDateString()}`;
    const now = Date.now();
    await sendButtons(Gifted, from, {
      title: "",
      text: msg,
      footer: `> ${botFooter}`,
      image: { url: botPic },
      buttons: [
        { name: "cta_copy", buttonParamsJson: JSON.stringify({ display_text: "🔗 Copy Link", copy_code: `https://github.com/${giftedRepo}` }) },
        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "🌐 Visit Repo", url: `https://github.com/${giftedRepo}` }) },
        { id: `repo_dl_${now}`, text: "📥 Download Zip" },
      ],
    });
    const handler = async (ev) => {
      const msgEv = ev.messages[0];
      if (!msgEv?.message) return;
      const btn = msgEv.message?.templateButtonReplyMessage;
      if (btn?.selectedId === `repo_dl_${now}` && msgEv.key.remoteJid === from) {
        const zip = `https://github.com/${giftedRepo}/archive/refs/heads/main.zip`;
        await Gifted.sendMessage(from, { document: { url: zip }, fileName: `${name}.zip`, mimetype: "application/zip" }, { quoted: msgEv });
        await react("✅");
        Gifted.ev.off("messages.upsert", handler);
      }
    };
    Gifted.ev.on("messages.upsert", handler);
    setTimeout(() => Gifted.ev.off("messages.upsert", handler), 120000);
    await react("✅");
  },
);

// --------------------------------------------------------------
// SAVE – owner only, save quoted media
// --------------------------------------------------------------
gmd(
  {
    pattern: "save",
    aliases: ["sv", "s", "sav", "."],
    react: "💾",
    category: "owner",
    description: "Save quoted message/media to owner DM",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, isSuperUser, getMediaBuffer } = conText;
    if (!isSuperUser) return reply("🔒 Owner only");
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return reply("❗ Reply to a message");
    try {
      let media;
      if (quoted.imageMessage) {
        const buf = await getMediaBuffer(quoted.imageMessage, "image");
        media = { image: buf, caption: quoted.imageMessage.caption || "" };
      } else if (quoted.videoMessage) {
        const buf = await getMediaBuffer(quoted.videoMessage, "video");
        media = { video: buf, caption: quoted.videoMessage.caption || "" };
      } else if (quoted.audioMessage) {
        const buf = await getMediaBuffer(quoted.audioMessage, "audio");
        media = { audio: buf, mimetype: "audio/mp4" };
      } else if (quoted.stickerMessage) {
        const buf = await getMediaBuffer(quoted.stickerMessage, "sticker");
        media = { sticker: buf };
      } else if (quoted.documentMessage) {
        const buf = await getMediaBuffer(quoted.documentMessage, "document");
        media = { document: buf, fileName: quoted.documentMessage.fileName, mimetype: quoted.documentMessage.mimetype };
      } else {
        const text = quoted.conversation || quoted.extendedTextMessage?.text || "";
        if (!text) return reply("❌ Unsupported");
        media = { text };
      }
      await Gifted.sendMessage(sender, media, { quoted: mek });
      await react("✅");
    } catch (e) { reply(`❌ ${e.message}`); }
  },
);