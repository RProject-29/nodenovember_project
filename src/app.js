const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Core middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: "Akatsuki's Draft API",
    description: 'AI-Enabled Content Sharing Platform Backend',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /auth/register', 'POST /auth/login', 'GET /auth/me'],
      posts: [
        'POST /posts',
        'GET /posts',
        'GET /posts/my-posts',
        'GET /posts/:id',
        'PATCH /posts/:id',
        'DELETE /posts/:id',
      ],
      admin: [
        'GET /admin/posts/pending',
        'PATCH /admin/posts/approve/:id',
        'PATCH /admin/posts/reject/:id',
      ],
      ai: ['POST /ai/improve/:postId'],
      upload: ['POST /upload/image'],
    },
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Mount application routes
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/admin', adminRoutes);
app.use('/ai', aiRoutes);
app.use('/upload', uploadRoutes);

// Catch-all 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found`,
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
