require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ease_english',
  JWT_SECRET: process.env.JWT_SECRET || 'ease_english_secure_jwt_secret_key_2026',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  PYTHON_AI_SERVICE_URL: process.env.PYTHON_AI_SERVICE_URL || 'http://localhost:8000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
