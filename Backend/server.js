const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the actual backend .env file,
// regardless of the working directory used to start the process.
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Initialize Express app
const app = express();

// ==========================================
// Middleware
// ==========================================

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'https://samadhan-setu-livid.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// ==========================================
// Database Connection
// ==========================================
const { connectDB } = require('./database');
const { seedAdminAccount } = require('./utils/adminSeeder');

connectDB().then(() => {
  seedAdminAccount();
});

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Root endpoint: quick health/info check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SamadhanSetu Backend API',
    status: 'Running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      problems: '/api/problems',
      notifications: '/api/notifications',
      admin: '/api/admin',
    },
  });
});

// Mount authentication, problem, notification, and admin routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// 404 Not Found & Error Handling Middleware
// ==========================================

// Handle unknown route requests (404)
app.use((req, res, next) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

// ==========================================
// Start Server
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` SamadhanSetu Backend is running on port ${PORT}`);
  console.log(` API Base URL: http://localhost:${PORT}`);
});
