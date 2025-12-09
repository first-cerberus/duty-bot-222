const { Markup } = require('telegraf');
const { 
  getUsersWithLeastDuties, 
  updateEbashkaStatus, 
  updateEbashkaCount,
  getAllUsers 
} = require('../database/models');

async function handleDutyList(ctx) {
  await ctx.answerCbQuery();
  
  // Створюємо клавіатуру з кнопками від 1 до 8
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('1', 'select_count_1'), Markup.button.callback('2', 'select_count_2')],
    [Markup.button.callback('3', 'select_count_3'), Markup.button.callback('4', 'select_count_4')],
    [Markup.button.callback('5', 'select_count_5'), Markup.button.callback('6', 'select_count_6')],
    [Markup.button.callback('7', 'select_count_7'), Markup.button.callback('8', 'select_count_8')],
    [Markup.button.callback('🏠 Головне меню', 'main_menu')]
  ]);
  
  await ctx.editMessageText('📋 Виберіть кількість людей на єбашку:', keyboard);
}

async function handleSelectCount(ctx, count) {
  await ctx.answerCbQuery();
  
  try {
    // Отримуємо користувачів з найменшою кількістю єбашок
    const users = await getUsersWithLeastDuties(count);
    
    if (users.length === 0) {
      await ctx.editMessageText('❌ Немає доступних користувачів');
      return;
    }
    
    // Оновлюємо статус та інкрементуємо лічильник для кожного користувача
    for (const user of users) {
      await updateEbashkaStatus(user.id, 'on_duty');
      await updateEbashkaCount(user.id, user.ebashka_count + 1);
    }
    
    // Формуємо повідомлення зі списком
    let message = `📋 Люди на єбашку (${users.length}):\n\n`;
    users.forEach((user, index) => {
      message += `${index + 1}. ${user.fullName} - було ${user.ebashka_count} єбашок\n`;
    });
    
    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Головне меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(message, backKeyboard);
  } catch (error) {
    console.error('Помилка при отриманні користувачів:', error);
    await ctx.editMessageText('❌ Помилка при отриманні списку');
  }
}

async function handleDutyCount(ctx) {
  await ctx.answerCbQuery();
  
  try {
    const users = await getAllUsers();
    
    if (users.length === 0) {
      await ctx.editMessageText('❌ Немає користувачів у базі даних');
      return;
    }
    
    // Сортуємо за кількістю єбашок (від більших до менших)
    users.sort((a, b) => b.ebashka_count - a.ebashka_count);
    
    let message = `📊 Список кількості єбашок:\n\n`;
    users.forEach((user, index) => {
      const status = user.ebashka_status === 'on_duty' ? '🔴' : '🟢';
      // Витягуємо тільки прізвище (перше слово з fullName)
      const lastName = user.fullName.split(' ')[0];
      message += `${index + 1}. ${lastName} - ${user.ebashka_count} ${status}\n`;
    });
    
    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Головне меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(message, backKeyboard);
  } catch (error) {
    console.error('Помилка при отриманні списку:', error);
    await ctx.editMessageText('❌ Помилка при отриманні списку');
  }
}

async function handleAddDuty(ctx) {
  await ctx.answerCbQuery();
  
  try {
    const users = await getAllUsers();
    
    if (users.length === 0) {
      await ctx.editMessageText('❌ Немає користувачів у базі даних');
      return;
    }
    
    // Створюємо inline кнопки з прізвищами користувачів
    const buttons = users.map(user => [
      Markup.button.callback(user.fullName, `add_duty_user_${user.id}`)
    ]);
    buttons.push([Markup.button.callback('◀️ Назад', 'main_menu')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText('➕ Виберіть користувача для додавання 1 єбашки:', keyboard);
  } catch (error) {
    console.error('Помилка при отриманні списку користувачів:', error);
    await ctx.editMessageText('❌ Помилка при отриманні списку');
  }
}

async function handleAddDutyToUser(ctx, userId) {
  await ctx.answerCbQuery();
  
  try {
    const user = await require('../database/models').getUserById(userId);
    
    if (!user) {
      await ctx.editMessageText('❌ Користувача не знайдено');
      return;
    }
    
    // Інкрементуємо кількість єбашок
    await updateEbashkaCount(userId, user.ebashka_count + 1);
    
    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Головне меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(`✅ Додано 1 єбашку для ${user.fullName}\nТепер: ${user.ebashka_count + 1} єбашок`, backKeyboard);
  } catch (error) {
    console.error('Помилка при додаванні єбашки:', error);
    await ctx.editMessageText('❌ Помилка при додаванні єбашки');
  }
}

async function handleRemoveDuty(ctx) {
  await ctx.answerCbQuery();
  
  try {
    const users = await getAllUsers();
    
    if (users.length === 0) {
      await ctx.editMessageText('❌ Немає користувачів у базі даних');
      return;
    }
    
    // Створюємо inline кнопки з прізвищами користувачів
    const buttons = users.map(user => [
      Markup.button.callback(user.fullName, `remove_duty_user_${user.id}`)
    ]);
    buttons.push([Markup.button.callback('◀️ Назад', 'main_menu')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText('➖ Виберіть користувача для видалення 1 єбашки:', keyboard);
  } catch (error) {
    console.error('Помилка при отриманні списку користувачів:', error);
    await ctx.editMessageText('❌ Помилка при отриманні списку');
  }
}

async function handleRemoveDutyFromUser(ctx, userId) {
  await ctx.answerCbQuery();
  
  try {
    const user = await require('../database/models').getUserById(userId);
    
    if (!user) {
      await ctx.editMessageText('❌ Користувача не знайдено');
      return;
    }
    
    // Перевірка на від'ємне число
    if (user.ebashka_count <= 0) {
      await ctx.editMessageText(`❌ У ${user.fullName} вже 0 єбашок, не можна видалити більше`);
      return;
    }
    
    // Декрементуємо кількість єбашок
    await updateEbashkaCount(userId, user.ebashka_count - 1);
    
    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Головне меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(`✅ Видалено 1 єбашку для ${user.fullName}\nТепер: ${user.ebashka_count - 1} єбашок`, backKeyboard);
  } catch (error) {
    console.error('Помилка при видаленні єбашки:', error);
    await ctx.editMessageText('❌ Помилка при видаленні єбашки');
  }
}

async function handleFreeDuty(ctx) {
  await ctx.answerCbQuery();
  
  try {
    // Отримуємо тільки користувачів на єбашці (статус on_duty)
    const users = await require('../database/models').getUsersByStatus('on_duty');
    
    if (users.length === 0) {
      await ctx.editMessageText('❌ Немає людей на єбашці');
      return;
    }
    
    // Створюємо inline кнопки з прізвищами
    const buttons = users.map(user => [
      Markup.button.callback(user.fullName, `free_duty_user_${user.id}`)
    ]);
    buttons.push([Markup.button.callback('◀️ Назад', 'main_menu')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText('🟢 Виберіть хто прийшов з єбашкі:', keyboard);
  } catch (error) {
    console.error('Помилка при отриманні списку:', error);
    await ctx.editMessageText('❌ Помилка при отриманні списку');
  }
}

async function handleFreeDutyUser(ctx, userId) {
  await ctx.answerCbQuery();
  
  try {
    const user = await require('../database/models').getUserById(userId);
    
    if (!user) {
      await ctx.editMessageText('❌ Користувача не знайдено');
      return;
    }
    
    if (user.ebashka_status === 'free') {
      await ctx.editMessageText(`❌ ${user.fullName} вже не на єбашці`);
      return;
    }
    
    // Змінюємо статус на free (зелений)
    await updateEbashkaStatus(userId, 'free');
    
    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Головне меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(`✅ ${user.fullName} прийшов з єбашкі 🟢`, backKeyboard);
  } catch (error) {
    console.error('Помилка при зміні статусу:', error);
    await ctx.editMessageText('❌ Помилка при зміні статусу');
  }
}

async function handleAssignDuty(ctx) {
  await ctx.answerCbQuery();
  
  try {
    // Отримуємо тільки користувачів не на єбашці (статус free)
    const users = await require('../database/models').getUsersByStatus('free');
    
    if (users.length === 0) {
      await ctx.editMessageText('❌ Всі вже на єбашці');
      return;
    }
    
    // Створюємо inline кнопки з прізвищами
    const buttons = users.map(user => [
      Markup.button.callback(user.fullName, `assign_duty_user_${user.id}`)
    ]);
    buttons.push([Markup.button.callback('◀️ Назад', 'main_menu')]);
    
    const keyboard = Markup.inlineKeyboard(buttons);
    
    await ctx.editMessageText('🔴 Виберіть кого поставити на єбашку:', keyboard);
  } catch (error) {
    console.error('Помилка при отриманні списку:', error);
    await ctx.editMessageText('❌ Помилка при отриманні списку');
  }
}

async function handleAssignDutyUser(ctx, userId) {
  await ctx.answerCbQuery();
  
  try {
    const user = await require('../database/models').getUserById(userId);
    
    if (!user) {
      await ctx.editMessageText('❌ Користувача не знайдено');
      return;
    }
    
    if (user.ebashka_status === 'on_duty') {
      await ctx.editMessageText(`❌ ${user.fullName} вже на єбашці`);
      return;
    }
    
    // Змінюємо статус на on_duty (червоний)
    await updateEbashkaStatus(userId, 'on_duty');
    
    const backKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Головне меню', 'main_menu')]
    ]);
    
    await ctx.editMessageText(`✅ ${user.fullName} поставлено на єбашку 🔴`, backKeyboard);
  } catch (error) {
    console.error('Помилка при зміні статусу:', error);
    await ctx.editMessageText('❌ Помилка при зміні статусу');
  }
}

module.exports = {
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
};
