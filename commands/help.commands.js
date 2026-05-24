const { userService } = require('../services');
const { helpMenu } = require('../utils/format');

async function helpCommand(ctx) {
  const isAdmin = await userService.isAdmin(ctx.from.id);
  await ctx.reply(helpMenu(isAdmin), { parse_mode: 'HTML' });
}

module.exports = { helpCommand };
