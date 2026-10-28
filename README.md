# Akatsuki's Draft: AI-Enabled Content Sharing Platform (Backend)

An enterprise-grade, RESTful backend for **Akatsuki's Draft**, built with **Node.js**, **Express**, **MongoDB (Mongoose)**, **JWT Authentication**, and **Google Gemini AI**. Designed for seamless local execution and instant serverless deployment on **Vercel**.

---

## 🌟 Features

- **🔐 Robust JWT Authentication**: Secure user registration, password hashing with `bcryptjs`, JWT token signing/verification, and role-based access control (`user` vs `admin`).
- **📝 Complete Post Management**: Create, view, update, and delete posts with draft status handling (`draft`, `pending`, `approved`, `rejected`).
- **🛡️ Admin Approval Workflow**: Dedicated admin endpoints to review pending posts and approve or reject content before it becomes publicly accessible.
- **🤖 Gemini AI Integration**: Enhances writing quality, tone, and grammar with Google Gemini AI (`gemini-1.5-flash`), saving the improved content as a new draft under the same user while preserving the original.
- **🚀 Vercel Serverless Ready**: Configured with `vercel.json` and cached MongoDB connection pooling in `api/index.js` for zero-configuration deployment to Vercel.
- **🧪 Automated Test Suite**: Comprehensive automated integration tests covering all 13 endpoints.
- **📬 Complete Postman Collection**: Pre-configured `postman_collection.json` with automatic JWT token variable capture.

---

## 🏗️ Architecture & Schema Design

### 1. User Schema
```json
{
  "name": "String (Required)",
  "email": "String (Required, Unique)",
  "password": "String (Required, Hashed with bcrypt)",
  "role": "String (enum: ['user', 'admin'], default: 'user')",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 2. Post Schema
```json
{
  "title": "String (Required)",
  "description": "String",
  "content": "String (Required)",
  "image": "String (Optional URL/path)",
  "category": "String (Default: 'General')",
  "createdBy": "ObjectId (ref: 'User', Required)",
  "status": "String (enum: ['draft', 'pending', 'approved', 'rejected'], default: 'draft')",
  "createdAt": "Date (Default: Date.now)",
  "updatedAt": "Date"
}
```

---

## 📡 API Endpoints Reference

### 1. Authentication (`/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register a new user (`name`, `email`, `password`, `role`) |
| `POST` | `/auth/login` | Public | Log in with `email` and `password`, returns JWT token |
| `GET` | `/auth/me` | Authenticated | Get currently logged-in user profile details |

### 2. User — Post Management (`/posts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/posts` | Authenticated | Create a new post or draft (`status`: 'draft' or 'pending') |
| `GET` | `/posts` | Public | View all approved posts (supports `category` & `search` filters) |
| `GET` | `/posts/my-posts` | Authenticated | View all posts & drafts belonging to logged-in user |
| `GET` | `/posts/:id` | Public / Author | View approved post by ID (or own draft/pending if authenticated) |
| `PATCH` | `/posts/:id` | Author / Admin | Update post fields (title, content, description, category, status) |
| `DELETE` | `/posts/:id` | Author / Admin | Delete your own post |

### 3. Admin — Post Approval (`/admin`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/admin/posts/pending` | Admin Only | View all posts awaiting approval (`status: 'pending'`) |
| `PATCH` | `/admin/posts/approve/:id` | Admin Only | Approve a post (`status` becomes `'approved'`) |
| `PATCH` | `/admin/posts/reject/:id` | Admin Only | Reject a post (`status` becomes `'rejected'`) |

### 4. AI Integration (`/ai`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/ai/improve/:postId` | Author / Admin | Uses Gemini AI to polish content and saves as a new draft under the same user, preserving the original draft |

### 5. Media & Image Upload (`/upload`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/upload/image` | Authenticated | Uploads image to Cloudinary (multipart/form-data) and returns secure URL for posts |

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB Atlas** database URI or local MongoDB instance
- **Google Gemini API Key** (Free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd nodenovember-post-event-task

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (based on `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/akatsuki_draft?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=development
```

### 4. Run the Application
```bash
# Run in development mode with auto-reload
npm run dev

# Or run standard start
npm start
```
The server will start at: `http://localhost:5000`

### 5. Run Automated Tests
```bash
npm test
```

---

## 📬 Postman Testing Guide

1. Open **Postman**.
2. Click **Import** and select `postman_collection.json` from the project root.
3. The collection is pre-configured with:
   - Variable `baseUrl`: `http://localhost:5000`
   - **Automatic Token Management**: When you call `Register User` or `Login User`, the `userToken` variable is automatically saved. When you call `Register Admin` or `Login Admin`, the `adminToken` variable is automatically saved!
   - When you call `Create Post`, the created `postId` is automatically saved!
4. Simply execute requests in order:
   - `01. Authentication` -> `Register User` or `Login User`
   - `02. User - Post Management` -> `Create Post (Draft)` or `Create Post (Pending Approval)`
   - `03. Admin - Post Approval` -> `Login Admin` -> `View Pending Posts` -> `Approve Post`
   - `04. AI Integration` -> `Improve Content Using AI`

---

## 🌐 Deployment to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Akatsuki Draft backend"
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com/) and click **Add New Project**.
   - Import your GitHub repository.
   - In **Environment Variables**, add:
     - `MONGODB_URI`: Your MongoDB Atlas connection string (make sure Network Access allows `0.0.0.0/0`).
     - `JWT_SECRET`: A secure string for signing tokens.
     - `GEMINI_API_KEY`: Your Google Gemini API key.
   - Click **Deploy**!
   - Your API will be live on `https://<your-project>.vercel.app`.
   - Update `baseUrl` in Postman to test the live production endpoints!
