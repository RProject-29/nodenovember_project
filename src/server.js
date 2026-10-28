require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start listening
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`=============================================`);
      console.log(` Akatsuki's Draft Backend is running!`);
      console.log(` Port: ${PORT}`);
      console.log(` URL: http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=============================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  });
