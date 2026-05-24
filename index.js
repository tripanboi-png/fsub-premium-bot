require('dotenv').config();

const { Telegraf } = require('telegraf');
const express = require('express');
const config = require('./config');
const { connectDB } = require('./database/connection');
const logger = require('./utils/logger');

// ── Middleware ────────────────────────────────────────────────────
const { trackUser, requireAdmin, antiSpam } = require('./middleware/auth');

// ── Handlers ─────────────────────────────────────────────────────
const { startHandler } = require('./handlers/start.handler');
const { callbackHandler } = require('./handlers/callback.handler');
const { fileHandler } = require('./handlers/file.handler');

// ── Commands ─────────────────────────────────────────────────────
const { helpCommand } = require('./commands/help.commands');
const {
  usersCommand, broadcastCommand, addAdminCommand, delAdminCommand,
  getAdminCommand, infoCommand, pingCommand, uptimeCommand,
  addButtonCommand, delButtonCommand, getButtonCommand,
  addKontenCommand, delKontenCommand, getKontenCommand,
  limitButtonCommand, limitKontenCommand, protectCommand,
  setDbCommand, getDbCommand, setMsgCommand,
} = require('./commands/admin.commands');

const {
  batchCommand, doneCommand, cancelBatchCommand, batchFileCollector,
} = require('./commands/batch.commands');

const { genlinkCommand, genlinkFileInterceptor } = require('./commands/genlink.commands');
const { setMsgCallbackHandler, setMsgTextHandler } = require('./commands/setmsg.handler');

// ── Init Bot ─────────────────────────────────────────────────────
const bot = new Telegraf(config.BOT_TOKEN);

// ── Global Middleware ─────────────────────────────────────────────
bot.use(antiSpam(1500));
bot.use(trackUser);

// ── Commands: Public ─────────────────────────────────────────────
bot.command('start', startHandler);
bot.command('help', helpCommand);
bot.command('ping', pingCommand);

// ── Commands: Admin ──────────────────────────────────────────────
bot.command('users',       requireAdmin, usersCommand);
bot.command('broadcast',   requireAdmin, broadcastCommand);
bot.command('addadmin',    requireAdmin, addAdminCommand);
bot.command('deladmin',    requireAdmin, delAdminCommand);
bot.command('getadmin',    requireAdmin, getAdminCommand);
bot.command('info',        requireAdmin, infoCommand);
bot.command('uptime',      requireAdmin, uptimeCommand);
bot.command('addbutton',   requireAdmin, addButtonCommand);
bot.command('delbutton',   requireAdmin, delButtonCommand);
bot.command('getbutton',   requireAdmin, getButtonCommand);
bot.command('addkonten',   requireAdmin, addKontenCommand);
bot.command('delkonten',   requireAdmin, delKontenCommand);
bot.command('getkonten',   requireAdmin, getKontenCommand);
bot.command('limitbutton', requireAdmin, limitButtonCommand);
bot.command('limitkonten', requireAdmin, limitKontenCommand);
bot.command('protect',     requireAdmin, protectCommand);
bot.command('setdb',       requireAdmin, setDbCommand);
bot.command('getdb',       requireAdmin, getDbCommand);
bot.command('setmsg',      requireAdmin, setMsgCommand);
bot.command('batch',       requireAdmin, batchCommand);
bot.command('done',        requireAdmin, doneCommand);
bot.command('cancel_batch',requireAdmin, cancelBatchCommand);
bot.command('genlink',     requireAdmin, genlinkCommand);

// ── Callback Query ────────────────────────────────────────────────
bot.on('callback_query', async (ctx, next) => {
  const data = ctx.callbackQuery?.data;
  // Route setmsg callbacks
  if (data?.startsWith('setmsg_')) {
    return setMsgCallbackHandler(ctx);
  }
  return callbackHandler(ctx);
});

// ── Text/Message Middleware Chain ─────────────────────────────────
bot.on('message', async (ctx, next) => {
  // 1. setmsg text capture (admin only)
  await setMsgTextHandler(ctx, async () => {
    // 2. genlink interceptor (admin only)
    await genlinkFileInterceptor(ctx, async () => {
      // 3. batch file collector (admin only)
      await batchFileCollector(ctx, async () => {
        // 4. auto-protect uploaded files from admin
        await fileHandler(ctx);
      });
    });
  });
});

// ── Error Handler ─────────────────────────────────────────────────
bot.catch((err, ctx) => {
  logger.error(`Bot error for update ${ctx?.update?.update_id}: ${err.message}`);
  logger.error(err.stack);
  try {
    ctx.reply('⚠️ Terjadi kesalahan. Silakan coba lagi.').catch(() => {});
  } catch (e) {}
});

// ── Express Health Check ──────────────────────────────────────────
const app = express();
app.get('/', (req, res) => res.json({ status: 'ok', bot: config.BOT_NAME }));
app.get('/health', (req, res) => res.json({ status: 'healthy', uptime: process.uptime() }));

// ── Bootstrap ─────────────────────────────────────────────────────
async function main() {
  logger.info('🚀 Starting bot...');
  await connectDB();

  // Start Express server
  app.listen(config.PORT, () => {
    logger.info(`🌐 Health check running on port ${config.PORT}`);
  });

  // Launch bot
  await bot.launch({
    dropPendingUpdates: true,
  });

  logger.info(`✅ Bot @${config.BOT_USERNAME} is running!`);

  // Graceful shutdown
  process.once('SIGINT', () => {
    logger.info('SIGINT received — shutting down...');
    bot.stop('SIGINT');
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down...');
    bot.stop('SIGTERM');
    process.exit(0);
  });
}

main().catch((err) => {
  logger.error(`Fatal startup error: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});
