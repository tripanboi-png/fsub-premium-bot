const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('../config');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(config.MONGO_URI, options);
    isConnected = true;
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected, reconnecting...');
    isConnected = false;
    setTimeout(connectDB, 5000);
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB error: ${err.message}`);
  });
}

module.exports = { connectDB };
