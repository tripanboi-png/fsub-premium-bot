const { userService } = require('../services');
const { blockquote, infoMsg } = require('../utils/format');
const { getUptime } = require('../utils/uptime');
const User = require('../database/models/User');
const Channel = require('../database/models/Channel');
const File = require('../database/models/File');
const Settings = require('../database/models/Settings');
const logger = require('../utils/logger');

// ── /users ────────────────────────────────────────────────────────
async function usersCommand(ctx) {
  const count = await userService.getUserCount();
  await ctx.reply(
    blockquote(`👥 <b>DATA PENGGUNA BOT</b>\n\nTotal Pengguna: <code>${count}</code> orang`),
    { parse_mode: 'HTML' }
  );
}

// ── /broadcast ────────────────────────────────────────────────────
async function broadcastCommand(ctx) {
  const replyMsg = ctx.message?.reply_to_message;
  if (!replyMsg) {
    return ctx.reply(
      blockquote('📢 <b>Cara Broadcast:</b>\n\nBalas sebuah pesan lalu ketik /broadcast'),
      { parse_mode: 'HTML' }
    );
  }

  await ctx.reply(blockquote('📡 <b>Memulai broadcast...</b>'), { parse_mode: 'HTML' });

  let sent = 0, failed = 0;
  const batchSize = 100;
  let page = 0;
  let users;

  do {
    users = await userService.getAllUsers(page, batchSize);
    for (const u of users) {
      try {
        await ctx.telegram.forwardMessage(u.user_id, ctx.chat.id, replyMsg.message_id);
        sent++;
        await new Promise((r) => setTimeout(r, 50)); // rate limit
      } catch (e) {
        failed++;
        if (e.message.includes('blocked') || e.message.includes('deactivated')) {
          await User.updateOne({ user_id: u.user_id }, { is_banned: true });
        }
      }
    }
    page++;
  } while (users.length === batchSize);

  await ctx.reply(
    blockquote(`📊 <b>Broadcast Selesai!</b>\n\n✅ Terkirim: <code>${sent}</code>\n❌ Gagal: <code>${failed}</code>`),
    { parse_mode: 'HTML' }
  );
}

// ── /addadmin ─────────────────────────────────────────────────────
async function addAdminCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const targetId = parseInt(args[1]);

  if (!targetId || isNaN(targetId)) {
    return ctx.reply(blockquote('❌ Gunakan: /addadmin [user_id]'), { parse_mode: 'HTML' });
  }

  try {
    await userService.addAdmin(targetId, {}, ctx.from.id);
    await ctx.reply(
      blockquote(`✅ <b>Admin Ditambahkan!</b>\n\nUser ID: <code>${targetId}</code>`),
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    await ctx.reply(blockquote(`❌ Gagal: ${e.message}`), { parse_mode: 'HTML' });
  }
}

// ── /deladmin ─────────────────────────────────────────────────────
async function delAdminCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const targetId = parseInt(args[1]);

  if (!targetId) return ctx.reply(blockquote('❌ Gunakan: /deladmin [user_id]'), { parse_mode: 'HTML' });

  await userService.removeAdmin(targetId);
  await ctx.reply(
    blockquote(`✅ <b>Admin Dihapus!</b>\n\nUser ID: <code>${targetId}</code>`),
    { parse_mode: 'HTML' }
  );
}

// ── /getadmin ─────────────────────────────────────────────────────
async function getAdminCommand(ctx) {
  const admins = await userService.getAdmins();
  if (!admins.length) {
    return ctx.reply(blockquote('ℹ️ Belum ada admin terdaftar.'), { parse_mode: 'HTML' });
  }

  const list = admins.map((a, i) => `${i + 1}. ${a.first_name || 'Unknown'} — <code>${a.user_id}</code>`).join('\n');
  await ctx.reply(blockquote(`🛡️ <b>DAFTAR ADMIN</b>\n\n${list}`), { parse_mode: 'HTML' });
}

// ── /info ─────────────────────────────────────────────────────────
async function infoCommand(ctx) {
  const [users, channels, files, protect] = await Promise.all([
    User.countDocuments(),
    Channel.countDocuments({ is_active: true }),
    File.countDocuments(),
    Settings.get('protect_mode', true),
  ]);

  await ctx.reply(infoMsg({ users, channels, files, protect }, getUptime()), { parse_mode: 'HTML' });
}

// ── /ping ─────────────────────────────────────────────────────────
async function pingCommand(ctx) {
  const start = Date.now();
  const msg = await ctx.reply(blockquote('🏓 Pong!'), { parse_mode: 'HTML' });
  const ms = Date.now() - start;
  await ctx.telegram.editMessageText(
    ctx.chat.id,
    msg.message_id,
    null,
    blockquote(`🏓 <b>Pong!</b>\n\nLatency: <code>${ms}ms</code>`),
    { parse_mode: 'HTML' }
  );
}

// ── /uptime ───────────────────────────────────────────────────────
async function uptimeCommand(ctx) {
  await ctx.reply(blockquote(`⏱️ <b>Bot Uptime</b>\n\n<code>${getUptime()}</code>`), { parse_mode: 'HTML' });
}

// ── /addbutton ────────────────────────────────────────────────────
async function addButtonCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const chatId = args[1];
  if (!chatId) return ctx.reply(blockquote('❌ Gunakan: /addbutton [chat_id atau @username]'), { parse_mode: 'HTML' });

  try {
    const chat = await ctx.telegram.getChat(chatId);
    let inviteLink = chat.invite_link;

    if (!inviteLink && (chat.type === 'supergroup' || chat.type === 'channel')) {
      try {
        inviteLink = await ctx.telegram.exportChatInviteLink(chatId);
      } catch (e) {}
    }

    await Channel.findOneAndUpdate(
      { chat_id: String(chat.id) },
      {
        chat_id: String(chat.id),
        title: chat.title,
        username: chat.username || null,
        invite_link: inviteLink || null,
        type: chat.type,
        is_active: true,
        added_by: ctx.from.id,
      },
      { upsert: true, new: true }
    );

    await ctx.reply(
      blockquote(`✅ <b>Channel Ditambahkan!</b>\n\nNama: <b>${chat.title}</b>\nID: <code>${chat.id}</code>`),
      { parse_mode: 'HTML' }
    );
  } catch (e) {
    await ctx.reply(blockquote(`❌ Gagal: ${e.message}\n\nPastikan bot sudah menjadi admin di channel tersebut.`), { parse_mode: 'HTML' });
  }
}

// ── /delbutton ────────────────────────────────────────────────────
async function delButtonCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const chatId = args[1];
  if (!chatId) return ctx.reply(blockquote('❌ Gunakan: /delbutton [chat_id]'), { parse_mode: 'HTML' });

  const result = await Channel.findOneAndDelete({ chat_id: String(chatId) });
  if (!result) return ctx.reply(blockquote('❌ Channel tidak ditemukan.'), { parse_mode: 'HTML' });

  await ctx.reply(blockquote(`✅ Channel <code>${chatId}</code> telah dihapus.`), { parse_mode: 'HTML' });
}

// ── /getbutton ────────────────────────────────────────────────────
async function getButtonCommand(ctx) {
  const channels = await Channel.find({ is_active: true });
  if (!channels.length) {
    return ctx.reply(blockquote('ℹ️ Belum ada channel force-subscribe.'), { parse_mode: 'HTML' });
  }

  const list = channels
    .map((c, i) => `${i + 1}. <b>${c.title}</b> — <code>${c.chat_id}</code>`)
    .join('\n');

  await ctx.reply(blockquote(`📢 <b>CHANNEL FORCE-SUBSCRIBE</b>\n\n${list}\n\nTotal: <b>${channels.length}</b> channel`), {
    parse_mode: 'HTML',
  });
}

// ── /addkonten ────────────────────────────────────────────────────
async function addKontenCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const chatId = args[1];
  if (!chatId) return ctx.reply(blockquote('❌ Gunakan: /addkonten [chat_id]'), { parse_mode: 'HTML' });

  const kontenList = await Settings.get('konten_channels', []);
  if (!kontenList.includes(String(chatId))) {
    kontenList.push(String(chatId));
    await Settings.set('konten_channels', kontenList);
  }

  await ctx.reply(blockquote(`✅ Channel konten <code>${chatId}</code> ditambahkan.`), { parse_mode: 'HTML' });
}

// ── /delkonten ────────────────────────────────────────────────────
async function delKontenCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const chatId = args[1];
  if (!chatId) return ctx.reply(blockquote('❌ Gunakan: /delkonten [chat_id]'), { parse_mode: 'HTML' });

  let kontenList = await Settings.get('konten_channels', []);
  kontenList = kontenList.filter((id) => id !== String(chatId));
  await Settings.set('konten_channels', kontenList);

  await ctx.reply(blockquote(`✅ Channel konten <code>${chatId}</code> dihapus.`), { parse_mode: 'HTML' });
}

// ── /getkonten ────────────────────────────────────────────────────
async function getKontenCommand(ctx) {
  const kontenList = await Settings.get('konten_channels', []);
  if (!kontenList.length) return ctx.reply(blockquote('ℹ️ Belum ada channel konten.'), { parse_mode: 'HTML' });

  const list = kontenList.map((id, i) => `${i + 1}. <code>${id}</code>`).join('\n');
  await ctx.reply(blockquote(`📁 <b>CHANNEL KONTEN</b>\n\n${list}`), { parse_mode: 'HTML' });
}

// ── /limitbutton ─────────────────────────────────────────────────
async function limitButtonCommand(ctx) {
  const count = await Channel.countDocuments({ is_active: true });
  await ctx.reply(blockquote(`📊 Channel Force-Subscribe aktif: <b>${count}</b>`), { parse_mode: 'HTML' });
}

// ── /limitkonten ─────────────────────────────────────────────────
async function limitKontenCommand(ctx) {
  const kontenList = await Settings.get('konten_channels', []);
  await ctx.reply(blockquote(`📊 Channel konten aktif: <b>${kontenList.length}</b>`), { parse_mode: 'HTML' });
}

// ── /protect ─────────────────────────────────────────────────────
async function protectCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const val = args[1]?.toLowerCase();

  if (!['true', 'false'].includes(val)) {
    return ctx.reply(blockquote('❌ Gunakan: /protect true  atau  /protect false'), { parse_mode: 'HTML' });
  }

  const mode = val === 'true';
  await Settings.set('protect_mode', mode);
  await ctx.reply(
    blockquote(`🛡️ <b>Protect Mode</b>\n\nStatus: <b>${mode ? 'ON ✅' : 'OFF ❌'}</b>`),
    { parse_mode: 'HTML' }
  );
}

// ── /setdb ────────────────────────────────────────────────────────
async function setDbCommand(ctx) {
  const args = ctx.message.text.split(' ');
  const chatId = args[1];
  if (!chatId) return ctx.reply(blockquote('❌ Gunakan: /setdb [chat_id]'), { parse_mode: 'HTML' });

  await Settings.set('db_channel', String(chatId));
  await ctx.reply(blockquote(`✅ Database channel diset ke: <code>${chatId}</code>`), { parse_mode: 'HTML' });
}

// ── /getdb ────────────────────────────────────────────────────────
async function getDbCommand(ctx) {
  const dbChannel = await Settings.get('db_channel');
  const msg = dbChannel
    ? `✅ Database channel: <code>${dbChannel}</code>`
    : `❌ Database channel belum diatur. Gunakan /setdb [chat_id]`;
  await ctx.reply(blockquote(msg), { parse_mode: 'HTML' });
}

// ── /setmsg ───────────────────────────────────────────────────────
const setMsgState = new Map(); // userId -> 'waiting_welcome' | 'waiting_fsub'

async function setMsgCommand(ctx) {
  const { Markup } = require('telegraf');
  await ctx.reply(
    blockquote('⚙️ <b>Atur Pesan Bot</b>\n\nPilih pesan yang ingin diubah:'),
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('👋 Pesan Welcome', 'setmsg_welcome')],
        [Markup.button.callback('🔒 Pesan Wajib Join', 'setmsg_fsub')],
        [Markup.button.callback('❌ Batal', 'cancel')],
      ]),
    }
  );
}

module.exports = {
  usersCommand,
  broadcastCommand,
  addAdminCommand,
  delAdminCommand,
  getAdminCommand,
  infoCommand,
  pingCommand,
  uptimeCommand,
  addButtonCommand,
  delButtonCommand,
  getButtonCommand,
  addKontenCommand,
  delKontenCommand,
  getKontenCommand,
  limitButtonCommand,
  limitKontenCommand,
  protectCommand,
  setDbCommand,
  getDbCommand,
  setMsgCommand,
  setMsgState,
};
