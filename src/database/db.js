const { MongoClient } = require('mongodb');
const config = require('../config/config');

let db = null;
let client = null;

async function connectDB() {
  try {
    client = new MongoClient(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    await client.connect();
    db = client.db('DutyBOT-222'); // Назва бази з Atlas
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📦 Database:', db.databaseName);
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
}

module.exports = { connectDB, getDB, closeDB };
