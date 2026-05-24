const Settings = require('../database/models/Settings');
const { blockquote } = require('../utils/format');
const { setMsgState } = require('./admin.commands');
const { userService } = require('../services');

/**
 * Callback: setmsg_welcome / setmsg_fsub
 */
async function setMsgCallbackHandler(ctx) {
  const data = ctx.callbackQuery?.data;
  const userId = ctx.from.id;

  if (data === 'setmsg_welcome') {
    setMsgState.set(userId, 'waiting_welcome');
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      blockquote('✏️ <b>Kirim pesan welcome baru:</b>\n\nGunakan {name} untuk menyisipkan nama user.'),
      { parse_mode: 'HTML' }
    );
  } else if (data === 'setmsg_fsub') {
    setMsgState.set(userId, 'waiting_fsub');
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      blockquote('✏️ <b>Kirim pesan wajib-join baru:</b>\n\nGunakan {name} untuk nama user.'),
      { parse_mode: 'HTML' }
    );
  }
}

/**
 * Text middleware: capture setmsg input
 */
async function setMsgTextHandler(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId) return next();

  const state = setMsgState.get(userId);
  if (!state) return next();

  const isAdmin = await userService.isAdmin(userId);
  if (!isAdmin) return next();

  const text = ctx.message?.text;
  if (!text) return next();

  setMsgState.delete(userId);

  if (state === 'waiting_welcome') {
    await Settings.set('welcome_msg', text);
    await ctx.reply(blockquote('✅ <b>Pesan welcome berhasil diperbarui!</b>'), { parse_mode: 'HTML' });
  } else if (state === 'waiting_fsub') {
    await Settings.set('fsub_msg', text);
    await ctx.reply(blockquote('✅ <b>Pesan wajib-join berhasil diperbarui!</b>'), { parse_mode: 'HTML' });
  }
}

module.exports = { setMsgCallbackHandler, setMsgTextHandler };
