const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer directly to Cloudinary using streams (Serverless & Vercel friendly)
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Folder name in Cloudinary
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, folder = 'akatsuki_posts') => {
  return new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
        )
      );
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
};
