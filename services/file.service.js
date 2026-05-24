const crypto = require('crypto');
const File = require('../database/models/File');
const Batch = require('../database/models/Batch');
const Settings = require('../database/models/Settings');
const logger = require('../utils/logger');

/**
 * Generate a short random token
 */
function generateToken(length = 10) {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Store a file and return its protected link token
 */
async function storeFile(bot, msg, uploadedBy) {
  const fileTypes = ['document', 'video', 'audio', 'photo', 'voice', 'animation'];

  let fileData = null;
  let fileType = null;

  for (const type of fileTypes) {
    if (msg[type]) {
      fileType = type;
      if (type === 'photo') {
        // Pick largest photo
        fileData = msg.photo[msg.photo.length - 1];
      } else {
        fileData = msg[type];
      }
      break;
    }
  }

  if (!fileData) return null;

  const dbChannel = await Settings.get('db_channel');
  let messageId = null;

  // Forward to DB channel if configured
  if (dbChannel) {
    try {
      const forwarded = await bot.telegram.forwardMessage(dbChannel, msg.chat.id, msg.message_id);
      messageId = forwarded.message_id;
    } catch (e) {
      logger.warn(`Could not forward to DB channel: ${e.message}`);
    }
  }

  const token = generateToken(12);
  const isProtected = await Settings.get('protect_mode', true);

  const file = await File.create({
    file_id: fileData.file_id,
    file_unique_id: fileData.file_unique_id || null,
    file_type: fileType,
    file_name: fileData.file_name || `${fileType}_${Date.now()}`,
    file_size: fileData.file_size || 0,
    caption: msg.caption || null,
    message_id: messageId,
    db_channel: dbChannel,
    link_token: token,
    is_protected: isProtected,
    uploaded_by: uploadedBy,
  });

  return file;
}

/**
 * Get file by token
 */
async function getFileByToken(token) {
  return File.findOne({ link_token: token });
}

/**
 * Create batch of files
 */
async function createBatch(files, title = 'Batch Files', createdBy = null) {
  const token = generateToken(14);

  const batch = await Batch.create({
    batch_token: token,
    files: files.map((f) => ({
      file_id: f.file_id,
      file_type: f.file_type,
      file_name: f.file_name,
      caption: f.caption,
      message_id: f.message_id,
    })),
    title,
    created_by: createdBy,
  });

  return batch;
}

/**
 * Get batch by token
 */
async function getBatchByToken(token) {
  return Batch.findOne({ batch_token: token });
}

/**
 * Send a file to user
 */
async function sendFileToUser(bot, chatId, file) {
  const opts = {};
  if (file.caption) opts.caption = file.caption;
  if (file.caption) opts.parse_mode = 'HTML';

  await file.updateOne({ $inc: { access_count: 1 } });

  switch (file.file_type) {
    case 'document':
      return bot.telegram.sendDocument(chatId, file.file_id, opts);
    case 'video':
      return bot.telegram.sendVideo(chatId, file.file_id, opts);
    case 'audio':
      return bot.telegram.sendAudio(chatId, file.file_id, opts);
    case 'photo':
      return bot.telegram.sendPhoto(chatId, file.file_id, opts);
    case 'voice':
      return bot.telegram.sendVoice(chatId, file.file_id, opts);
    case 'animation':
      return bot.telegram.sendAnimation(chatId, file.file_id, opts);
    default:
      return bot.telegram.sendDocument(chatId, file.file_id, opts);
  }
}

module.exports = {
  storeFile,
  getFileByToken,
  createBatch,
  getBatchByToken,
  sendFileToUser,
  generateToken,
};
