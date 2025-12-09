const { MongoClient } = require('mongodb');
const config = require('../config/config');

let db = null;

async function connectDB() {
  try {
    const client = new MongoClient(config.mongodbUri);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
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

module.exports = { connectDB, getDB };
