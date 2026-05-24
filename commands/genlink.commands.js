const { fileService } = require('../services');
const { blockquote } = require('../utils/format');
const config = require('../config');

// Track genlink sessions: adminId -> true
const genlinkSessions = new Map();

/**
 * /genlink - Generate protected link for next file
 */
async function genlinkCommand(ctx) {
  const userId = ctx.from.id;
  genlinkSessions.set(userId, true);

  await ctx.reply(
    blockquote(
      `🔗 <b>Mode GenLink Aktif!</b>\n\n` +
      `Kirim satu file, dan bot akan menghasilkan protected link otomatis.\n\n` +
      `Ketik /cancel untuk membatalkan.`
    ),
    { parse_mode: 'HTML' }
  );
}

/**
 * Middleware: intercept next file and generate link
 */
async function genlinkFileInterceptor(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId || !genlinkSessions.has(userId)) return next();

  const msg = ctx.message;
  const fileTypes = ['document', 'video', 'audio', 'photo', 'voice', 'animation'];
  const hasFile = fileTypes.some((t) => msg?.[t]) || msg?.photo;

  if (!hasFile) return next();

  genlinkSessions.delete(userId);

  const file = await fileService.storeFile(ctx.telegram, msg, userId);
  if (!file) return ctx.reply(blockquote('❌ Gagal menyimpan file.'), { parse_mode: 'HTML' });

  const link = `https://t.me/${config.BOT_USERNAME}?start=file_${file.link_token}`;

  await ctx.reply(
    blockquote(
      `✅ <b>Protected Link Dibuat!</b>\n\n` +
      `📁 <b>File:</b> <code>${file.file_name}</code>\n` +
      `🔗 <b>Link:</b>\n<code>${link}</code>\n\n` +
      `🔒 User wajib join semua channel untuk mengakses.`
    ),
    { parse_mode: 'HTML' }
  );
}

module.exports = { genlinkCommand, genlinkFileInterceptor, genlinkSessions };
