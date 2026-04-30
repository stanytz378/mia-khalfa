/**
 *  MIA KHALIFA - WhatsApp Bot
 *  Copyright (c) 2026 STANY TZ
 * 
 *  GitHub: https://github.com/Stanytz378
 *  YouTube: https://youtube.com/@STANYTZ
 *  WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p
 */

const { gmd, commands, formatBytes } = require("../stanytz"),
  fs = require("fs"),
  axios = require("axios"),
  BOT_START_TIME = Date.now(),
  { totalmem: totalMemoryBytes, freemem: freeMemoryBytes } = require("os"),
  moment = require("moment-timezone"),
  ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;
const { sendButtons } = require("gifted-btns");

// Developer number (STANY TZ)
const DEV_NUMBER = "255787069580";

// Helper: get unique categories from commands
function getUniqueCategories() {
  const cats = new Set();
  commands.forEach(cmd => {
    if (cmd.pattern && !cmd.dontAddCommandList && cmd.category) {
      cats.add(cmd.category);
    }
  });
  return Array.from(cats).sort();
}

// Helper: get commands of a specific category (return array of command patterns)
function getCommandsByCategory(category) {
  return commands.filter(cmd => 
    cmd.pattern && !cmd.dontAddCommandList && cmd.category === category
  ).map(cmd => cmd.pattern).sort();
}

// Helper: get time-based greeting
function getGreeting(pushName) {
  const hour = new Date().getHours();
  let greeting = "";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";
  else if (hour < 22) greeting = "Good evening";
  else greeting = "Good night";
  return `${greeting} @${pushName.split(" ")[0] || pushName}`;
}

// ======================= PING =======================
gmd(
  {
    pattern: "ping",
    aliases: ["pi", "p"],
    react: "⚡",
    category: "general",
    description: "Check bot response speed",
  },
  async (from, Gifted, conText) => {
    const { react, newsletterUrl, botFooter, botPrefix } = conText;
    const startTime = process.hrtime();
    await new Promise((resolve) => setTimeout(resolve, Math.floor(80 + Math.random() * 420)));
    const elapsed = process.hrtime(startTime);
    const responseTime = Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000);
    await sendButtons(Gifted, from, {
      title: "Bot Speed",
      text: `⚡ Pong: ${responseTime}ms`,
      footer: `> ${botFooter}`,
      buttons: [
        { id: `${botPrefix}uptime`, text: "⏱️ Uptime" },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "WaChannel",
            url: newsletterUrl,
          }),
        },
      ],
    });
    await react("✅");
  },
);

// ======================= REPORT =======================
gmd(
  {
    pattern: "report",
    aliases: ["request"],
    react: "💫",
    description: "Request new features or report issues.",
    category: "owner",
  },
  async (from, Gifted, conText) => {
    const { mek, q, sender, react, botPrefix, isSuperUser, reply } = conText;
    const reportedMessages = {};
    try {
      if (!isSuperUser) return reply("Owner only command.");
      if (!q) return reply(`Example: ${botPrefix}report hi, downloader commands not working`);
      const messageId = mek.key.id;
      if (reportedMessages[messageId]) {
        return reply("This report has already been forwarded. Please wait.");
      }
      reportedMessages[messageId] = true;
      const reportText = `*| REPORT |*\n\nUser: @${sender.split("@")[0]}\nMessage: ${q}`;
      await Gifted.sendMessage(
        DEV_NUMBER + "@s.whatsapp.net",
        { text: reportText, mentions: [sender] },
        { quoted: mek }
      );
      reply("Thank you for your report. It has been sent to the developer.");
      await react("✅");
    } catch (e) {
      reply(e.message);
    }
  },
);

// ======================= MENUS (stats only, plain) =======================
gmd(
  {
    pattern: "menus",
    aliases: ["mainmenu", "mainmens"],
    description: "Show bot statistics (uptime, date, time, etc.)",
    react: "📜",
    category: "general",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botMode,
      botVersion,
      botName,
      timeZone,
      newsletterJid,
      reply,
      ownerNumber,
    } = conText;
    try {
      function formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        seconds %= 24 * 60 * 60;
        const hours = Math.floor(seconds / (60 * 60));
        seconds %= 60 * 60;
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }
      const now = new Date();
      const date = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(now);
      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);
      const uptime = formatUptime(process.uptime());
      const totalCommands = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

      const stats = `📊 ${botName} STATS

Uptime    : ${uptime}
Date      : ${date}
Time      : ${time}
User      : ${pushName}
Owner     : ${ownerNumber}
Memory    : ${ram}
Mode      : ${botMode}
Plugins   : ${totalCommands}
Version   : ${botVersion}
Timezone  : ${timeZone}`;

      await Gifted.sendMessage(from, {
        image: { url: botPic },
        caption: stats,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 0,
          },
        },
      }, { quoted: mek });
      await react("✅");
    } catch (e) {
      reply(e.message);
    }
  },
);

// ======================= LIST (all commands - plain) =======================
gmd(
  {
    pattern: "list",
    aliases: ["listmenu", "listmen"],
    description: "Show all available commands (full list)",
    react: "📜",
    category: "general",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botMode,
      botVersion,
      botName,
      botPrefix,
      newsletterJid,
      reply,
    } = conText;
    try {
      const totalCommands = commands.filter(c => c.pattern && !c.dontAddCommandList).length;
      let list = `╭─[ ${botName} ]─\n│ Mode   : ${botMode}\n│ Prefix : ${botPrefix}\n│ User   : ${pushName}\n│ Plugins: ${totalCommands}\n│ Version: ${botVersion}\n╰─────────────\n\n`;
      commands.forEach((cmd, idx) => {
        if (cmd.pattern && cmd.description) {
          list += `${idx+1}. ${cmd.pattern}\n   ${cmd.description}\n`;
        }
      });
      await Gifted.sendMessage(from, {
        image: { url: botPic },
        caption: list,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 0,
          },
        },
      }, { quoted: mek });
      await react("✅");
    } catch (e) {
      reply(e.message);
    }
  },
);

// ======================= MAIN MENU (buttons + personalized greeting) =======================
gmd(
  {
    pattern: "menu",
    aliases: ["help", "men", "allmenu"],
    react: "🪀",
    category: "general",
    description: "Interactive category menu with personal greeting",
  },
  async (from, Gifted, conText) => {
    const { react, botName, botFooter, pushName, botPic, sender } = conText;
    try {
      const categories = getUniqueCategories();
      if (categories.length === 0) {
        return await Gifted.sendMessage(from, { text: "No categories found." });
      }
      const greeting = getGreeting(pushName);
      const dateNow = Date.now();
      const buttons = categories.map(cat => ({
        id: `menu_cat_${cat}_${dateNow}`,
        text: cat.charAt(0).toUpperCase() + cat.slice(1)
      }));

      const menuText = `${greeting},\n\nI'm *${botName}*, a WhatsApp bot. Select a category below to see what I can do, honey. 🍑`;

      // Send image with buttons
      await sendButtons(Gifted, from, {
        title: "✨ " + botName,
        text: menuText,
        footer: `> ${botFooter}`,
        image: { url: botPic },
        buttons: buttons,
      });

      // Handle button clicks (show commands for selected category)
      const handleCategoryClick = async (event) => {
        const msg = event.messages[0];
        if (!msg?.message) return;
        let selectedId = null;
        if (msg.message.templateButtonReplyMessage) {
          selectedId = msg.message.templateButtonReplyMessage.selectedId;
        } else if (msg.message.buttonsResponseMessage) {
          selectedId = msg.message.buttonsResponseMessage.selectedButtonId;
        } else if (msg.message.listResponseMessage?.singleSelectReply) {
          selectedId = msg.message.listResponseMessage.singleSelectReply.selectedRowId;
        } else if (msg.message.interactiveResponseMessage) {
          const nf = msg.message.interactiveResponseMessage.nativeFlowResponseMessage;
          if (nf?.paramsJson) {
            try {
              const params = JSON.parse(nf.paramsJson);
              if (params.id) selectedId = params.id;
            } catch (e) {}
          }
          if (!selectedId) selectedId = msg.message.interactiveResponseMessage.buttonId;
        }
        if (!selectedId) return;
        if (!selectedId.includes(`_${dateNow}`)) return;
        if (msg.key.remoteJid !== from) return;

        const match = selectedId.match(/menu_cat_(.+?)_\d+/);
        if (!match) return;
        const catName = match[1];
        const cmds = getCommandsByCategory(catName);
        if (cmds.length === 0) {
          await Gifted.sendMessage(from, { text: `No commands in category: ${catName}` }, { quoted: msg });
          return;
        }
        let replyMsg = `*${catName.toUpperCase()}* commands (${cmds.length}):\n\n`;
        cmds.forEach(cmd => {
          replyMsg += `◉ .${cmd}\n`;
        });
        replyMsg += `\n_Type any command to use it._`;
        await Gifted.sendMessage(from, { text: replyMsg }, { quoted: msg });
      };

      Gifted.ev.on("messages.upsert", handleCategoryClick);
      setTimeout(() => Gifted.ev.off("messages.upsert", handleCategoryClick), 120000);
      await react("✅");
    } catch (err) {
      console.error(err);
      await Gifted.sendMessage(from, { text: "An error occurred while loading the menu." });
    }
  },
);

// ======================= RETURN (owner raw message) =======================
gmd(
  {
    pattern: "return",
    aliases: ["details", "det", "ret"],
    react: "⚡",
    category: "owner",
    description: "Show raw JSON of quoted message (owner only).",
  },
  async (from, Gifted, conText) => {
    const { reply, react, quotedMsg, isSuperUser, botFooter, newsletterUrl } = conText;
    if (!isSuperUser) return reply("Owner only command.");
    if (!quotedMsg) return reply("Reply to a message.");
    try {
      const jsonString = JSON.stringify(quotedMsg, null, 2);
      const chunks = jsonString.match(/[\s\S]{1,100000}/g) || [];
      for (const chunk of chunks) {
        const formatted = "```\n" + chunk + "\n```";
        await sendButtons(Gifted, from, {
          title: "",
          text: formatted,
          footer: `> ${botFooter}`,
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({ display_text: "Copy", copy_code: formatted }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({ display_text: "WaChannel", url: newsletterUrl }),
            },
          ],
        });
        await react("✅");
      }
    } catch (err) {
      reply("Error processing message.");
    }
  },
);

// ======================= UPTIME =======================
gmd(
  {
    pattern: "uptime",
    aliases: ["up"],
    react: "⏳",
    category: "general",
    description: "Check bot uptime.",
  },
  async (from, Gifted, conText) => {
    const { react, newsletterUrl, botFooter, botPrefix } = conText;
    const uptimeMs = Date.now() - BOT_START_TIME;
    const sec = Math.floor((uptimeMs / 1000) % 60);
    const min = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hrs = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    await sendButtons(Gifted, from, {
      title: "",
      text: `⏱️ Uptime: ${days}d ${hrs}h ${min}m ${sec}s`,
      footer: `> ${botFooter}`,
      buttons: [
        { id: `${botPrefix}ping`, text: "⚡ Ping" },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({ display_text: "WaChannel", url: newsletterUrl }),
        },
      ],
    });
    await react("✅");
  },
);

// ======================= REPO (improved) =======================
gmd(
  {
    pattern: "repo",
    aliases: ["sc", "rep", "script"],
    react: "💜",
    category: "general",
    description: "Get repository info and download.",
  },
  async (from, Gifted, conText) => {
    const { react, botPic, botName, botFooter, newsletterUrl, ownerName, giftedRepo } = conText;
    try {
      const { data } = await axios.get(`https://api.github.com/repos/${giftedRepo}`);
      const { name, forks_count, stargazers_count, created_at, updated_at, html_url } = data;
      const message = `✨ *${botName} Repository* ✨

📦 Name: ${name}
⭐ Stars: ${stargazers_count}
🍴 Forks: ${forks_count}
📅 Created: ${new Date(created_at).toDateString()}
🔄 Updated: ${new Date(updated_at).toDateString()}
🔗 Link: ${html_url}

> Built with 💜 by STANY TZ
> Tap below to copy link or download zip.`;

      const dateNow = Date.now();
      await sendButtons(Gifted, from, {
        title: "📁 GitHub Repo",
        text: message,
        footer: `> ${botFooter}`,
        image: { url: botPic },
        buttons: [
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({ display_text: "Copy Link", copy_code: html_url }),
          },
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({ display_text: "Open Repo", url: html_url }),
          },
          {
            id: `repo_dl_${dateNow}`,
            text: "📥 Download Zip",
          },
        ],
      });

      const handleDownload = async (event) => {
        const evMsg = event.messages[0];
        if (!evMsg?.message) return;
        const btn = evMsg.message.templateButtonReplyMessage;
        if (!btn || !btn.selectedId?.includes(`repo_dl_${dateNow}`)) return;
        if (evMsg.key.remoteJid !== from) return;
        try {
          const zipUrl = `https://github.com/${giftedRepo}/archive/refs/heads/main.zip`;
          await Gifted.sendMessage(from, {
            document: { url: zipUrl },
            fileName: `${name}.zip`,
            mimetype: "application/zip",
          }, { quoted: evMsg });
          await react("✅");
        } catch (e) {
          await Gifted.sendMessage(from, { text: "Failed to download zip." }, { quoted: evMsg });
        }
        Gifted.ev.off("messages.upsert", handleDownload);
      };
      Gifted.ev.on("messages.upsert", handleDownload);
      setTimeout(() => Gifted.ev.off("messages.upsert", handleDownload), 120000);
      await react("✅");
    } catch (err) {
      await react("❌");
      await Gifted.sendMessage(from, { text: "Error fetching repository info." });
    }
  },
);

// ======================= SAVE (owner only) =======================
gmd(
  {
    pattern: "save",
    aliases: ["sv", "s", "sav", "."],
    react: "⚡",
    category: "owner",
    description: "Save any quoted media/file to your DM.",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, isSuperUser, getMediaBuffer } = conText;
    if (!isSuperUser) return reply("Owner only command.");
    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return reply("Reply to a message.");
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
      } else if (quoted.documentMessage || quoted.documentWithCaptionMessage?.message?.documentMessage) {
        const doc = quoted.documentMessage || quoted.documentWithCaptionMessage.message.documentMessage;
        const buf = await getMediaBuffer(doc, "document");
        media = { document: buf, fileName: doc.fileName || "file", mimetype: doc.mimetype || "application/octet-stream" };
      } else if (quoted.conversation || quoted.extendedTextMessage?.text) {
        const txt = quoted.conversation || quoted.extendedTextMessage.text;
        media = { text: txt };
      } else {
        return reply("Unsupported message type.");
      }
      await Gifted.sendMessage(sender, media, { quoted: mek });
      await react("✅");
    } catch (err) {
      reply(`Error: ${err.message}`);
    }
  },
);
