const multer = require('multer');

// Store files in memory as Buffer for direct streaming to Cloudinary
// Compatible with both local environments and serverless (Vercel)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type: Only images (JPEG, PNG, WEBP, GIF, SVG) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

module.exports = upload;
