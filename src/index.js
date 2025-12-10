const { Telegraf } = require('telegraf');
const http = require('http');
const config = require('./config/config');
const { connectDB } = require('./database/db');
const { mainMenuKeyboard } = require('./keyboards/mainMenu');
const { checkAdmin } = require('./middlewares/adminCheck');
const {
  handleDutyList,
  handleDutyCount,
  handleAddDuty,
  handleRemoveDuty,
  handleFreeDuty,
  handleAssignDuty,
  handleSelectCount,
  handleAddDutyToUser,
  handleRemoveDutyFromUser,
  handleFreeDutyUser,
  handleAssignDutyUser
} = require('./handlers/dutyHandlers');

// Створення бота
const bot = new Telegraf(config.botToken);

// Підключення до бази даних
connectDB();

// Команда /start_duty
bot.command('start_duty', (ctx) => {
  ctx.reply(
    '👋 Вітаю! Оберіть потрібну дію:',
    mainMenuKeyboard
  );
});

// Секретна команда для адміністраторів - відправити повідомлення від імені бота
bot.command('message_duty', async (ctx) => {
  // Перевіряємо чи користувач є адміном
  const userId = ctx.from?.id;
  if (!config.allowedIds.includes(userId)) {
    return; // Ігноруємо команду від не адміністраторів
  }

  // Отримуємо текст після команди
  const message = ctx.message.text.replace('/message_duty', '').trim();
  
  if (!message) {
    await ctx.reply('❌ Використання: /message_duty <ваше повідомлення>');
    return;
  }

  try {
    // Відправляємо повідомлення в той же чат
    await ctx.reply(message);
  } catch (error) {
    console.error('Помилка при відправці повідомлення:', error);
    await ctx.reply('❌ Помилка при відправці повідомлення');
  }
});

// Обробка кнопки "Головне меню"
bot.action('main_menu', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🏠 Головне меню:',
    mainMenuKeyboard
  );
});

// Обробка натискання inline кнопок
bot.action('duty_list', checkAdmin, handleDutyList);
bot.action('duty_count', handleDutyCount); // Перегляд доступний всім
bot.action('add_duty', checkAdmin, handleAddDuty);
bot.action('remove_duty', checkAdmin, handleRemoveDuty);
bot.action('free_duty', checkAdmin, handleFreeDuty);
bot.action('assign_duty', checkAdmin, handleAssignDuty);

// Обробка вибору кількості людей
bot.action(/select_count_(\d+)/, checkAdmin, (ctx) => {
  const count = parseInt(ctx.match[1]);
  handleSelectCount(ctx, count);
});

// Обробка додавання єбашки користувачу
bot.action(/add_duty_user_(\d+)/, checkAdmin, (ctx) => {
  const userId = parseInt(ctx.match[1]);
  handleAddDutyToUser(ctx, userId);
});

// Обробка видалення єбашки користувачу
bot.action(/remove_duty_user_(\d+)/, checkAdmin, (ctx) => {
  const userId = parseInt(ctx.match[1]);
  handleRemoveDutyFromUser(ctx, userId);
});

// Обробка звільнення від єбашки
bot.action(/free_duty_user_(\d+)/, checkAdmin, (ctx) => {
  const userId = parseInt(ctx.match[1]);
  handleFreeDutyUser(ctx, userId);
});

// Обробка постановки на єбашку
bot.action(/assign_duty_user_(\d+)/, checkAdmin, (ctx) => {
  const userId = parseInt(ctx.match[1]);
  handleAssignDutyUser(ctx, userId);
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log('🚀 Bot started successfully!');
  })
  .catch((error) => {
    console.error('❌ Error starting bot:', error);
  });

// HTTP сервер для Cloud Run health checks
const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      bot: 'DutyBOT is running',
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on port ${PORT}`);
});

// Graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});
