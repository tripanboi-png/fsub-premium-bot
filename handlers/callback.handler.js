const { fsubService, fileService } = require('../services');
const { successJoin, fileLocked, blockquote } = require('../utils/format');
const { joinKeyboard } = require('../utils/keyboard');
const logger = require('../utils/logger');

/**
 * Handle all callback queries (inline button presses)
 */
async function callbackHandler(ctx) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from.id;
  const firstName = ctx.from.first_name || 'User';

  if (!data) return ctx.answerCbQuery();

  // ── Check subscription (retry button) ────────────────────────────
  if (data === 'check_sub') {
    return handleCheckSub(ctx, userId, firstName, null, null);
  }

  // ── Check subscription then deliver file ────────────────────────
  if (data.startsWith('fsub_then_file_')) {
    const token = data.replace('fsub_then_file_', '');
    return handleCheckSub(ctx, userId, firstName, 'file', token);
  }

  // ── Check subscription then deliver batch ────────────────────────
  if (data.startsWith('fsub_then_batch_')) {
    const token = data.replace('fsub_then_batch_', '');
    return handleCheckSub(ctx, userId, firstName, 'batch', token);
  }

  // ── Cancel / close ───────────────────────────────────────────────
  if (data === 'cancel') {
    await ctx.answerCbQuery('Dibatalkan');
    return ctx.deleteMessage().catch(() => {});
  }

  await ctx.answerCbQuery();
}

async function handleCheckSub(ctx, userId, firstName, afterType, afterToken) {
  await ctx.answerCbQuery('⏳ Memeriksa keanggotaan...', { cache_time: 0 });

  const { passed, missing, all } = await fsubService.checkSubscription(ctx.telegram, userId);

  if (!passed) {
    const channels = all.length ? all : missing;
    const callbackData = afterToken
      ? `fsub_then_${afterType}_${afterToken}`
      : 'check_sub';

    try {
      await ctx.editMessageText(fileLocked(firstName), {
        parse_mode: 'HTML',
        ...joinKeyboard(channels, callbackData),
      });
    } catch (e) {
      await ctx.reply(fileLocked(firstName), {
        parse_mode: 'HTML',
        ...joinKeyboard(channels, callbackData),
      });
    }
    return;
  }

  // ── Passed ───────────────────────────────────────────────────────
  if (!afterType) {
    try {
      await ctx.editMessageText(successJoin(), { parse_mode: 'HTML' });
    } catch (e) {
      await ctx.reply(successJoin(), { parse_mode: 'HTML' });
    }
    return;
  }

  // Deliver content
  try {
    await ctx.editMessageText(
      blockquote('✅ <b>Verifikasi Berhasil!</b>\n\nFile sedang dikirim...'),
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    await ctx.reply(blockquote('✅ <b>Verifikasi Berhasil!</b>\n\nFile sedang dikirim...'), {
      parse_mode: 'HTML',
    });
  }

  if (afterType === 'file') {
    const file = await fileService.getFileByToken(afterToken);
    if (!file) {
      return ctx.reply(blockquote('❌ <b>File tidak ditemukan!</b>'), { parse_mode: 'HTML' });
    }
    await fileService.sendFileToUser(ctx.telegram, ctx.chat.id, file);
  } else if (afterType === 'batch') {
    const batch = await fileService.getBatchByToken(afterToken);
    if (!batch) {
      return ctx.reply(blockquote('❌ <b>Batch tidak ditemukan!</b>'), { parse_mode: 'HTML' });
    }
    await batch.updateOne({ $inc: { access_count: 1 } });
    for (const f of batch.files) {
      try {
        await fileService.sendFileToUser(ctx.telegram, ctx.chat.id, f);
        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        logger.warn(`batch callback send: ${e.message}`);
      }
    }
  }
}

module.exports = { callbackHandler };
