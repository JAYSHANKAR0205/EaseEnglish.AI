const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`[MongoDB] Connection error: ${err.message}`);
    // If Atlas connection has a temporary network issue, provide clear log
    console.warn('[MongoDB] Database connection failed. Please ensure network access or valid MongoDB URI.');
    throw err;
  }
};

module.exports = connectDB;
