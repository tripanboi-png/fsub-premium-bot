const { fsubService, fileService } = require('../services');
const { welcomeForceSub, successJoin, fileLocked, blockquote } = require('../utils/format');
const { joinKeyboard, retryKeyboard } = require('../utils/keyboard');
const Settings = require('../database/models/Settings');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * /start handler — main entry point
 */
async function startHandler(ctx) {
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name || 'User';
  const args = ctx.message?.text?.split(' ')[1] || '';

  // ── Handle file/batch deep links ──────────────────────────────────
  if (args.startsWith('file_')) {
    return handleFileDeepLink(ctx, userId, firstName, args.replace('file_', ''));
  }

  if (args.startsWith('batch_')) {
    return handleBatchDeepLink(ctx, userId, firstName, args.replace('batch_', ''));
  }

  // ── Normal start ─────────────────────────────────────────────────
  const { passed, missing, all } = await fsubService.checkSubscription(ctx.telegram, userId);

  if (passed) {
    const customMsg = await Settings.get('welcome_msg');
    const msg = customMsg
      ? blockquote(customMsg.replace('{name}', firstName))
      : blockquote(
          `👋 <b>Halo ${firstName}!</b>\n\n` +
          `Selamat datang di <b>${config.BOT_NAME}</b> 🔥\n\n` +
          `Gunakan /help untuk melihat semua perintah yang tersedia.\n` +
          `Kirim file untuk membuat protected link otomatis!`
        );

    return ctx.reply(msg, { parse_mode: 'HTML' });
  }

  // User hasn't joined all channels
  const channels = all.length ? all : missing;
  const customFsubMsg = await Settings.get('fsub_msg');
  const text = customFsubMsg
    ? blockquote(customFsubMsg.replace('{name}', firstName))
    : welcomeForceSub(firstName, channels);

  return ctx.reply(text, {
    parse_mode: 'HTML',
    ...joinKeyboard(channels, `check_sub`),
  });
}

/**
 * Handle file deep link: /start file_TOKEN
 */
async function handleFileDeepLink(ctx, userId, firstName, token) {
  const { passed, missing, all } = await fsubService.checkSubscription(ctx.telegram, userId);

  if (!passed) {
    return ctx.reply(fileLocked(firstName), {
      parse_mode: 'HTML',
      ...joinKeyboard(all.length ? all : missing, `fsub_then_file_${token}`),
    });
  }

  // Deliver file
  const file = await fileService.getFileByToken(token);
  if (!file) {
    return ctx.reply(blockquote('❌ <b>File tidak ditemukan!</b>\n\nLink mungkin sudah kadaluarsa.'), {
      parse_mode: 'HTML',
    });
  }

  try {
    await ctx.reply(blockquote('✅ <b>Akses Diberikan!</b>\n\nFile sedang dikirim...'), { parse_mode: 'HTML' });
    await fileService.sendFileToUser(ctx.telegram, ctx.chat.id, file);
  } catch (e) {
    logger.error(`sendFile error: ${e.message}`);
    await ctx.reply(blockquote('❌ Gagal mengirim file. Hubungi admin.'), { parse_mode: 'HTML' });
  }
}

/**
 * Handle batch deep link: /start batch_TOKEN
 */
async function handleBatchDeepLink(ctx, userId, firstName, token) {
  const { passed, missing, all } = await fsubService.checkSubscription(ctx.telegram, userId);

  if (!passed) {
    return ctx.reply(fileLocked(firstName), {
      parse_mode: 'HTML',
      ...joinKeyboard(all.length ? all : missing, `fsub_then_batch_${token}`),
    });
  }

  const batch = await fileService.getBatchByToken(token);
  if (!batch) {
    return ctx.reply(blockquote('❌ <b>Batch tidak ditemukan!</b>'), { parse_mode: 'HTML' });
  }

  await ctx.reply(
    blockquote(`📦 <b>${batch.title}</b>\n\nMengirim <b>${batch.files.length}</b> file...`),
    { parse_mode: 'HTML' }
  );

  await batch.updateOne({ $inc: { access_count: 1 } });

  for (const f of batch.files) {
    try {
      await fileService.sendFileToUser(ctx.telegram, ctx.chat.id, f);
      await new Promise((r) => setTimeout(r, 600)); // avoid flood
    } catch (e) {
      logger.warn(`batch send error: ${e.message}`);
    }
  }
}

module.exports = { startHandler };
