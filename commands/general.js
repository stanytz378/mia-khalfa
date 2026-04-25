const { gmd, commands, normalFont, formatBytes } = require("../stanytz"),
  fs = require("fs"),
  axios = require("axios"),
  BOT_START_TIME = Date.now(),
  { totalmem: totalMemoryBytes, freemem: freeMemoryBytes } = require("os"),
  moment = require("moment-timezone"),
  more = String.fromCharCode(8206),
  readmore = more.repeat(4001),
  ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;
const { sendButtons } = require("gifted-btns");

// -------------------------------------------------------------------
// COMMAND: ping
// -------------------------------------------------------------------
gmd(
  {
    pattern: "ping",
    aliases: ["pi", "p"],
    category: "general",
    description: "Check bot response speed",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      newsletterJid,
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
      title: "Bot Speed",
      text: `⚡ Pong: ${responseTime}ms`,
      footer: `> *${botFooter}*`,
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
  },
);

// -------------------------------------------------------------------
// COMMAND: report
// -------------------------------------------------------------------
gmd(
  {
    pattern: "report",
    aliases: ["request"],
    description: "Request new features or report bugs.",
    category: "owner",
  },
  async (from, Gifted, conText) => {
    const { mek, q, sender, pushName, botPrefix, isSuperUser, reply } =
      conText;
    const reportedMessages = {};
    const developerNumber = "255787069580";
    try {
      if (!isSuperUser) return reply("*Owner Only Command*");
      if (!q)
        return reply(
          `Example: ${botPrefix}request hi dev downloader commands are not working`,
        );
      const messageId = mek.key.id;
      if (reportedMessages[messageId]) {
        return reply(
          "This report has already been forwarded to the owner. Please wait for a response.",
        );
      }
      reportedMessages[messageId] = true;
      const textt = `*| REQUEST/REPORT |*`;
      const teks1 = `\n\n*User*: @${sender.split("@")[0]}\n*Request:* ${q}`;
      Gifted.sendMessage(
        developerNumber + "@s.whatsapp.net",
        {
          text: textt + teks1,
          mentions: [sender],
        },
        {
          quoted: mek,
        },
      );
      reply(
        "Thank you for your report. It has been forwarded to the owner. Please wait for a response.",
      );
    } catch (e) {
      reply(e);
      console.log(e);
    }
  },
);

// -------------------------------------------------------------------
// COMMAND: menus
// -------------------------------------------------------------------
gmd(
  {
    pattern: "menus",
    aliases: ["mainmenu", "mainmens"],
    description: "Display bot's uptime, date, time, and other stats",
    category: "general",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
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
*🦄 Uptime :* ${normalFont(uptime)}
*🍁 Date Today:* ${normalFont(date)}
*🎗 Time Now:* ${normalFont(time)}

➮ Founder - STANY TZ
➮ User - ${normalFont(pushName)}
➮ Num - ${normalFont(ownerNumber)} 
➮ Memory - ${normalFont(ram)}

*🧑‍💻 :* ${normalFont(botName)} Is Available

╭──❰ *ALL MENU* ❱
│🏮 List
│🏮 Category
│🏮 Help
│🏮 Alive
│🏮 Uptime
│🏮 Weather
│🏮 Link
│🏮 Cpu
│🏮 Repository
╰─────────────⦁`;

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
    } catch (e) {
      console.error(e);
      reply(`${e}`);
    }
  },
);

// -------------------------------------------------------------------
// COMMAND: list
// -------------------------------------------------------------------
gmd(
  {
    pattern: "list",
    aliases: ["listmenu", "listmen"],
    description: "Show all commands and their usage",
    category: "general",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
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
╭══〘〘 *${normalFont(botName)}* 〙〙═⊷
│ ✦ *Mode* : ${normalFont(botMode)}
│ ✦ *Prefix* : [ ${normalFont(botPrefix)} ]
│ ✦ *User* : ${normalFont(pushName)}
│ ✦ *Plugins* : ${normalFont(totalCommands.toString())}
│ ✦ *Version* : ${normalFont(botVersion)}
│ ✦ *Uptime* : ${normalFont(uptime)}
│ ✦ *Time Now* : ${normalFont(time)}
│ ✦ *Date Today* : ${normalFont(date)}
│ ✦ *Time Zone* : ${normalFont(timeZone)}
│ ✦ *Server Ram* : ${normalFont(ram)}
╰═════════════════⊷${readmore}\n`;

      commands.forEach((gmd, index) => {
        if (gmd.pattern && gmd.description) {
          list += `*${index + 1} ${normalFont(gmd.pattern)}*\n  ${gmd.description}\n`;
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
    } catch (e) {
      console.error(e);
      reply(`${e}`);
    }
  },
);

// -------------------------------------------------------------------
// COMMAND: menu (BUTTON CATEGORIES)
// -------------------------------------------------------------------
gmd(
  {
    pattern: "menu",
    aliases: ["help", "men", "allmenu"],
    category: "general",
    description: "Show bot menu with category buttons",
  },
  async (from, Gifted, conText) => {
    const {
      mek, sender, pushName, botPic, botMode, botVersion,
      botName, botFooter, timeZone, botPrefix, newsletterJid, reply
    } = conText;

    try {
      // Group commands by category
      const categorized = commands.reduce((menu, gmdCmd) => {
        if (gmdCmd.pattern && !gmdCmd.dontAddCommandList) {
          if (!menu[gmdCmd.category]) menu[gmdCmd.category] = [];
          menu[gmdCmd.category].push({
            pattern: gmdCmd.pattern,
            isBody: gmdCmd.on === "body",
            description: gmdCmd.description || ""
          });
        }
        return menu;
      }, {});

      const sortedCategories = Object.keys(categorized).sort();

      if (sortedCategories.length === 0) {
        return reply("❌ No commands found.");
      }

      // Create category buttons
      const categoryButtons = sortedCategories.map(cat => ({
        id: `cat_${cat}`,
        text: cat.toUpperCase()
      }));

      // Send initial category buttons
      await sendButtons(Gifted, from, {
        title: "📂 MENU BY CATEGORY",
        text: `👋 Hello *${pushName}*!\nSelect a category to see its commands:`,
        footer: `> *${botFooter}*`,
        image: { url: botPic },
        buttons: categoryButtons
      });

      // Listen for button clicks
      const handleCategoryClick = async (event) => {
        const msg = event.messages[0];
        if (!msg?.message) return;

        const buttonReply = msg.message?.templateButtonReplyMessage;
        if (!buttonReply) return;

        const selectedId = buttonReply.selectedId;
        if (!selectedId?.startsWith("cat_")) return;

        const categoryName = selectedId.replace("cat_", "");
        const commandsList = categorized[categoryName];

        if (!commandsList || commandsList.length === 0) {
          await Gifted.sendMessage(from, { text: `❌ No commands in category *${categoryName}*.` }, { quoted: msg });
          return;
        }

        // Build command list for this category
        let commandText = `╭──❰ *${normalFont(categoryName.toUpperCase())}* ❱\n`;
        commandsList.forEach(cmd => {
          const prefix = cmd.isBody ? "" : botPrefix;
          commandText += `│ ➜ ${normalFont(prefix + cmd.pattern)}\n`;
          if (cmd.description) commandText += `│    ${normalFont(cmd.description)}\n`;
        });
        commandText += `╰─────────────⦁`;

        await Gifted.sendMessage(from, {
          image: { url: botPic },
          caption: commandText.trim(),
          contextInfo: {
            mentionedJid: [sender],
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0
            }
          }
        }, { quoted: msg });
      };

      Gifted.ev.on("messages.upsert", handleCategoryClick);
      setTimeout(() => Gifted.ev.off("messages.upsert", handleCategoryClick), 120000);

    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message}`);
    }
  },
);

// -------------------------------------------------------------------
// COMMAND: return
// -------------------------------------------------------------------
gmd(
  {
    pattern: "return",
    aliases: ["details", "det", "ret"],
    category: "owner",
    description: "Displays the full raw quoted message using Baileys structure.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      quotedMsg,
      isSuperUser,
      botName,
      botFooter,
      newsletterJid,
      newsletterUrl,
    } = conText;

    if (!isSuperUser) {
      return reply(`Owner Only Command!`);
    }

    if (!quotedMsg) {
      return reply(`Please reply to/quote a message`);
    }

    try {
      const jsonString = JSON.stringify(quotedMsg, null, 2);
      const chunks = jsonString.match(/[\s\S]{1,100000}/g) || [];

      for (const chunk of chunks) {
        const formattedMessage = `\`\`\`\n${chunk}\n\`\`\``;

        await sendButtons(Gifted, from, {
          title: "",
          text: formattedMessage,
          footer: `> *${botFooter}*`,
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "Copy",
                copy_code: formattedMessage,
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "WaChannel",
                url: newsletterUrl,
              }),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error processing quoted message:", error);
      await reply(`❌ An error occurred while processing the message.`);
    }
  },
);

// -------------------------------------------------------------------
// COMMAND: uptime
// -------------------------------------------------------------------
gmd(
  {
    pattern: "uptime",
    aliases: ["up"],
    category: "general",
    description: "Check bot uptime status.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      newsletterJid,
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
      text: `⏱️ Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s`,
      footer: `> *${botFooter}*`,
      buttons: [
        { id: `${botPrefix}ping`, text: "⚡ Ping" },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "WaChannel",
            url: newsletterUrl,
          }),
        },
      ],
    });
  },
);

// -------------------------------------------------------------------
// COMMAND: repo
// -------------------------------------------------------------------
gmd(
  {
    pattern: "repo",
    aliases: ["sc", "rep", "script"],
    category: "general",
    description: "Fetch bot script repository.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
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
      full_name,
      name,
      forks_count,
      stargazers_count,
      created_at,
      updated_at,
      owner,
    } = repoData;
    const messageText = `Hello *_${pushName}_,*\nThis is *${botName},* A Whatsapp Bot Built by *STANY TZ*, Enhanced with Amazing Features to Make Your Whatsapp Communication and Interaction Experience Amazing\n\n*❲❒❳ Name:* ${name}\n*❲❒❳ Stars:* ${stargazers_count}\n*❲❒❳ Forks:* ${forks_count}\n*❲❒❳ Created on:* ${new Date(created_at).toLocaleDateString()}\n*❲❒❳ Last updated:* ${new Date(updated_at).toLocaleDateString()}`;

    const dateNow = Date.now();
    await sendButtons(Gifted, from, {
      title: "",
      text: messageText,
      footer: `> *${botFooter}*`,
      image: { url: botPic },
      buttons: [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "Copy Link",
            copy_code: `https://github.com/${giftedRepo}`,
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Visit Repo",
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

      const templateButtonReply =
        messageData.message?.templateButtonReplyMessage;
      if (!templateButtonReply) return;

      const selectedButtonId = templateButtonReply.selectedId;
      if (!selectedButtonId?.includes(`repo_dl_${dateNow}`)) return;

      const isFromSameChat = messageData.key?.remoteJid === from;
      if (!isFromSameChat) return;

      try {
        const zipUrl = `https://github.com/${giftedRepo}/archive/refs/heads/main.zip`;
        await Gifted.sendMessage(
          from,
          {
            document: { url: zipUrl },
            fileName: `${name}.zip`,
            mimetype: "application/zip",
          },
          { quoted: messageData },
        );
      } catch (dlErr) {
        await Gifted.sendMessage(from, { text: "Failed to download repo zip: " + dlErr.message }, { quoted: messageData });
      }

      Gifted.ev.off("messages.upsert", handleResponse);
    };

    Gifted.ev.on("messages.upsert", handleResponse);
    setTimeout(
      () => Gifted.ev.off("messages.upsert", handleResponse),
      120000,
    );
  },
);

// -------------------------------------------------------------------
// COMMAND: save
// -------------------------------------------------------------------
gmd(
  {
    pattern: "save",
    aliases: ["sv", "s", "sav", "."],
    category: "owner",
    description: "Save messages (supports images, videos, audio, stickers, and text).",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, sender, isSuperUser, getMediaBuffer } = conText;

    if (!isSuperUser) {
      return reply(`❌ Owner Only Command!`);
    }

    const quotedMsg =
      mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quotedMsg) {
      return reply(`⚠️ Please reply to/quote a message.`);
    }

    try {
      let mediaData;

      if (quotedMsg.imageMessage) {
        const buffer = await getMediaBuffer(quotedMsg.imageMessage, "image");
        mediaData = {
          image: buffer,
          caption: quotedMsg.imageMessage.caption || "",
        };
      } else if (quotedMsg.videoMessage) {
        const buffer = await getMediaBuffer(quotedMsg.videoMessage, "video");
        mediaData = {
          video: buffer,
          caption: quotedMsg.videoMessage.caption || "",
        };
      } else if (quotedMsg.audioMessage) {
        const buffer = await getMediaBuffer(quotedMsg.audioMessage, "audio");
        mediaData = {
          audio: buffer,
          mimetype: "audio/mp4",
        };
      } else if (quotedMsg.stickerMessage) {
        const buffer = await getMediaBuffer(
          quotedMsg.stickerMessage,
          "sticker",
        );
        mediaData = {
          sticker: buffer,
        };
      } else if (quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage?.message?.documentMessage) {
        const docMsg = quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage.message.documentMessage;
        const buffer = await getMediaBuffer(docMsg, "document");
        mediaData = {
          document: buffer,
          fileName: docMsg.fileName || "document",
          mimetype: docMsg.mimetype || "application/octet-stream",
        };
      } else if (
        quotedMsg.conversation ||
        quotedMsg.extendedTextMessage?.text
      ) {
        const text =
          quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        mediaData = {
          text: text,
        };
      } else if (quotedMsg.buttonsMessage || quotedMsg.templateMessage || quotedMsg.interactiveMessage || quotedMsg.listMessage || quotedMsg.buttonsResponseMessage || quotedMsg.templateButtonReplyMessage) {
        let text = "";
        if (quotedMsg.buttonsMessage) {
          text = quotedMsg.buttonsMessage.contentText || quotedMsg.buttonsMessage.text || "";
        } else if (quotedMsg.templateMessage?.hydratedTemplate) {
          text = quotedMsg.templateMessage.hydratedTemplate.hydratedContentText || "";
        } else if (quotedMsg.interactiveMessage?.body?.text) {
          text = quotedMsg.interactiveMessage.body.text;
        } else if (quotedMsg.listMessage) {
          text = quotedMsg.listMessage.description || quotedMsg.listMessage.title || "";
        } else if (quotedMsg.buttonsResponseMessage) {
          text = quotedMsg.buttonsResponseMessage.selectedDisplayText || "";
        } else if (quotedMsg.templateButtonReplyMessage) {
          text = quotedMsg.templateButtonReplyMessage.selectedDisplayText || "";
        }
        if (!text) {
          return reply(`❌ Could not extract text from the quoted message.`);
        }
        mediaData = {
          text: text,
        };
      } else {
        return reply(`❌ Unsupported message type.`);
      }

      await Gifted.sendMessage(sender, mediaData, { quoted: mek });
    } catch (error) {
      console.error("Save Error:", error);
      await reply(`❌ Failed to save the message. Error: ${error.message}`);
    }
  },
);
