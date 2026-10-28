const cloudinaryConfig = require('../config/cloudinary');

// @desc    Upload an image file to Cloudinary
// @route   POST /upload/image
// @access  Private
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please attach a file under key "image" or "file".',
      });
    }

    const folder = req.body.folder || 'akatsuki_posts';
    const result = await cloudinaryConfig.uploadToCloudinary(req.file.buffer, folder);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded to Cloudinary successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: `Cloudinary upload failed: ${error.message}`,
    });
  }
};
