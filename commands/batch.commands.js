const { fileService } = require('../services');
const { blockquote } = require('../utils/format');
const config = require('../config');
const logger = require('../utils/logger');

// Track batch sessions: adminId -> [file objects]
const batchSessions = new Map();

/**
 * /batch - Start collecting files for batch
 */
async function batchCommand(ctx) {
  const userId = ctx.from.id;
  batchSessions.set(userId, []);

  await ctx.reply(
    blockquote(
      `📦 <b>Mode Batch Aktif!</b>\n\n` +
      `Kirim semua file yang ingin kamu batch.\n` +
      `Setelah selesai, ketik /done untuk mengakhiri dan mendapatkan link batch.\n\n` +
      `Ketik /cancel_batch untuk membatalkan.`
    ),
    { parse_mode: 'HTML' }
  );
}

/**
 * /done - Finalize batch
 */
async function doneCommand(ctx) {
  const userId = ctx.from.id;
  const files = batchSessions.get(userId);

  if (!files) {
    return ctx.reply(blockquote('❌ Tidak ada sesi batch aktif. Mulai dengan /batch'), { parse_mode: 'HTML' });
  }

  if (!files.length) {
    return ctx.reply(blockquote('❌ Tidak ada file yang dikirim dalam sesi ini.'), { parse_mode: 'HTML' });
  }

  batchSessions.delete(userId);

  const batch = await fileService.createBatch(files, `Batch ${new Date().toLocaleDateString('id-ID')}`, userId);
  const link = `https://t.me/${config.BOT_USERNAME}?start=batch_${batch.batch_token}`;

  await ctx.reply(
    blockquote(
      `✅ <b>Batch Berhasil Dibuat!</b>\n\n` +
      `📁 Total File: <b>${files.length}</b>\n` +
      `🔗 <b>Link Batch:</b>\n<code>${link}</code>\n\n` +
      `User wajib join semua channel sebelum dapat mengakses.`
    ),
    { parse_mode: 'HTML' }
  );
}

/**
 * /cancel_batch
 */
async function cancelBatchCommand(ctx) {
  batchSessions.delete(ctx.from.id);
  await ctx.reply(blockquote('❌ Sesi batch dibatalkan.'), { parse_mode: 'HTML' });
}

/**
 * Middleware: check if admin is in batch session, collect files
 */
async function batchFileCollector(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const session = batchSessions.get(userId);
  if (!session) return next();

  const msg = ctx.message;
  const fileTypes = ['document', 'video', 'audio', 'voice', 'animation'];
  const photoType = msg?.photo;

  let fileData = null;
  let fileType = null;

  for (const t of fileTypes) {
    if (msg?.[t]) {
      fileData = msg[t];
      fileType = t;
      break;
    }
  }
  if (photoType) {
    fileData = photoType[photoType.length - 1];
    fileType = 'photo';
  }

  if (!fileData) return next();

  // Store file in DB
  try {
    const file = await fileService.storeFile(ctx.telegram, msg, userId);
    if (file) {
      session.push(file);
      await ctx.reply(
        blockquote(`✅ File #${session.length} ditambahkan: <code>${file.file_name}</code>\n\nKirim file lagi atau /done untuk selesai.`),
        { parse_mode: 'HTML' }
      );
    }
  } catch (e) {
    logger.error(`batchFileCollector: ${e.message}`);
  }

  // Don't call next() - we handled the message
}

module.exports = {
  batchCommand,
  doneCommand,
  cancelBatchCommand,
  batchFileCollector,
  batchSessions,
};
