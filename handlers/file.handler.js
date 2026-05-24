const { fileService, userService, fsubService } = require('../services');
const { blockquote } = require('../utils/format');
const Settings = require('../database/models/Settings');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Handle any file/media sent by admin — auto-generate protected link
 */
async function fileHandler(ctx) {
  const userId = ctx.from.id;
  const isAdmin = await userService.isAdmin(userId);

  if (!isAdmin) {
    // Regular user sending files — check fsub, then ignore (we only protect admin-uploaded files)
    return;
  }

  // Admin uploaded a file — protect it
  const msg = ctx.message;
  const hasFile = ['document', 'video', 'audio', 'photo', 'voice', 'animation'].some(
    (t) => msg[t]
  );

  if (!hasFile) return;

  try {
    const file = await fileService.storeFile(ctx.telegram, msg, userId);
    if (!file) return;

    const botUsername = config.BOT_USERNAME;
    const link = `https://t.me/${botUsername}?start=file_${file.link_token}`;

    await ctx.reply(
      blockquote(
        `✅ <b>File Berhasil Disimpan!</b>\n\n` +
        `📁 <b>Nama:</b> <code>${file.file_name}</code>\n` +
        `📦 <b>Tipe:</b> <code>${file.file_type}</code>\n` +
        `🔗 <b>Protected Link:</b>\n<code>${link}</code>\n\n` +
        `🔒 User wajib join semua channel sebelum dapat mengakses file ini.`
      ),
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    logger.error(`fileHandler error: ${e.message}`);
    await ctx.reply(blockquote('❌ Gagal menyimpan file. Cek log.'), { parse_mode: 'HTML' });
  }
}

module.exports = { fileHandler };
