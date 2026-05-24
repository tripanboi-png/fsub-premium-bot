const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema(
  {
    user_id: { type: Number, required: true, unique: true, index: true },
    username: { type: String, default: null },
    first_name: { type: String, default: '' },
    added_by: { type: Number, default: null },
    level: { type: Number, default: 1 }, // 1 = admin, 2 = owner
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', AdminSchema);
