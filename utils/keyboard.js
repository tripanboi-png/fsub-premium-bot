const { Markup } = require('telegraf');

/**
 * Build force-subscribe join keyboard
 * @param {Array} channels - Array of { title, invite_link, chat_id }
 * @param {string} retryData - Callback data for retry button
 */
const joinKeyboard = (channels, retryData = 'check_sub') => {
  const rows = [];

  // Build channel buttons in pairs
  for (let i = 0; i < channels.length; i += 2) {
    const row = [];
    const ch1 = channels[i];
    const ch2 = channels[i + 1];

    row.push(
      Markup.button.url(
        `${ch1.title || '📢 Join Channel'}`,
        ch1.invite_link || `https://t.me/${ch1.username}`
      )
    );

    if (ch2) {
      row.push(
        Markup.button.url(
          `${ch2.title || '📢 Join Channel'}`,
          ch2.invite_link || `https://t.me/${ch2.username}`
        )
      );
    }

    rows.push(row);
  }

  // Retry button
  rows.push([Markup.button.callback('🔄 Coba Lagi', retryData)]);

  return Markup.inlineKeyboard(rows);
};

/**
 * Keyboard with just a retry button
 */
const retryKeyboard = (data = 'check_sub') =>
  Markup.inlineKeyboard([[Markup.button.callback('🔄 Coba Lagi', data)]]);

/**
 * Keyboard for file access after join check
 */
const fileAccessKeyboard = (fileId) =>
  Markup.inlineKeyboard([
    [Markup.button.callback('📥 Ambil File', `get_file_${fileId}`)],
  ]);

/**
 * Admin confirm keyboard
 */
const confirmKeyboard = (yesData, noData = 'cancel') =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Ya', yesData),
      Markup.button.callback('❌ Batal', noData),
    ],
  ]);

/**
 * Batch file keyboard
 */
const batchKeyboard = (batchId) =>
  Markup.inlineKeyboard([
    [Markup.button.url('📦 Ambil Semua File', `https://t.me/${process.env.BOT_USERNAME}?start=batch_${batchId}`)],
  ]);

module.exports = {
  joinKeyboard,
  retryKeyboard,
  fileAccessKeyboard,
  confirmKeyboard,
  batchKeyboard,
};
