const ms = require("ms");
require("./logger.js");
const config = {
  token:
    "MTExMjk0NTAxNTEzMjUzNjk0Mw.GECK0d.yJYmrj5kzEENaffGpYlYKKx_Vky4eC38Yyb7d8",
  prefix: "?",
  maxAFK: ms("1m"),
  deleteTimout: ms("5s"),
};

const {
  Client,
  RichPresence,
  DiscordRPCServer,
} = require("discord.js-selfbot-v13");
const client = new Client({
  checkUpdate: true,
  syncStatus: true,
  ws: {
    properties: {
      browser: "Discord Android",
    },
  },
});
const db = require("croxydb");

let lastMessage = Date.now();
let lastInvisible = Date.now();
let invisible = db.get("afk") == "false" ? false : true || false;
let maxAFK = db.get("maxAFK") || config.maxAFK;
let afk = false;
client.login(config.token);
client.on("ready", async () => {
  console.log(client.user.username);
  invisible = (await db.get("afk")) == "false" ? false : true || false;
  maxAFK = (await db.get("maxAFK")) || config.maxAFK;
  lastMessage = Date.now();
  await syncStatus();
});
client.on("messageCreate", async (message) => {
  if (message.author.id == client.user.id) {
    const [cmd, ...args] = message.content.startsWith(config.prefix)
      ? message.content.slice(config.prefix.length).trim().split(" ")
      : ["", [""]];
    if (cmd == "help") {
      message.reply({
        content: `> Tüm komutlarım
- \`${config.prefix}stats\` -> Istatistiklerimi görüntüler.
- \`${config.prefix}sil\` -> Mesajlarımı siler (max 100).
- \`${config.prefix}afk\` -> Durumunu çevimdışı gözüktürür.
- \`${config.prefix}maxAfk\` -> Afk kalma süresini ayarlar.
- \`${config.prefix}createInvite\` -> Arkadaş daveti oluşturur.
- \`${config.prefix}setButton\` -> Duruma button ekler.
- \`${config.prefix}clearButton\` -> Durumdan button siler.
- \`${config.prefix}offlineImage\` -> Çevrimdışı durumunda resim ayarlar/siler.
- \`${config.prefix}onlineImage\` -> Çevimiçi durumda resim ayarlar/siler.
- \`${config.prefix}offlineDetails\` -> Çevrimduşı durumda açıklama ekler/siler.
- \`${config.prefix}onlineDetails\` -> Çevrimiçi durumda açıklama ekler/siler.`,
      });
    } else if (cmd == "stats") {
      message.reply({
        content: `> Istatistiğim
- \`Açık kalma sürem\` -> **${ms(client.uptime)}**
- \`Ping\` -> **${ms(client.ws.ping)}**`,
      });
    } else if (cmd == "sil") {
      let messageCount = parseInt(args[0]);
      if (isNaN(messageCount))
        return message
          .reply({
            content: `> Hatalı kullanım`,
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));

      if (messageCount > 100) messageCount = 100;
      message.channel.messages
        .fetch({ limit: messageCount })
        .then(async (x) => {
          await x
            .filter((y) => y.author.id == client.user.id && y.deletable)
            .forEach(async (msg) => await msg.delete());
          return message
            .reply({
              content: `> ${
                x.filter((y) => y.author.id == client.user.id && y.deletable)
                  .size
              } mesaj silindi`,
            })
            .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
        });
    } else if (cmd == "afk") {
      invisible = invisible ? false : true;
      db.set("afk", invisible ? true : "false");
      lastInvisible = afk ? lastMessage : Date.now();
      await syncStatus();
      message
        .reply({
          content: `${
            invisible ? "> Çevrimdışı gözüküyorsun" : "> Çevrimiçi gözüküyorsun"
          } (yenilenmesi zaman alabilir)`,
        })
        .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
    } else if (cmd == "maxAfk") {
      let a = args[0];
      if (!a || !ms(a)) a = `${config.maxAFK}`;
      db.set("maxAfk", ms(a));
      maxAFK = ms(a);
      await syncStatus();
      message
        .reply({
          content: `> ${ms(
            ms(a)
          )} olarak ayarlandı (yenilenmesi zaman alabilir)`,
        })
        .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));

      syncStatus();
    } else if (cmd == "createInvite") {
      const i = await client.user.createFriendInvite();
      message.reply({
        content: `> ${i.url} -> <t:${i.expiresTimestamp}:R> / ${i.maxUses}`,
      });
    } else if (cmd == "setButton") {
      let [name, url] = args.join(" ").split(";");
      const regex =
        /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/gm;

      if (!name || !url || !regex.test(url))
        return message
          .reply({
            content: "> Doğru kullanım: `" + config.prefix + "button isim;url`",
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));

      db.set("button", `${name} ${url}`);
      await syncStatus();
      return message
        .reply({
          content: `> Başarılı bir şekilde ayarlandı (yenilenmesi zaman alabilir)`,
        })
        .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
    } else if (cmd == "clearButton") {
      db.delete("button");
      await syncStatus();
      return message
        .reply({
          content:
            "> Başarılı bir şekilde silindi (yenilenmesi zaman alabilir)",
        })
        .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
    } else if (cmd == "offlineImage") {
      const regex = /(https?:\/\/)?(www\.)?(cdn|media)?(\.discordapp\.com)\//g;
      const img = message.attachments.first()?.url;
      if (!img) {
        db.delete("largeOfflineImage");
        await syncStatus();
        return message
          .reply({
            content:
              "> Başarılı bir şekilde silindi (yenilenmesi zaman alabilir)",
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
      } else {
        if (regex.test(img)) {
          const url = img.replace(regex, "mp:");
          db.set("largeOfflineImage", url);
          await syncStatus();
          return message
            .reply({
              content: `> Başarılı bir şekilde ayarlandı (yenilenmesi zaman alabilir)`,
            })
            .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
        }
      }
    } else if (cmd == "onlineImage") {
      const regex = /(https?:\/\/)?(www\.)?(cdn|media)?(\.discordapp\.com)\//g;
      const img = message.attachments.first()?.url;
      if (!img) {
        db.delete("largeOnlineImage");
        await syncStatus();
        return message
          .reply({
            content:
              ">Başarılı bir şekilde silindi (yenilenmesi zaman alabilir)",
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
      } else {
        if (regex.test(img)) {
          const url = img.replace(regex, "mp:");
          db.set("largeOnlineImage", url);
          await syncStatus();
          return message
            .reply({
              content: `> Başarılı bir şekilde ayarlandı (yenilenmesi zaman alabilir)`,
            })
            .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
        }
      }
    } else if (cmd == "onlineDetails") {
      if (!args[0]) {
        db.delete("onlineDetails");
        await syncStatus();
        return message
          .reply({
            content:
              "> Başarılı bir şekilde silindi (yenilenmesi zaman alabilir)",
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
      } else {
        db.set("onlineDetails", args.join(" "));
        await syncStatus();
        return message
          .reply({
            content:
              "> Başarılı bir şekilde ayarlandı (yenilenmesi zaman alabilir)",
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
      }
    } else if (cmd == "offlineDetails") {
      if (!args.join(" ")) {
        db.delete("offlineDetails");
        await syncStatus();
        return message
          .reply({
            content:
              "> Başarılı bir şekilde silindi (yenilenmesi zaman alabilir)",
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
      } else {
        db.set("offlineDetails", args.join(" "));
        await syncStatus();
        return message
          .reply({
            content:
              "> Başarılı bir şekilde ayarlandı (yenilenmesi zaman alabilir)",
          })
          .then((msg) => setTimeout(() => msg.delete(), config.deleteTimout));
      }
    } else {
      if (message.content.startsWith("> ")) return;
      if (!invisible) {
        lastMessage = Date.now();
      } else lastMessage = lastInvisible;
      if (!invisible && afk) {
        syncStatus();
      }
    }
  }
});

let request = 0;
let timeout;
async function syncStatus() {
  try {
    const presence = new RichPresence();
    if (timeout) clearTimeout(timeout);
    if (lastMessage - (Date.now() - maxAFK) > 0 && !invisible) {
      presence.setName("ONLINE");
      afk = false;
      if (db.has("largeOnlineImage"))
        presence.setAssetsLargeImage(db.get("largeOnlineImage"));
      if (db.has("onlineDetails")) presence.setDetails(db.get("onlineDetails"));
      presence.setEndTimestamp(lastMessage + maxAFK);
      timeout = setTimeout(() => {
        syncStatus();
      }, lastMessage - (Date.now() - maxAFK));
    } else {
      timeout = setTimeout(() => {
        syncStatus();
      }, maxAFK);
      presence.setName("OFFLINE");
      afk = true;
      if (db.has("largeOfflineImage"))
        presence.setAssetsLargeImage(db.get("largeOfflineImage"));

      if (db.has("offlineDetails"))
        presence.setDetails(db.get("offlineDetails"));
    }
    presence.setStartTimestamp(lastMessage);
    presence.setType("PLAYING");
    if (db.has("button")) {
      let [name, url] = db.get("button").split(" ");
      presence.setURL(url);
      presence.addButton(name, url);
    }
    if (request < 5) client.user.setActivity(presence);
    request = +1;
  } catch (error) {}
}
setInterval(() => {
  request = 0;
}, ms("20s"));
