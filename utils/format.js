/**
 * Telegram HTML Premium UI Helpers
 * All messages use blockquote-style with red border (expandable blockquote)
 */

const { config } = require('../config');

/**
 * Wrap text in Telegram expandable blockquote (red border)
 */
const blockquote = (text) => `<blockquote expandable>${text}</blockquote>`;

/**
 * Bold text
 */
const bold = (text) => `<b>${text}</b>`;

/**
 * Code text
 */
const code = (text) => `<code>${text}</code>`;

/**
 * Italic text  
 */
const italic = (text) => `<i>${text}</i>`;

/**
 * Monospace
 */
const mono = (text) => `<pre>${text}</pre>`;

/**
 * Welcome message (force sub)
 */
const welcomeForceSub = (name, channels) => {
  const channelList = channels.map((c, i) => `  ${i + 1}. ${c.title || c.chat_id}`).join('\n');
  return blockquote(
    `👋 <b>Hello ${name || 'User'}</b>\n\n` +
    `Anda harus bergabung di Channel/Grup saya\n` +
    `Terlebih dahulu untuk Melihat File yang saya Bagikan\n\n` +
    `📌 <b>Wajib Join:</b>\n${channelList}\n\n` +
    `Silakan Join Ke Channel & Group Terlebih Dahulu`
  );
};

/**
 * Success message after join
 */
const successJoin = () =>
  blockquote(
    `✅ <b>Verifikasi Berhasil!</b>\n\n` +
    `Kamu sudah bergabung di semua channel.\n` +
    `Silakan akses file atau kirim ulang link.`
  );

/**
 * File locked message
 */
const fileLocked = (name) =>
  blockquote(
    `🔒 <b>File Terkunci!</b>\n\n` +
    `${name ? `👋 Halo <b>${name}</b>,\n` : ''}` +
    `Anda belum bergabung di channel kami.\n\n` +
    `Silakan join semua channel di bawah,\n` +
    `lalu klik tombol <b>Coba Lagi</b>.`
  );

/**
 * Help menu
 */
const helpMenu = (isAdmin = false) => {
  const base = blockquote(
    `📖 <b>DAFTAR COMMAND BOT</b>\n\n` +
    `<b>👤 User Command:</b>\n` +
    `/start — Mulai bot\n` +
    `/help — Tampilkan bantuan\n` +
    `/ping — Cek status bot\n`
  );

  const admin = blockquote(
    `<b>🛡️ Admin Command:</b>\n` +
    `/users — Cek jumlah pengguna\n` +
    `/broadcast [reply] — Kirim siaran\n` +
    `/addadmin [id] — Tambah admin\n` +
    `/deladmin [id] — Hapus admin\n` +
    `/getadmin — Lihat daftar admin\n` +
    `/info — Status bot\n` +
    `/uptime — Waktu aktif bot\n\n` +
    `<b>📢 Channel/Button:</b>\n` +
    `/addbutton [id] — Tambah tombol channel\n` +
    `/delbutton [id] — Hapus tombol\n` +
    `/getbutton — Lihat tombol aktif\n\n` +
    `<b>📁 Konten:</b>\n` +
    `/addkonten [id] — Tambah channel konten\n` +
    `/delkonten [id] — Hapus channel konten\n` +
    `/getkonten — Lihat channel konten\n` +
    `/limitbutton — Cek limit button\n` +
    `/limitkonten — Cek limit konten\n\n` +
    `<b>⚙️ Pengaturan:</b>\n` +
    `/protect [true/false] — Proteksi file\n` +
    `/setdb [id] — Atur database channel\n` +
    `/getdb — Cek database channel\n` +
    `/setmsg — Atur pesan wajib join\n` +
    `/batch — Buat batch link\n` +
    `/genlink — Generate protected link`
  );

  return isAdmin ? base + '\n' + admin : base;
};

/**
 * Info message
 */
const infoMsg = (stats, uptime) =>
  blockquote(
    `ℹ️ <b>STATUS BOT</b>\n\n` +
    `🤖 Bot: <b>Online ✅</b>\n` +
    `👥 Total User: <code>${stats.users}</code>\n` +
    `📢 Channel Fsub: <code>${stats.channels}</code>\n` +
    `📁 File Tersimpan: <code>${stats.files}</code>\n` +
    `⏱️ Uptime: <code>${uptime}</code>\n` +
    `🛡️ Protect Mode: <code>${stats.protect ? 'ON' : 'OFF'}</code>`
  );

module.exports = {
  blockquote,
  bold,
  code,
  italic,
  mono,
  welcomeForceSub,
  successJoin,
  fileLocked,
  helpMenu,
  infoMsg,
};
