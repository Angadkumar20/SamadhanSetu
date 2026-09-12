const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper function to generate a JWT token containing user id and role
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Basic input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields (name, email, password, role)' });
    }

    // Validate role
    const validRoles = ['citizen', 'university', 'industry'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be one of: citizen, university, industry' });
    }

    // 2. Check if user with given email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // 3. Create user (password will be automatically hashed by User schema pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 5. Return token and user data (excluding password)
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide both email and password' });
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Compare candidate password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 4. Generate JWT token
    const token = generateToken(user._id, user.role);

    // 5. Return token and user data (excluding password)
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private (Requires valid JWT)
const getMe = async (req, res) => {
  try {
    // req.user was already set by the protect middleware (password excluded)
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('GetMe error:', error.message);
    res.status(500).json({ message: 'Server error retrieving user profile', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
