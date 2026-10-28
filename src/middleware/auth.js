const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const secret = process.env.JWT_SECRET || 'akatsuki_secret_jwt_key_2024';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id || decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token: User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (token) {
      const secret = process.env.JWT_SECRET || 'akatsuki_secret_jwt_key_2024';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id || decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Fail silently for optional auth
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
};
