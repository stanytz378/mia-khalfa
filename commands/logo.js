/**
 *  MIA KHALIFA - WhatsApp Bot
 *  Copyright (c) 2026 STANY TZ
 * 
 *  GitHub: https://github.com/Stanytz378
 *  YouTube: https://youtube.com/@STANYTZ
 *  WhatsApp Channel: https://whatsapp.com/channel/0029Vb7fzu4EwEjmsD4Tzs1p
 */

const { gmd, gmdBuffer } = require("../stanytz");
const axios = require("axios");

const logoEndpoints = [
  {
    pattern: "glossysilver",
    aliases: ["glossy", "silverlogo"],
    description: "Glossy Silver STANY TZ logo",
    endpoint: "glossysilver",
  },
  {
    pattern: "angelWing",
    aliases: ["angelWing"],
    description: "Angel Wing STANY TZ logo",
    endpoint: "angelWing",
  },
  {
    pattern: "facebookTypo",
    aliases: ["facebookTypo"],
    description: "Facebook Typo STANY TZ logo",
    endpoint: "facebookTypo",
  },
  {
    pattern: "hollywoodStar",
    aliases: ["hollywoodStar"],
    description: "Hollywood Star STANY TZ logo",
    endpoint: "hollywoodStar",
  },
  {
    pattern: "blueNeonLogo",
    aliases: ["blueNeonLogo", "blueneon"],
    description: "Blue Neon STANY TZ logo",
    endpoint: "blueNeonLogo",
  },
  {
    pattern: "fireworks",
    aliases: ["fireworks"],
    description: "Fireworks STANY TZ logo",
    endpoint: "fireworks",
  },
  {
    pattern: "fpsGamingLogo",
    aliases: ["fpsGamingLogo"],
    description: "FPS Gaming STANY TZ logo",
    endpoint: "fpsGamingLogo",
  },
  {
    pattern: "assassinLogo",
    aliases: ["assassinLogo"],
    description: "Assassin STANY TZ logo",
    endpoint: "assassinLogo",
  },
  {
    pattern: "footballLogo",
    aliases: ["footballLogo", "ball"],
    description: "Football STANY TZ logo",
    endpoint: "footballLogo",
  },
  {
    pattern: "neonDevilWings",
    aliases: ["neonDevilWings", "neon"],
    description: "Neon Devil Wings STANY TZ logo",
    endpoint: "neonDevilWings",
  },
  {
    pattern: "mascotShield",
    aliases: ["mascotShield", "mascot"],
    description: "Mascot Shield STANY TZ logo",
    endpoint: "mascotShield",
  },
  {
    pattern: "writetext",
    aliases: ["textwrite", "baby", "writtentext"],
    description: "Write Text STANY TZ logo",
    endpoint: "writetext",
  },
  {
    pattern: "blackpinklogo",
    aliases: ["bplogo", "pinkblack"],
    description: "Black Pink STANY TZ logo",
    endpoint: "blackpinklogo",
  },
  {
    pattern: "glitchtext",
    aliases: ["glitch", "textglitch"],
    description: "Glitch Text STANY TZ logo",
    endpoint: "glitchtext",
  },
  {
    pattern: "advancedglow",
    aliases: ["advglow", "glowadvanced"],
    description: "Advanced Glow STANY TZ logo",
    endpoint: "advancedglow",
  },
  {
    pattern: "typographytext",
    aliases: ["typography", "typo"],
    description: "Typography Text STANY TZ logo",
    endpoint: "typographytext",
  },
  {
    pattern: "pixelglitch",
    aliases: ["pixelg", "glitchpixel"],
    description: "Pixel Glitch STANY TZ logo",
    endpoint: "pixelglitch",
  },
  {
    pattern: "neonglitch",
    aliases: ["neong", "glitchneon"],
    description: "Neon Glitch STANY TZ logo",
    endpoint: "neonglitch",
  },
  {
    pattern: "nigerianflag",
    aliases: ["ngflag", "nigeria"],
    description: "Nigerian Flag STANY TZ logo",
    endpoint: "nigerianflag",
  },
  {
    pattern: "americanflag",
    aliases: ["usflag", "usaflag", "america"],
    description: "American Flag STANY TZ logo",
    endpoint: "americanflag",
  },
  {
    pattern: "deletingtext",
    aliases: ["deltext", "textdelete"],
    description: "Deleting Text STANY TZ logo",
    endpoint: "deletingtext",
  },
  {
    pattern: "blackpinkstyle",
    aliases: ["bpstyle", "pinkblackstyle"],
    description: "Blackpink Style STANY TZ logo",
    endpoint: "blackpinkstyle",
  },
  {
    pattern: "glowingtext",
    aliases: ["glowtxt", "textglow"],
    description: "Glowing Text STANY TZ logo",
    endpoint: "glowingtext",
  },
  {
    pattern: "underwater",
    aliases: ["underw", "waterlogo"],
    description: "Under Water STANY TZ logo",
    endpoint: "underwater",
  },
  {
    pattern: "logomaker",
    aliases: ["makelogo", "logomake"],
    description: "STANY TZ Logo Maker",
    endpoint: "logomaker",
  },
  {
    pattern: "cartoonstyle",
    aliases: ["cartoon", "toonlogo"],
    description: "Cartoon Style STANY TZ logo",
    endpoint: "cartoonstyle",
  },
  {
    pattern: "papercut",
    aliases: ["cutpaper", "papercutlogo"],
    description: "Paper Cut STANY TZ logo",
    endpoint: "papercut",
  },
  {
    pattern: "effectclouds",
    aliases: ["cloudeffect", "clouds"],
    description: "Effect Clouds STANY TZ logo",
    endpoint: "effectclouds",
  },
  {
    pattern: "gradienttext",
    aliases: ["gradient", "textgradient"],
    description: "Gradient Text STANY TZ logo",
    endpoint: "gradienttext",
  },
  {
    pattern: "summerbeach",
    aliases: ["beachsummer", "beach"],
    description: "Summer Beach STANY TZ logo",
    endpoint: "summerbeach",
  },
  {
    pattern: "sandsummer",
    aliases: ["summersand", "sand", "sandlogo"],
    description: "Sand Summer STANY TZ logo",
    endpoint: "sandsummer",
  },
  {
    pattern: "luxurygold",
    aliases: ["goldluxury", "luxgold"],
    description: "Luxury Gold STANY TZ logo",
    endpoint: "luxurygold",
  },
  {
    pattern: "galaxy",
    aliases: ["galaxylogo", "space"],
    description: "Galaxy STANY TZ logo",
    endpoint: "galaxy",
  },
  {
    pattern: "logo1917",
    aliases: ["1917", "1917logo"],
    description: "1917 Style STANY TZ logo",
    endpoint: "1917",
  },
  {
    pattern: "makingneon",
    aliases: ["neonmake", "neonlogo"],
    description: "Making Neon STANY TZ logo",
    endpoint: "makingneon",
  },
  {
    pattern: "texteffect",
    aliases: ["effecttext", "fxtext"],
    description: "Text Effect STANY TZ logo",
    endpoint: "texteffect",
  },
  {
    pattern: "galaxystyle",
    aliases: ["stylegalaxy", "galstyle"],
    description: "Galaxy Style STANY TZ logo",
    endpoint: "galaxystyle",
  },
  {
    pattern: "lighteffect",
    aliases: ["effectlight", "lightlogo"],
    description: "Light Effect STANY TZ logo",
    endpoint: "lighteffect",
  },
];

async function createLogoCommand(config) {
  gmd(
    {
      pattern: config.pattern,
      aliases: config.aliases,
      category: "logo",
      react: "🎨",
      description: `Create ${config.description}`,
    },
    async (from, Gifted, conText) => {
      const {
        q,
        mek,
        reply,
        react,
        GiftedTechApi,
        GiftedApiKey,
        pushname,
        botCaption,
      } = conText;

      if (!q) {
        await react("❌");
        return reply(
          `Please provide text for the logo.\n\nUsage: .${config.pattern} <text>\nExample: .${config.pattern} ${pushname || "STANY TZ"}`,
        );
      }

      try {
        await react("⏳");

        const apiUrl = `${GiftedTechApi}/api/ephoto360/${config.endpoint}?apikey=${GiftedApiKey}&text=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, { timeout: 60000 });

        if (!res.data || !res.data.success || !res.data.result?.image_url) {
          await react("❌");
          return reply("Failed to generate logo. Please try again.");
        }

        const imageUrl = res.data.result.image_url;
        const imageBuffer = await gmdBuffer(imageUrl);

        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
          await react("❌");
          return reply("Failed to download the generated logo.");
        }

        await Gifted.sendMessage(
          from,
          {
            image: imageBuffer,
            caption: `✨ *${config.description}*\n\n📝 *Text:* ${q}\n\n> ${botCaption}`,
          },
          { quoted: mek },
        );

        await react("✅");
      } catch (e) {
        console.error(`Error in ${config.pattern} command:`, e.message);
        await react("❌");
        await reply("Failed to generate logo. Please try again later.");
      }
    },
  );
}

logoEndpoints.forEach((config) => createLogoCommand(config));

gmd(
  {
    pattern: "logolist",
    aliases: ["logos", "logo", "logohelp", "logomenu"],
    category: "logo",
    react: "📜",
    description: "Show all available logo commands",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, botCaption, botName, botPrefix } = conText;

    const logoList = logoEndpoints
      .map((l, i) => `${i + 1}. *.${l.pattern}* - ${l.description}`)
      .join("\n");

    await reply(
      `🎨 *${botName} LOGO MAKER*\n\n${logoList}\n\n📝 *Usage:* ${botPrefix}commandname <your text>\n📌 *Example:* ${botPrefix}glossysilver STANY TZ\n\n> ${botCaption}`,
    );
    await react("✅");
  },
);
