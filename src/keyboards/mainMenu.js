const { Markup } = require('telegraf');

const mainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🤤Дати людей на єбашку', 'duty_list')],
  [Markup.button.callback('📊Список кількості єбашок', 'duty_count')],
  [Markup.button.callback('➕Добавляє 1 єбашку', 'add_duty')],
  [Markup.button.callback('➖Видаляє 1 єбашку', 'remove_duty')],
  [Markup.button.callback('🟢Прийшов з єбашкі', 'free_duty')],
  [Markup.button.callback('🔴Ставить на єбашку', 'assign_duty')]
]);

// Клавіатура з кнопкою "Головне меню"
const backToMainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🏠 Головне меню', 'main_menu')]
]);

// Функція для додавання кнопки "Назад" до існуючої клавіатури
function addBackButton(buttons, backAction) {
  return Markup.inlineKeyboard([
    ...buttons,
    [Markup.button.callback('◀️ Назад', backAction)]
  ]);
}

// Функція для додавання кнопки "Головне меню" до існуючої клавіатури
function addMainMenuButton(buttons) {
  return Markup.inlineKeyboard([
    ...buttons,
    [Markup.button.callback('🏠 Головне меню', 'main_menu')]
  ]);
}

module.exports = { 
  mainMenuKeyboard, 
  backToMainMenuKeyboard,
  addBackButton,
  addMainMenuButton
};
