const Post = require('../models/Post');

// @desc    Create a new post or draft
// @route   POST /posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { title, description, content, image, category, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required.',
      });
    }

    // Default status to 'draft' if not provided or invalid
    let postStatus = 'draft';
    if (status && ['draft', 'pending'].includes(status)) {
      postStatus = status;
    }

    const post = await Post.create({
      title,
      description: description || '',
      content,
      image: image || '',
      category: category || 'General',
      createdBy: req.user._id,
      status: postStatus,
    });

    const populatedPost = await Post.findById(post._id).populate(
      'createdBy',
      'name email role'
    );

    return res.status(201).json({
      success: true,
      message: 'Post created successfully',
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    View all approved posts
// @route   GET /posts
// @access  Public
exports.getApprovedPosts = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const filter = { status: 'approved' };

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
      ];
    }

    const posts = await Post.find(filter)
      .populate('createdBy', 'name email')
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

// @desc    View your own posts and drafts
// @route   GET /posts/my-posts
// @access  Private
exports.getMyPosts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { createdBy: req.user._id };

    if (status && ['draft', 'pending', 'approved', 'rejected'].includes(status)) {
      filter.status = status;
    }

    const posts = await Post.find(filter)
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

// @desc    View an approved post by ID (or own/admin post if auth provided)
// @route   GET /posts/:id
// @access  Public (Approved) / Private (Own draft/pending/rejected)
exports.getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      'createdBy',
      'name email role'
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // If post is approved, it is public
    if (post.status === 'approved') {
      return res.status(200).json({
        success: true,
        post,
      });
    }

    // If not approved, user must be logged in and must be the creator or an admin
    if (
      req.user &&
      (post.createdBy._id.toString() === req.user._id.toString() ||
        req.user.role === 'admin')
    ) {
      return res.status(200).json({
        success: true,
        post,
      });
    }

    return res.status(403).json({
      success: false,
      message: 'This post is not publicly accessible until approved by an admin.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update your own post
// @route   PATCH /posts/:id
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this post.',
      });
    }

    const updates = ['title', 'description', 'content', 'image', 'category', 'status'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        // If regular user updates status, only allow 'draft' or 'pending'
        if (field === 'status' && !isAdmin) {
          if (['draft', 'pending'].includes(req.body.status)) {
            post.status = req.body.status;
          }
        } else {
          post[field] = req.body[field];
        }
      }
    });

    const updatedPost = await post.save();
    const populated = await Post.findById(updatedPost._id).populate(
      'createdBy',
      'name email role'
    );

    return res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete your own post
// @route   DELETE /posts/:id
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check ownership
    const isOwner = post.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this post.',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      deletedPostId: req.params.id,
    });
  } catch (error) {
    next(error);
  }
};
