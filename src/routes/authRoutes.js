const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /auth/register
router.post('/register', authController.register);

// @route   POST /auth/login
router.post('/login', authController.login);

// @route   GET /auth/me
router.get('/me', authenticateToken, authController.getMe);

module.exports = router;
