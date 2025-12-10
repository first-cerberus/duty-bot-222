require('dotenv').config();

module.exports = {
  botToken: process.env.BOT_TOKEN,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dutybot',
  allowedIds: process.env.ALLOWED_IDS 
    ? process.env.ALLOWED_IDS.split(',').map(id => parseInt(id.trim()))
    : [],
  webhookDomain: process.env.WEBHOOK_DOMAIN,
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development'
};
