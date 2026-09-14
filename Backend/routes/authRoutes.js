const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  updateProfile,
  updateLanguage,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Route: POST /api/auth/register
// Description: Register a new user with validation & verification email
router.post('/register', register);

// Route: POST /api/auth/login
// Description: Authenticate user & return JWT token
router.post('/login', login);

// Route: GET /api/auth/me
// Description: Get logged-in user profile (requires valid Bearer token)
router.get('/me', protect, getMe);

// Route: PUT /api/auth/profile
// Description: Update user profile (name, phone, organization, language)
router.put('/profile', protect, updateProfile);

// Route: PUT /api/auth/language
// Description: Quick update user language preference in MongoDB
router.put('/language', protect, updateLanguage);

// Route: GET & POST /api/auth/verify-email/:token
// Description: Verify email address via link token and send welcome email
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email/:token', verifyEmail);

// Route: POST /api/auth/resend-verification
// Description: Resend verification email
router.post('/resend-verification', resendVerification);

// Route: POST /api/auth/forgot-password
// Description: Request password reset link email
router.post('/forgot-password', forgotPassword);

// Route: POST /api/auth/reset-password/:token
// Description: Reset password using secure token
router.post('/reset-password/:token', resetPassword);

module.exports = router;
