const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true, unique: true, index: true },
    username: { type: String, default: null },
    first_name: { type: String, default: '' },
    last_name: { type: String, default: '' },
    is_banned: { type: Boolean, default: false },
    joined_channels: [{ type: String }], // chat_id strings of channels joined
    last_active: { type: Date, default: Date.now },
    join_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

UserSchema.virtual('full_name').get(function () {
  return [this.first_name, this.last_name].filter(Boolean).join(' ');
});

module.exports = mongoose.model('User', UserSchema);
