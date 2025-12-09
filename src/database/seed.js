const { connectDB, closeDB } = require('./db');
const { createOrUpdateUser } = require('./models');

const users = [
  {
    id: 651512441,
    fullName: 'Босненко Андрій Віталійович',
    ebashka_count: 0,
    ebashka_status: 'free'
  },
  {
    id: 745851478,
    fullName: 'Віщун Данило Вадимович',
    ebashka_count: 2,
    ebashka_status: 'free'
  },
  {
    id: 908514277,
    fullName: 'Гвілдіс Едуард Сергійович',
    ebashka_count: 1,
    ebashka_status: 'free'
  },
  {
    id: 864622010,
    fullName: 'Гетун Андрій Вікторович',
    ebashka_count: 1,
    ebashka_status: 'free'
  },
  {
    id: 554880612,
    fullName: 'Кльоц Михайло Олександрович',
    ebashka_count: 1,
    ebashka_status: 'free'
  },
  {
    id: 831022510,
    fullName: 'Литвяков Андрій Сергійович',
    ebashka_count: 1,
    ebashka_status: 'free'
  },
  {
    id: 886992237,
    fullName: 'Сіваков Артем Олександрович',
    ebashka_count: 1,
    ebashka_status: 'free'
  },
  {
    id: 912894950,
    fullName: 'Хоменко Андрій Вікторович',
    ebashka_count: 1,
    ebashka_status: 'free'
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Заповнення бази даних...');
    
    for (const user of users) {
      await createOrUpdateUser(user);
      console.log(`✅ Додано: ${user.fullName}`);
    }
    
    console.log('✅ База даних успішно заповнена!');
  } catch (error) {
    console.error('❌ Помилка при заповненні БД:', error);
  } finally {
    await closeDB();
  }
}

seedDatabase();