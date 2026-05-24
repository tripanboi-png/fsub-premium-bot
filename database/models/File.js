const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    file_id: { type: String, required: true, index: true },
    file_unique_id: { type: String, default: null },
    file_type: {
      type: String,
      enum: ['document', 'video', 'audio', 'photo', 'voice', 'animation', 'sticker'],
      default: 'document',
    },
    file_name: { type: String, default: 'file' },
    file_size: { type: Number, default: 0 },
    caption: { type: String, default: null },
    message_id: { type: Number, default: null }, // original message id in db channel
    db_channel: { type: String, default: null }, // channel where file is stored
    link_token: { type: String, unique: true, index: true }, // short token for URL
    is_protected: { type: Boolean, default: true },
    uploaded_by: { type: Number, default: null },
    access_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('File', FileSchema);
