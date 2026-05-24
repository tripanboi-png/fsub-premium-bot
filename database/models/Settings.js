const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', SettingsSchema);

// Helper methods
Settings.get = async (key, defaultValue = null) => {
  const doc = await Settings.findOne({ key });
  return doc ? doc.value : defaultValue;
};

Settings.set = async (key, value) => {
  return Settings.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
};

module.exports = Settings;
