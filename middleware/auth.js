const { userService } = require('../services');
const { blockquote } = require('../utils/format');

/**
 * Middleware: require user to be admin or owner
 */
async function requireAdmin(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const admin = await userService.isAdmin(userId);
  if (!admin) {
    return ctx.reply(
      blockquote('🚫 <b>Akses Ditolak!</b>\n\nHanya admin yang dapat menggunakan command ini.'),
      { parse_mode: 'HTML' }
    );
  }

  return next();
}

/**
 * Middleware: require user to be owner only
 */
async function requireOwner(ctx, next) {
  const userId = ctx.from?.id;
  if (!userId) return;

  if (!userService.isOwner(userId)) {
    return ctx.reply(
      blockquote('🚫 <b>Akses Ditolak!</b>\n\nHanya owner yang dapat menggunakan command ini.'),
      { parse_mode: 'HTML' }
    );
  }

  return next();
}

/**
 * Middleware: upsert user to database
 */
async function trackUser(ctx, next) {
  if (ctx.from && !ctx.from.is_bot) {
    try {
      await userService.upsertUser(ctx.from);
    } catch (e) {
      // Non-blocking
    }
  }
  return next();
}

/**
 * Middleware: anti-spam (simple cooldown)
 */
const cooldowns = new Map();

function antiSpam(ms = 2000) {
  return (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();

    const now = Date.now();
    const last = cooldowns.get(userId) || 0;

    if (now - last < ms) return; // silently ignore

    cooldowns.set(userId, now);

    // Cleanup old entries periodically
    if (cooldowns.size > 5000) {
      const cutoff = now - 60000;
      for (const [k, v] of cooldowns) {
        if (v < cutoff) cooldowns.delete(k);
      }
    }

    return next();
  };
}

module.exports = { requireAdmin, requireOwner, trackUser, antiSpam };
