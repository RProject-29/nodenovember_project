const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// @route   GET /admin/posts/pending - View posts awaiting approval
router.get('/posts/pending', adminController.getPendingPosts);

// @route   PATCH /admin/posts/approve/:id - Approve a post
router.patch('/posts/approve/:id', adminController.approvePost);

// @route   PATCH /admin/posts/reject/:id - Reject a post
router.patch('/posts/reject/:id', adminController.rejectPost);

module.exports = router;
