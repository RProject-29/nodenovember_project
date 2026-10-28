const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

// @route   POST /posts - Create a new post or draft
router.post('/', authenticateToken, postController.createPost);

// @route   GET /posts - View all approved posts
router.get('/', postController.getApprovedPosts);

// @route   GET /posts/my-posts - View your own posts and drafts
// NOTE: Must be declared before /:id to prevent route shadowing
router.get('/my-posts', authenticateToken, postController.getMyPosts);

// @route   GET /posts/:id - View an approved post by ID (or own draft/pending if authenticated)
router.get('/:id', optionalAuth, postController.getPostById);

// @route   PATCH /posts/:id - Update your own post
router.patch('/:id', authenticateToken, postController.updatePost);

// @route   DELETE /posts/:id - Delete your own post
router.delete('/:id', authenticateToken, postController.deletePost);

module.exports = router;
