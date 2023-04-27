import { Telegraf, session } from "telegraf";
import { message } from "telegraf/filters";
import config from "config";
import { code } from "telegraf/format";
import { ogg } from "./ogg.js";
import { openAi } from "./openai.js";

console.log(config.get("TEST_ENV"));

const bot = new Telegraf(config.get("TELEGRAM_TOKEN"));

bot.use(session());

let INITIAL_SESSION = {
  messages: [],
};

bot.command("new", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    "Я умный бот Вадима! Жду вашего голосового или текстового сообщения"
  );
});

bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply(
    "Я умный бот Вадима! Жду вашего голосового или текстового сообщения"
  );
});

bot.command("restart", async (ctx) => {
  INITIAL_SESSION = {
    messages: [],
  };
  // Ваш код здесь
  await ctx.reply("Bot has been restarted");
});

bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;

  try {
    await ctx.reply(code("Сообщение принял. Ждем ответ от сервера..."));

    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);

    const text = await openAi.transcription(mp3Path);

    await ctx.reply(code(`Ваш запрос: ${text}`));

    ctx.session.messages.push({ role: openAi.roles.USER, content: text });
    const res = await openAi.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openAi.roles.ASSISTANT,
      content: res.content,
    });

    await ctx.reply(res.content);
  } catch (error) {
    console.log("ERROR while voice message", error.message);
  }
});

bot.on(message("text"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;

  try {
    await ctx.reply(code("Сообщение принял. Ждем ответ от сервера..."));

    ctx.session.messages.push({
      role: openAi.roles.USER,
      content: ctx.message.text,
    });
    const res = await openAi.chat(ctx.session.messages);

    ctx.session.messages.push({
      role: openAi.roles.ASSISTANT,
      content: res.content,
    });

    await ctx.reply(res.content);
  } catch (error) {
    console.log("ERROR while text message", error.message);
  }
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
