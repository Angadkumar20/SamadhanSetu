const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/auth/register
// Description: Register a new user (citizen, university, industry)
router.post('/register', register);

// Route: POST /api/auth/login
// Description: Authenticate user & return JWT token
router.post('/login', login);

// Route: GET /api/auth/me
// Description: Get logged-in user profile (requires valid Bearer token)
router.get('/me', protect, getMe);

module.exports = router;
