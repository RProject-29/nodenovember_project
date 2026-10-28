const Post = require('../models/Post');
const geminiService = require('../services/geminiService');

// @desc    Improve post content using AI and save as a new draft under the same user
// @route   POST /ai/improve/:postId
// @access  Private
exports.improvePostContent = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { instructions } = req.body || {};

    const originalPost = await Post.findById(postId);
    if (!originalPost) {
      return res.status(404).json({
        success: false,
        message: 'Original post not found',
      });
    }

    // Ensure the requester owns the post or is an admin
    const isOwner = originalPost.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are only authorized to improve your own posts.',
      });
    }

    // Call Gemini AI service
    let improved;
    try {
      improved = await geminiService.improveContentWithGemini({
        title: originalPost.title,
        description: originalPost.description,
        content: originalPost.content,
        userInstructions: instructions,
      });
    } catch (aiErr) {
      return res.status(500).json({
        success: false,
        message: `AI improvement failed: ${aiErr.message}`,
      });
    }

    // Save as a new draft with a new ID under the same user, preserving the original draft
    const newDraft = await Post.create({
      title: improved.title || `[Improved] ${originalPost.title}`,
      description: improved.description || originalPost.description,
      content: improved.content,
      image: originalPost.image,
      category: originalPost.category,
      createdBy: originalPost.createdBy,
      status: 'draft',
    });

    const populatedDraft = await Post.findById(newDraft._id).populate(
      'createdBy',
      'name email role'
    );

    return res.status(201).json({
      success: true,
      message: 'AI improved content saved as a new draft successfully',
      originalPostId: originalPost._id,
      improvedDraft: populatedDraft,
    });
  } catch (error) {
    next(error);
  }
};
