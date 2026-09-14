const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require('../utils/emailService');

// Strict email regex for standard validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helper function to generate a JWT token containing user id and role
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, organization, expertise, language } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, email, password, and role',
      });
    }

    // 2. Validate Name
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2) {
      return res.status(400).json({
        message: 'Name must be at least 2 characters long',
      });
    }

    // 3. Normalize & Validate Email
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        message: 'Please provide a valid email address (e.g. name@example.com)',
      });
    }

    // 4. Validate Password strength
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // 5. Validate Role against allowed whitelist
    const validRoles = ['citizen', 'university', 'industry'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: 'Role must be one of: citizen, university, or industry',
      });
    }

    // 6. Check for duplicate email (case-insensitive)
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: 'An account with this email address already exists. Please sign in.',
      });
    }

    // 7. Generate secure random email verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 8. Create user in database (password is automatically hashed by User schema pre-save hook)
    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
      role,
      phone: phone ? String(phone).trim() : '',
      organization: organization ? String(organization).trim() : '',
      expertise: expertise ? String(expertise).trim() : '',
      language: language ? String(language).trim().toLowerCase() : 'en',
      hasSelectedLanguage: Boolean(language),
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: verificationExpires,
    });

    // 9. Send verification email via Nodemailer
    await sendVerificationEmail(user.email, user.name, rawVerificationToken);

    // 10. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 11. Return response with user data and verification notice
    return res.status(201).json({
      message:
        'Registration successful! A verification link has been sent to your email. Please verify your email to unlock all platform capabilities.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language || 'en',
        hasSelectedLanguage: Boolean(user.hasSelectedLanguage),
        phone: user.phone,
        organization: user.organization,
        expertise: user.expertise,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({
      message: 'Server error during registration. Please try again later.',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify email address using secure token
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: 'Verification token is required',
      });
    }

    // Hash incoming token using SHA-256 to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user matching hashed token whose expiration is in the future
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          'Verification link is invalid or has expired. Please request a new verification email.',
        verified: false,
      });
    }

    // Mark email as verified and clear verification tokens
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send professional Welcome Email upon successful verification
    await sendWelcomeEmail(user.email, user.name);

    return res.status(200).json({
      message: 'Email verified successfully! Welcome to SamadhanSetu.',
      verified: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error.message);
    return res.status(500).json({
      message: 'Server error during email verification.',
      error: error.message,
    });
  }
};

/**
 * @desc    Resend email verification link
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        message: 'This email is already verified. You can log in directly.',
      });
    }

    // Generate fresh verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user.email, user.name, rawVerificationToken);

    return res.status(200).json({
      message: 'A new verification email has been sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error.message);
    return res.status(500).json({
      message: 'Server error resending verification email.',
      error: error.message,
    });
  }
};

/**
 * @desc    Request password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please enter your registered email address' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return clear response so user knows whether account exists
      return res.status(404).json({
        message: 'No registered account was found with that email address.',
      });
    }

    // Generate secure random reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    // Token expires in 1 hour
    user.resetPasswordToken = hashedResetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, rawResetToken);

    return res.status(200).json({
      message: 'Password reset link has been sent to your email. Please check your inbox.',
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    return res.status(500).json({
      message: 'Server error processing password reset request.',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset password using secure token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message: 'Please provide both password and confirmation',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match. Please re-enter your password.',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    // Hash token to match database
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset link is invalid or has expired. Please request a new one.',
      });
    }

    // Assign new password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      message: 'Password has been reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    return res.status(500).json({
      message: 'Server error resetting password.',
      error: error.message,
    });
  }
};

/**
 * @desc    Login existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 2. Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Compare candidate password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Role mismatch check (if role was passed from login page)
    if (role && user.role !== role) {
      return res.status(400).json({
        message: `This account is registered as '${user.role}', not '${role}'. Please use the ${user.role} portal.`,
      });
    }

    // 5. Ensure user has saved language (handle legacy database records gracefully)
    if (!user.language) {
      user.language = 'en';
      user.hasSelectedLanguage = true;
      await user.save();
    }

    // 6. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 7. Return token and user data (excluding password)
    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language || 'en',
        hasSelectedLanguage: Boolean(user.hasSelectedLanguage),
        phone: user.phone,
        organization: user.organization,
        isEmailVerified: Boolean(user.isEmailVerified),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires valid JWT)
 */
const getMe = async (req, res) => {
  try {
    // req.user was already set by the protect middleware (password excluded)
    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('GetMe error:', error.message);
    return res.status(500).json({
      message: 'Server error retrieving user profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Update currently logged-in user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, phone, organization, language, expertise } = req.body;

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      user.name = name.trim();
    }
    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }
    if (organization !== undefined) {
      user.organization = String(organization).trim();
    }
    if (expertise !== undefined && ['university', 'industry'].includes(user.role)) {
      user.expertise = String(expertise).trim();
    }
    if (language && typeof language === 'string' && language.trim()) {
      user.language = language.trim().toLowerCase();
      user.hasSelectedLanguage = true;
    }

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language || 'en',
        hasSelectedLanguage: Boolean(user.hasSelectedLanguage),
        phone: user.phone,
        organization: user.organization,
        expertise: user.expertise,
        isEmailVerified: Boolean(user.isEmailVerified),
        isVerified: Boolean(user.isVerified),
        verificationStatus: user.verificationStatus,
        isActive: Boolean(user.isActive),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    return res.status(500).json({
      message: 'Server error updating profile',
      error: error.message,
    });
  }
};

/**
 * @desc    Update language preference for logged-in user
 * @route   PUT /api/auth/language
 * @access  Private
 */
const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ message: 'Language code is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.language = language.trim().toLowerCase();
    user.hasSelectedLanguage = true;
    await user.save();

    return res.status(200).json({
      message: 'Language preference saved successfully',
      language: user.language,
    });
  } catch (error) {
    console.error('Update language error:', error.message);
    return res.status(500).json({
      message: 'Server error updating language preference',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  login,
  getMe,
  updateProfile,
  updateLanguage,
};

