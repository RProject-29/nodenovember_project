require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/db');

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Serverless DB connection error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to the database in serverless environment.',
      error: error.message,
    });
  }
};
