const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes: verifies the JWT token from the Authorization header
const protect = async (req, res, next) => {
  let token;

  // Check if Authorization header is present and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token with our JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by id contained in token payload (exclude password field)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found, authorization denied' });
      }

      // Proceed to the next middleware or controller
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
    }
  }

  // If no token was found in the header
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Middleware to restrict access to specific roles (e.g. 'citizen', 'university', 'industry')
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Ensure req.user exists and its role matches one of the allowed roles
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user ? req.user.role : 'unknown'}' is not allowed to access this route`,
      });
    }
    next();
  };
};

// Middleware to prevent sensitive actions if email is not verified
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, please log in' });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      message: 'Email verification required. Please verify your email address to perform this action.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }

  next();
};

module.exports = {
  protect,
  authorizeRoles,
  requireVerifiedEmail,
};

