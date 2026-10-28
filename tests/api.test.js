const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const geminiService = require('../src/services/geminiService');
const cloudinaryConfig = require('../src/config/cloudinary');

let mongoServer;

describe("Akatsuki's Draft API Test Suite", () => {
  let userToken;
  let userId;
  let adminToken;
  let adminId;
  let otherUserToken;
  let userPostId;
  let pendingPostId;

  before(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
    process.env.NODE_ENV = 'test';

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('1. Authentication Endpoints', () => {
    it('POST /auth/register - should successfully register a regular user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Naruto Uzumaki',
          email: 'naruto@leaf.village',
          password: 'password123',
          role: 'user',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      assert.ok(res.body.user);
      assert.strictEqual(res.body.user.role, 'user');
      assert.strictEqual(res.body.user.password, undefined);

      userId = res.body.user._id;
    });

    it('POST /auth/register - should reject duplicate email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Naruto Clone',
          email: 'naruto@leaf.village',
          password: 'password123',
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('POST /auth/register - should register an admin user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Pain Akatsuki',
          email: 'pain@akatsuki.org',
          password: 'adminpassword123',
          role: 'admin',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.user.role, 'admin');
      adminId = res.body.user._id;
      adminToken = res.body.token;
    });

    it('POST /auth/register - should register another regular user for permission tests', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'Sasuke Uchiha',
          email: 'sasuke@leaf.village',
          password: 'password123',
        });

      assert.strictEqual(res.status, 201);
      otherUserToken = res.body.token;
    });

    it('POST /auth/login - should authenticate user and return JWT token', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'naruto@leaf.village',
          password: 'password123',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.token);
      userToken = res.body.token;
    });

    it('POST /auth/login - should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'naruto@leaf.village',
          password: 'wrongpassword',
        });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('GET /auth/me - should get logged-in user profile with valid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.email, 'naruto@leaf.village');
      assert.strictEqual(res.body.user.password, undefined);
    });

    it('GET /auth/me - should return 401 when token is missing', async () => {
      const res = await request(app).get('/auth/me');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });
  });

  describe('2. User - Post Management Endpoints', () => {
    it('POST /posts - should create a new draft post', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'My Journey to Becoming Hokage',
          description: 'A story of hard work and determination',
          content: 'Believe it! Never give up on your dreams.',
          category: 'Adventure',
          status: 'draft',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.post.title, 'My Journey to Becoming Hokage');
      assert.strictEqual(res.body.post.status, 'draft');
      assert.strictEqual(res.body.post.createdBy._id, userId);

      userPostId = res.body.post._id;
    });

    it('POST /posts - should create a post with pending status for approval', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'The Will of Fire and Shinobi Way',
          description: 'Understanding peace and conflict',
          content: 'True strength comes from protecting those you care about.',
          category: 'Philosophy',
          status: 'pending',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.post.status, 'pending');
      pendingPostId = res.body.post._id;
    });

    it('GET /posts/my-posts - should return all posts created by the logged in user', async () => {
      const res = await request(app)
        .get('/posts/my-posts')
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.posts.length, 2);
      assert.strictEqual(res.body.posts[0].createdBy._id, userId);
    });

    it('GET /posts - should only return approved posts (initially empty)', async () => {
      const res = await request(app).get('/posts');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.posts.length, 0);
    });

    it('GET /posts/:id - should allow creator to view their own draft/pending post', async () => {
      const res = await request(app)
        .get(`/posts/${userPostId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.post.title, 'My Journey to Becoming Hokage');
    });

    it('GET /posts/:id - should deny unauthenticated visitor from viewing unapproved draft', async () => {
      const res = await request(app).get(`/posts/${userPostId}`);
      assert.strictEqual(res.status, 403);
    });

    it('PATCH /posts/:id - should allow author to update their own post', async () => {
      const res = await request(app)
        .patch(`/posts/${userPostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'My Journey to Becoming the Seventh Hokage',
          description: 'Updated description with new insights',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.post.title, 'My Journey to Becoming the Seventh Hokage');
    });

    it('PATCH /posts/:id - should prevent another user from updating someone elses post', async () => {
      const res = await request(app)
        .patch(`/posts/${userPostId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Hacked by Sasuke',
        });

      assert.strictEqual(res.status, 403);
    });
  });

  describe('3. Admin - Post Approval Endpoints', () => {
    it('GET /admin/posts/pending - should prevent non-admin from accessing pending posts', async () => {
      const res = await request(app)
        .get('/admin/posts/pending')
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 403);
    });

    it('GET /admin/posts/pending - should allow admin to view pending posts', async () => {
      const res = await request(app)
        .get('/admin/posts/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.posts.length, 1);
      assert.strictEqual(res.body.posts[0]._id, pendingPostId);
    });

    it('PATCH /admin/posts/approve/:id - should allow admin to approve a post', async () => {
      const res = await request(app)
        .patch(`/admin/posts/approve/${pendingPostId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.post.status, 'approved');
    });

    it('GET /posts - should now list the newly approved post publicly', async () => {
      const res = await request(app).get('/posts');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.posts.length, 1);
      assert.strictEqual(res.body.posts[0]._id, pendingPostId);
      assert.strictEqual(res.body.posts[0].status, 'approved');
    });

    it('GET /posts/:id - should now allow public access to approved post by ID without auth', async () => {
      const res = await request(app).get(`/posts/${pendingPostId}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.post._id, pendingPostId);
    });

    it('PATCH /admin/posts/reject/:id - should allow admin to reject a post', async () => {
      const res = await request(app)
        .patch(`/admin/posts/reject/${pendingPostId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.post.status, 'rejected');
    });
  });

  describe('4. AI Integration - Content Improvement Endpoint', () => {
    it('POST /ai/improve/:postId - should improve content and save as new draft with new ID under same user', async () => {
      // Temporarily mock service method for isolated unit testing
      const originalMethod = geminiService.improveContentWithGemini;
      geminiService.improveContentWithGemini = async () => ({
        title: 'The Seventh Hokage: Path to Leadership',
        description: 'An inspirational overview of dedication, resilience, and teamwork.',
        content: 'Leading the village requires mutual understanding, resilience, and unbreakable dedication.',
      });

      try {
        const res = await request(app)
          .post(`/ai/improve/${userPostId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            instructions: 'Make it inspirational and executive.',
          });

        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.originalPostId, userPostId);
        assert.ok(res.body.improvedDraft);

        // Check that new post has a different ID
        assert.notStrictEqual(res.body.improvedDraft._id, userPostId);
        assert.strictEqual(res.body.improvedDraft.status, 'draft');
        assert.strictEqual(res.body.improvedDraft.createdBy._id, userId);
        assert.strictEqual(
          res.body.improvedDraft.title,
          'The Seventh Hokage: Path to Leadership'
        );

        // Verify the original post still exists intact in the database
        const originalRes = await request(app)
          .get(`/posts/${userPostId}`)
          .set('Authorization', `Bearer ${userToken}`);
        assert.strictEqual(originalRes.status, 200);
        assert.strictEqual(originalRes.body.post._id, userPostId);
      } finally {
        geminiService.improveContentWithGemini = originalMethod;
      }
    });

    it('POST /ai/improve/:postId - should return 404 for non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/ai/improve/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 404);
    });
  });

  describe('5. Delete Post Endpoint', () => {
    it('DELETE /posts/:id - should delete author post successfully', async () => {
      const res = await request(app)
        .delete(`/posts/${userPostId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      // Verify post is deleted
      const checkRes = await request(app)
        .get(`/posts/${userPostId}`)
        .set('Authorization', `Bearer ${userToken}`);
      assert.strictEqual(checkRes.status, 404);
    });
  });

  describe('6. Cloudinary Image Upload Endpoint', () => {
    it('POST /upload/image - should return 400 when no image file is attached', async () => {
      const res = await request(app)
        .post('/upload/image')
        .set('Authorization', `Bearer ${userToken}`);

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('POST /upload/image - should successfully upload image and return secure URL', async () => {
      const originalUpload = cloudinaryConfig.uploadToCloudinary;
      cloudinaryConfig.uploadToCloudinary = async (buffer, folder) => ({
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v123456/akatsuki_sample.jpg',
        public_id: 'akatsuki_posts/sample_123',
        format: 'jpg',
        width: 800,
        height: 600,
        bytes: 12345,
      });

      try {
        const dummyImageBuffer = Buffer.from('fake image content for testing');
        const res = await request(app)
          .post('/upload/image')
          .set('Authorization', `Bearer ${userToken}`)
          .attach('image', dummyImageBuffer, 'sample.jpg');

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(
          res.body.imageUrl,
          'https://res.cloudinary.com/demo/image/upload/v123456/akatsuki_sample.jpg'
        );
      } finally {
        cloudinaryConfig.uploadToCloudinary = originalUpload;
      }
    });
  });
});
