const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * Reads MONGO_URI from process.env or falls back to local MongoDB
 */
const connectDB = async () => {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/samadhansetu';

  try {
    const conn = await mongoose.connect(MONGO_URI);

    console.log(` MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(' MongoDB connection error:', error.message);
    console.warn(' Please verify your MONGO_URI in Backend/.env and ensure MongoDB is accessible.');
    return null;
  }
};

// Listeners for database connection state changes
mongoose.connection.on('disconnected', () => {
  console.warn(' MongoDB connection lost. Reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log(' MongoDB reconnected successfully');
});

module.exports = connectDB;
