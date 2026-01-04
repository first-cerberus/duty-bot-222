const { getDB } = require('./db');

const COLLECTION_NAME = 'users';

/**
 * Створює або оновлює користувача в базі даних
 * @param {Object} userData - Дані користувача
 * @param {number} userData.id - Telegram ID користувача
 * @param {string} userData.fullName - ПІБ користувача
 * @param {number} [userData.ebashka_count=0] - Кількість єбашок
 * @param {string} [userData.ebashka_status='free'] - Статус єбашки ('free' або 'on_duty')
 */
async function createOrUpdateUser(userData) {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  
  const result = await collection.updateOne(
    { id: userData.id },
    {
      $set: {
        fullName: userData.fullName,
        ebashka_count: userData.ebashka_count || 0,
        ebashka_status: userData.ebashka_status || 'free',
        updated_at: new Date()
      },
      $setOnInsert: {
        id: userData.id,
        created_at: new Date()
      }
    },
    { upsert: true }
  );
  
  return result;
}

/**
 * Отримує користувача за ID
 * @param {number} userId - Telegram ID користувача
 */
async function getUserById(userId) {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  return await collection.findOne({ id: userId });
}

/**
 * Отримує всіх користувачів
 */
async function getAllUsers() {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  return await collection.find({}).toArray();
}

/**
 * Оновлює кількість єбашок користувача
 * @param {number} userId - Telegram ID користувача
 * @param {number} count - Нова кількість єбашок
 */
async function updateEbashkaCount(userId, count) {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  
  const result = await collection.updateOne(
    { id: userId },
    {
      $set: {
        ebashka_count: count,
        updated_at: new Date()
      }
    }
  );
  
  return result;
}

/**
 * Оновлює статус єбашки користувача
 * @param {number} userId - Telegram ID користувача
 * @param {string} status - Новий статус ('free' або 'on_duty')
 */
async function updateEbashkaStatus(userId, status) {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  
  const updateData = {
    ebashka_status: status,
    updated_at: new Date()
  };
  
  // Якщо ставимо на дежурство, зберігаємо час початку
  if (status === 'on_duty') {
    updateData.duty_start_time = new Date();
  } else {
    // Якщо знімаємо з дежурства, видаляємо час початку
    updateData.duty_start_time = null;
  }
  
  const result = await collection.updateOne(
    { id: userId },
    {
      $set: updateData
    }
  );
  
  return result;
}

/**
 * Отримує користувачів за статусом єбашки
 * @param {string} status - Статус ('free' або 'on_duty')
 */
async function getUsersByStatus(status) {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  return await collection.find({ ebashka_status: status }).toArray();
}

/**
 * Отримує користувачів, відсортованих за кількістю єбашок (від менших до більших)
 * @param {number} limit - Кількість користувачів для отримання
 */
async function getUsersWithLeastDuties(limit) {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  return await collection
    .find({ ebashka_status: 'free' })
    .sort({ ebashka_count: 1 })
    .limit(limit)
    .toArray();
}

/**
 * Автоматично знімає з дежурства користувачів, які на дежурстві більше 8 годин
 * Викликається планувальником без сповіщень
 */
async function autoRemoveFromDuty() {
  const db = getDB();
  const collection = db.collection(COLLECTION_NAME);
  
  // Отримуємо поточний час мінус 8 годин
  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
  
  // Знаходимо користувачів на дежурстві, які були поставлені більше 8 годин тому
  const usersToRemove = await collection.find({
    ebashka_status: 'on_duty',
    duty_start_time: { $lte: eightHoursAgo, $ne: null }
  }).toArray();
  
  // Знімаємо їх з дежурства
  if (usersToRemove.length > 0) {
    await collection.updateMany(
      {
        ebashka_status: 'on_duty',
        duty_start_time: { $lte: eightHoursAgo, $ne: null }
      },
      {
        $set: {
          ebashka_status: 'free',
          duty_start_time: null,
          updated_at: new Date()
        }
      }
    );
    
    console.log(`Автоматично знято з дежурства ${usersToRemove.length} користувачів:`);
    usersToRemove.forEach(user => {
      console.log(`- ${user.fullName}`);
    });
  }
  
  return usersToRemove;
}

module.exports = {
  createOrUpdateUser,
  getUserById,
  getAllUsers,
  updateEbashkaCount,
  updateEbashkaStatus,
  getUsersByStatus,
  getUsersWithLeastDuties,
  autoRemoveFromDuty
};
