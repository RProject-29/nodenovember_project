const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /ai/improve/:postId - Improve content using AI and save as new draft
router.post('/improve/:postId', authenticateToken, aiController.improvePostContent);

module.exports = router;
