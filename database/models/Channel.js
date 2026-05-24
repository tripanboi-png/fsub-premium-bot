const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema(
  {
    chat_id: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: 'Channel' },
    username: { type: String, default: null },
    invite_link: { type: String, default: null },
    type: { type: String, enum: ['channel', 'group', 'supergroup'], default: 'channel' },
    is_active: { type: Boolean, default: true },
    added_by: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Channel', ChannelSchema);
