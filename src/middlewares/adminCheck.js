const config = require('../config/config');

// Middleware для перевірки чи користувач є адміном
function isAdmin(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  return config.allowedIds.includes(userId);
}

// Middleware для перевірки адміністратора перед виконанням дії
async function checkAdmin(ctx, next) {
  if (!isAdmin(ctx)) {
    await ctx.answerCbQuery('❌ У вас немає прав для виконання цієї дії', { show_alert: true });
    return;
  }
  return next();
}

module.exports = { isAdmin, checkAdmin };
