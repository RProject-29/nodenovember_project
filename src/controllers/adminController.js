const Post = require('../models/Post');

// @desc    View posts awaiting approval
// @route   GET /admin/posts/pending
// @access  Private (Admin only)
exports.getPendingPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ status: 'pending' })
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a post
// @route   PATCH /admin/posts/approve/:id
// @access  Private (Admin only)
exports.approvePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.status = 'approved';
    const updatedPost = await post.save();
    const populated = await Post.findById(updatedPost._id).populate(
      'createdBy',
      'name email role'
    );

    return res.status(200).json({
      success: true,
      message: 'Post approved successfully',
      post: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a post
// @route   PATCH /admin/posts/reject/:id
// @access  Private (Admin only)
exports.rejectPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    post.status = 'rejected';
    const updatedPost = await post.save();
    const populated = await Post.findById(updatedPost._id).populate(
      'createdBy',
      'name email role'
    );

    return res.status(200).json({
      success: true,
      message: 'Post rejected successfully',
      post: populated,
    });
  } catch (error) {
    next(error);
  }
};
