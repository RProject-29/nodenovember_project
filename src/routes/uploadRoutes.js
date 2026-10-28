const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /upload/image - Upload image to Cloudinary
// Accepts image under any form field ('image', 'file', 'photo', etc.)
router.post(
  '/image',
  authenticateToken,
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error',
        });
      }
      if (req.files && req.files.length > 0) {
        req.file = req.files[0];
      }
      next();
    });
  },
  uploadController.uploadImage
);

module.exports = router;
