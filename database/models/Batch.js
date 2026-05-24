const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema(
  {
    batch_token: { type: String, required: true, unique: true, index: true },
    files: [
      {
        file_id: String,
        file_type: String,
        file_name: String,
        caption: String,
        message_id: Number,
      },
    ],
    title: { type: String, default: 'Batch Files' },
    created_by: { type: Number, default: null },
    access_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Batch', BatchSchema);
