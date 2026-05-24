require('dotenv').config();

const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  OWNER_ID: parseInt(process.env.OWNER_ID),
  MONGO_URI: process.env.MONGO_URI,
  BOT_USERNAME: process.env.BOT_USERNAME || 'MyBot',
  BOT_NAME: process.env.BOT_NAME || 'BITCH HUB',
  PORT: parseInt(process.env.PORT) || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  NODE_ENV: process.env.NODE_ENV || 'production',
};

// Validate required config
const required = ['BOT_TOKEN', 'OWNER_ID', 'MONGO_URI'];
for (const key of required) {
  if (!config[key]) {
    console.error(`❌ Missing required env variable: ${key}`);
    process.exit(1);
  }
}

module.exports = config;
