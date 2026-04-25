const { gmd, commands, monospace, formatBytes } = require("../stanytz"),
  fs = require("fs"),
  axios = require("axios"),
  BOT_START_TIME = Date.now(),
  { totalmem: totalMemoryBytes, freemem: freeMemoryBytes } = require("os"),
  moment = require("moment-timezone"),
  more = String.fromCharCode(8206),
  readmore = more.repeat(4001),
  ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;
const { sendButtons } = require("gifted-btns");

// ---------- Helper: time‑based greeting (normal font) ----------
const getGreeting = (name) => {
  const hour = new Date().getHours();
  let greeting = "";
  if (hour < 12) greeting = "🌅 Good Morning";
  else if (hour < 17) greeting = "☀️ Good Afternoon";
  else if (hour < 21) greeting = "🌤️ Good Evening";
  else greeting = "🌙 Good Night";
  return `${greeting} @${name.split("@")[0]}`;
};

// --------------------------------------------------------------
// PING COMMAND
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
    const {
      mek,
      react,
      newsletterUrl,
      botFooter,
      botName,
      botPrefix,
    } = conText;
    const startTime = process.hrtime();

    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(80 + Math.random() * 420)),
    );

    const elapsed = process.hrtime(startTime);
    const responseTime = Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000);

    await sendButtons(Gifted, from, {
      title: "✨ Bot Speed ✨",
      text: `💖 Pong: ${responseTime}ms`,
      footer: `> ${botFooter}`,
      buttons: [
        { id: `${botPrefix}uptime`, text: "⏱️ Uptime" },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "📢 Channel",
            url: newsletterUrl,
          }),
        },
      ],
    });
    await react("✅");
  },
);

// --------------------------------------------------------------
// REPORT COMMAND (owner only)
// --------------------------------------------------------------
gmd(
  {
    pattern: "report",
    aliases: ["request"],
    react: "💫",
    description: "Request New Features.",
    category: "owner",
  },
  async (from, Gifted, conText) => {
    const { mek, q, sender, react, pushName, botPrefix, isSuperUser, reply } =
      conText;
    const reportedMessages = {};
    const devlopernumber = "255787069580";
    try {
      if (!isSuperUser) return reply("❌ *Owner Only Command*");
      if (!q)
        return reply(
          `📝 Example: ${botPrefix}request hi, download commands are not working`,
        );
      const messageId = mek.key.id;
      if (reportedMessages[messageId]) {
        return reply(
          "⚠️ This report has already been forwarded to the owner. Please wait.",
        );
      }
      reportedMessages[messageId] = true;
      const textt = `💌 *| REQUEST / REPORT |*`;
      const teks1 = `\n\n👤 *User*: @${sender.split("@")[0]}\n📋 *Request:* ${q}`;
      Gifted.sendMessage(
        devlopernumber + "@s.whatsapp.net",
        {
          text: textt + teks1,
          mentions: [sender],
        },
        { quoted: mek },
      );
      reply(
        "✅ Thank you for your report. It has been sent to the owner. Please wait for a response.",
      );
      await react("✅");
    } catch (e) {
      reply(e);
      console.log(e);
    }
  },
);

// --------------------------------------------------------------
// MENUS COMMAND (simple stats) – kept as is
// --------------------------------------------------------------
gmd(
  {
    pattern: "menus",
    aliases: ["mainmenu", "mainmens"],
    description: "Display Bot's Uptime, Date, Time, and Other Stats",
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
      botFooter,
      timeZone,
      botPrefix,
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
      const totalCommands = commands.filter(
        (command) => command.pattern && !command.dontAddCommandList,
      ).length;

      let menus = `
🦄 *Uptime* : ${uptime}
🍁 *Date* : ${date}
🎗 *Time* : ${time}

🌸 *Founder* : StanyTz
👤 *User* : ${pushName}
📞 *Num* : ${ownerNumber}
💾 *Memory* : ${ram}

💻 *${botName}* is online & ready!

╭──💖 *ALL MENU* 💖
│🏮 List
│🏮 Category
│🏮 Help
│🏮 Alive
│🏮 Uptime
│🏮 Weather
│🏮 Link
│🏮 CPU
│🏮 Repository
╰─────────────💋`;

      const giftedMess = {
        image: { url: botPic },
        caption: menus.trim(),
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
      };
      await Gifted.sendMessage(from, giftedMess, { quoted: mek });
      await react("✅");
    } catch (e) {
      console.error(e);
      reply(`${e}`);
    }
  },
);

// --------------------------------------------------------------
// LIST COMMAND (all commands) – kept as is (monospace preserved)
// --------------------------------------------------------------
gmd(
  {
    pattern: "list",
    aliases: ["listmenu", "listmen"],
    description: "Show All Commands and their Usage",
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
      botFooter,
      timeZone,
      botPrefix,
      newsletterJid,
      reply,
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
      const totalCommands = commands.filter(
        (command) => command.pattern && !command.dontAddCommandList,
      ).length;

      let list = `
╭══〘〘 *${monospace(botName)}* 〙〙═⊷
│ ✦ *Mode* : ${monospace(botMode)}
│ ✦ *Prefix* : [ ${monospace(botPrefix)} ]
│ ✦ *User* : ${monospace(pushName)}
│ ✦ *Plugins* : ${monospace(totalCommands.toString())}
│ ✦ *Version* : ${monospace(botVersion)}
│ ✦ *Uptime* : ${monospace(uptime)}
│ ✦ *Time* : ${monospace(time)}
│ ✦ *Date* : ${monospace(date)}
│ ✦ *Timezone* : ${monospace(timeZone)}
│ ✦ *RAM* : ${monospace(ram)}
╰═════════════════⊷${readmore}\n`;

      commands.forEach((gmd, index) => {
        if (gmd.pattern && gmd.description) {
          list += `*${index + 1} ${monospace(gmd.pattern)}*\n  ${gmd.description}\n`;
        }
      });

      const giftedMess = {
        image: { url: botPic },
        caption: list.trim(),
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
      };
      await Gifted.sendMessage(from, giftedMess, { quoted: mek });
      await react("✅");
    } catch (e) {
      console.error(e);
      reply(`${e}`);
    }
  },
);

// --------------------------------------------------------------
// NEW SEXY INTERACTIVE MENU (normal fonts, buttons for categories)
// --------------------------------------------------------------
gmd(
  {
    pattern: "menu",
    aliases: ["help", "men", "allmenu"],
    react: "💋",
    category: "general",
    description: "✨ Sexy interactive menu – tap a category to see commands",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botName,
      botFooter,
      timeZone,
      botPrefix,
      newsletterJid,
      reply,
    } = conText;

    try {
      // Build categories from loaded commands
      const categorized = {};
      commands.forEach((cmd) => {
        if (cmd.pattern && !cmd.dontAddCommandList) {
          const cat = cmd.category || "general";
          if (!categorized[cat]) categorized[cat] = [];
          categorized[cat].push({
            pattern: cmd.pattern,
            desc: cmd.description || "No description",
            on: cmd.on,
          });
        }
      });

      const sortedCategories = Object.keys(categorized).sort();

      // 1. Send bot logo with personalised sexy greeting (normal fonts)
      const greeting = getGreeting(sender);
      const logoCaption = `${greeting}\n\n💖 *Welcome to ${botName}* 💖\n🌸 *Tap a category below* to explore my sexy commands! 🌸\n\n✨ *Designer:* @clevertechnexus ✨`;

      await Gifted.sendMessage(
        from,
        {
          image: { url: botPic },
          caption: logoCaption,
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
        },
        { quoted: mek }
      );

      // 2. Create interactive list rows (categories as buttons)
      const rows = sortedCategories.map((cat) => ({
        title: `💗 ${cat.toUpperCase()}`,
        description: `✨ ${categorized[cat].length} command(s) available ✨`,
        id: `category_${cat}`,
      }));

      const listMessage = {
        text: `👇 *Choose your vibe* 👇\n💅 *Click on a category* to see all commands inside.`,
        footer: `> ${botFooter}`,
        interactive: {
          header: { title: botName, hasMedia: false },
          body: { text: `📂 *SEXY SECTIONS*` },
          footer: { text: botFooter },
          action: {
            button: "💋 OPEN MENU 💋",
            sections: [
              {
                title: "🌸 BOT COMMANDS 🌸",
                rows: rows,
              },
            ],
          },
        },
      };

      await Gifted.sendMessage(from, listMessage, { quoted: mek });
      await react("💋");

      // 3. Listen for user's category selection
      const handleCategorySelect = async (event) => {
        const msg = event.messages[0];
        if (!msg?.message) return;

        const listResp =
          msg.message?.interactiveResponseMessage?.listResponseMessage ||
          msg.message?.listResponseMessage;
        if (!listResp) return;

        const selectedId = listResp.selectedRowId;
        if (!selectedId?.startsWith("category_")) return;
        if (msg.key?.remoteJid !== from) return;

        const category = selectedId.replace("category_", "");
        const cmds = categorized[category];
        if (!cmds || cmds.length === 0) return;

        // Format command list for this category (normal fonts, no monospace)
        let cmdList = `💕 *${category.toUpperCase()}* (${cmds.length} commands)\n\n`;
        cmds.forEach((cmd) => {
          const prefix = cmd.on === "body" ? "" : botPrefix;
          cmdList += `▸ *${prefix}${cmd.pattern}*\n   └ ${cmd.desc}\n\n`;
        });
        cmdList += `💋 *Type ${botPrefix}menu* to go back to categories.`;

        await Gifted.sendMessage(
          from,
          {
            text: cmdList,
            contextInfo: {
              mentionedJid: [sender],
              forwardingScore: 3,
            },
          },
          { quoted: msg }
        );

        Gifted.ev.off("messages.upsert", handleCategorySelect);
      };

      Gifted.ev.on("messages.upsert", handleCategorySelect);
      setTimeout(() => {
        Gifted.ev.off("messages.upsert", handleCategorySelect);
      }, 120000);
    } catch (e) {
      console.error("Menu error:", e);
      reply(`❌ ${e.message}`);
    }
  },
);

// --------------------------------------------------------------
// RETURN COMMAND (owner only) – kept as is
// --------------------------------------------------------------
gmd(
  {
    pattern: "return",
    aliases: ["details", "det", "ret"],
    react: "⚡",
    category: "owner",
    description: "Displays the full raw quoted message using Baileys structure.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      quotedMsg,
      isSuperUser,
      botName,
      botFooter,
      newsletterJid,
      newsletterUrl,
    } = conText;

    if (!isSuperUser) return reply(`❌ Owner Only Command!`);
    if (!quotedMsg) return reply(`⚠️ Please reply to/quote a message.`);

    try {
      const jsonString = JSON.stringify(quotedMsg, null, 2);
      const chunks = jsonString.match(/[\s\S]{1,100000}/g) || [];

      for (const chunk of chunks) {
        const formattedMessage = `\`\`\`\n${chunk}\n\`\`\``;
        await sendButtons(Gifted, from, {
          title: "",
          text: formattedMessage,
          footer: `> ${botFooter}`,
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "📋 Copy",
                copy_code: formattedMessage,
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "📢 Channel",
                url: newsletterUrl,
              }),
            },
          ],
        });
        await react("✅");
      }
    } catch (error) {
      console.error("Error processing quoted message:", error);
      await reply(`❌ An error occurred.`);
    }
  },
);

// --------------------------------------------------------------
// UPTIME COMMAND
// --------------------------------------------------------------
gmd(
  {
    pattern: "uptime",
    aliases: ["up"],
    react: "⏳",
    category: "general",
    description: "Check bot uptime status.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      react,
      newsletterUrl,
      botFooter,
      botName,
      botPrefix,
    } = conText;

    const uptimeMs = Date.now() - BOT_START_TIME;
    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

    await sendButtons(Gifted, from, {
      title: "",
      text: `⏱️ *Uptime:* ${days}d ${hours}h ${minutes}m ${seconds}s`,
      footer: `> ${botFooter}`,
      buttons: [
        { id: `${botPrefix}ping`, text: "⚡ Ping" },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "📢 Channel",
            url: newsletterUrl,
          }),
        },
      ],
    });
    await react("✅");
  },
);

// --------------------------------------------------------------
// REPO COMMAND
// --------------------------------------------------------------
gmd(
  {
    pattern: "repo",
    aliases: ["sc", "rep", "script"],
    react: "💜",
    category: "general",
    description: "Fetch bot script.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botName,
      botFooter,
      newsletterUrl,
      ownerName,
      newsletterJid,
      giftedRepo,
    } = conText;

    const response = await axios.get(
      `https://api.github.com/repos/${giftedRepo}`,
    );
    const repoData = response.data;
    const {
      name,
      forks_count,
      stargazers_count,
      created_at,
      updated_at,
    } = repoData;

    const messageText = `Hello *${pushName}*,\n\nThis is *${botName}*, a WhatsApp Bot built by *${ownerName}* with amazing features.\n\n❲📛❳ *Name:* ${name}\n❲⭐❳ *Stars:* ${stargazers_count}\n❲🍴❳ *Forks:* ${forks_count}\n❲📅❳ *Created:* ${new Date(created_at).toLocaleDateString()}\n❲🔄❳ *Updated:* ${new Date(updated_at).toLocaleDateString()}`;

    const dateNow = Date.now();
    await sendButtons(Gifted, from, {
      title: "",
      text: messageText,
      footer: `> ${botFooter}`,
      image: { url: botPic },
      buttons: [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "🔗 Copy Link",
            copy_code: `https://github.com/${giftedRepo}`,
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "🌐 Visit Repo",
            url: `https://github.com/${giftedRepo}`,
          }),
        },
        {
          id: `repo_dl_${dateNow}`,
          text: "📥 Download Zip",
        },
      ],
    });

    const handleResponse = async (event) => {
      const messageData = event.messages[0];
      if (!messageData?.message) return;
      const templateButtonReply = messageData.message?.templateButtonReplyMessage;
      if (!templateButtonReply) return;
      const selectedButtonId = templateButtonReply.selectedId;
      if (!selectedButtonId?.includes(`repo_dl_${dateNow}`)) return;
      if (messageData.key?.remoteJid !== from) return;

      try {
        const zipUrl = `https://github.com/${giftedRepo}/archive/refs/heads/main.zip`;
        await Gifted.sendMessage(
          from,
          {
            document: { url: zipUrl },
            fileName: `${name}.zip`,
            mimetype: "application/zip",
          },
          { quoted: messageData }
        );
        await react("✅");
      } catch (dlErr) {
        await Gifted.sendMessage(from, { text: "❌ Failed to download zip: " + dlErr.message }, { quoted: messageData });
      }
      Gifted.ev.off("messages.upsert", handleResponse);
    };

    Gifted.ev.on("messages.upsert", handleResponse);
    setTimeout(() => Gifted.ev.off("messages.upsert", handleResponse), 120000);
    await react("✅");
  },
);

// --------------------------------------------------------------
// SAVE COMMAND (owner only)
// --------------------------------------------------------------
gmd(
  {
    pattern: "save",
    aliases: ["sv", "s", "sav", "."],
    react: "⚡",
    category: "owner",
    description: "Save messages (images, videos, audio, stickers, text).",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, isSuperUser, getMediaBuffer } = conText;

    if (!isSuperUser) return reply(`❌ Owner Only Command!`);

    const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return reply(`⚠️ Please reply to a message.`);

    try {
      let mediaData;

      if (quotedMsg.imageMessage) {
        const buffer = await getMediaBuffer(quotedMsg.imageMessage, "image");
        mediaData = { image: buffer, caption: quotedMsg.imageMessage.caption || "" };
      } else if (quotedMsg.videoMessage) {
        const buffer = await getMediaBuffer(quotedMsg.videoMessage, "video");
        mediaData = { video: buffer, caption: quotedMsg.videoMessage.caption || "" };
      } else if (quotedMsg.audioMessage) {
        const buffer = await getMediaBuffer(quotedMsg.audioMessage, "audio");
        mediaData = { audio: buffer, mimetype: "audio/mp4" };
      } else if (quotedMsg.stickerMessage) {
        const buffer = await getMediaBuffer(quotedMsg.stickerMessage, "sticker");
        mediaData = { sticker: buffer };
      } else if (quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage?.message?.documentMessage) {
        const docMsg = quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage.message.documentMessage;
        const buffer = await getMediaBuffer(docMsg, "document");
        mediaData = { document: buffer, fileName: docMsg.fileName || "document", mimetype: docMsg.mimetype || "application/octet-stream" };
      } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
        const text = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        mediaData = { text: text };
      } else if (quotedMsg.buttonsMessage || quotedMsg.templateMessage || quotedMsg.interactiveMessage || quotedMsg.listMessage || quotedMsg.buttonsResponseMessage || quotedMsg.templateButtonReplyMessage) {
        let text = "";
        if (quotedMsg.buttonsMessage) text = quotedMsg.buttonsMessage.contentText || quotedMsg.buttonsMessage.text || "";
        else if (quotedMsg.templateMessage?.hydratedTemplate) text = quotedMsg.templateMessage.hydratedTemplate.hydratedContentText || "";
        else if (quotedMsg.interactiveMessage?.body?.text) text = quotedMsg.interactiveMessage.body.text;
        else if (quotedMsg.listMessage) text = quotedMsg.listMessage.description || quotedMsg.listMessage.title || "";
        else if (quotedMsg.buttonsResponseMessage) text = quotedMsg.buttonsResponseMessage.selectedDisplayText || "";
        else if (quotedMsg.templateButtonReplyMessage) text = quotedMsg.templateButtonReplyMessage.selectedDisplayText || "";
        if (!text) return reply(`❌ Could not extract text.`);
        mediaData = { text: text };
      } else {
        return reply(`❌ Unsupported message type.`);
      }

      await Gifted.sendMessage(sender, mediaData, { quoted: mek });
      await react("✅");
    } catch (error) {
      console.error("Save Error:", error);
      await reply(`❌ Failed to save. Error: ${error.message}`);
    }
  },
);
