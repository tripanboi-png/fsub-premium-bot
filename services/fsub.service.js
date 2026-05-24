const Channel = require('../database/models/Channel');
const logger = require('../utils/logger');

/**
 * Check if a user is a member of ALL required channels
 * Returns { passed: bool, missing: [] }
 */
async function checkSubscription(bot, userId) {
  const channels = await Channel.find({ is_active: true });

  if (!channels.length) return { passed: true, missing: [] };

  const missing = [];

  for (const ch of channels) {
    try {
      const member = await bot.telegram.getChatMember(ch.chat_id, userId);
      const validStatuses = ['member', 'administrator', 'creator'];

      if (!validStatuses.includes(member.status)) {
        missing.push(ch);
      }
    } catch (err) {
      // If bot is not in channel or channel doesn't exist, skip silently
      logger.warn(`checkSubscription error for channel ${ch.chat_id}: ${err.message}`);
      // Optionally treat errors as "not member" for stricter enforcement:
      // missing.push(ch);
    }
  }

  return {
    passed: missing.length === 0,
    missing,
    all: channels,
  };
}

/**
 * Get all active force-sub channels
 */
async function getActiveChannels() {
  return Channel.find({ is_active: true });
}

/**
 * Add a channel to force-sub list
 */
async function addChannel(chatId, data = {}) {
  return Channel.findOneAndUpdate(
    { chat_id: String(chatId) },
    {
      chat_id: String(chatId),
      title: data.title || 'Channel',
      username: data.username || null,
      invite_link: data.invite_link || null,
      type: data.type || 'channel',
      is_active: true,
      added_by: data.added_by || null,
    },
    { upsert: true, new: true }
  );
}

/**
 * Remove a channel from force-sub list
 */
async function removeChannel(chatId) {
  return Channel.findOneAndDelete({ chat_id: String(chatId) });
}

module.exports = {
  checkSubscription,
  getActiveChannels,
  addChannel,
  removeChannel,
};
