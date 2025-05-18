require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const TeamTask = require('./models/TeamTask');
const authMiddleware = require('./middlewares.js');

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI;
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('[DB] MongoDB connected'))
.catch(err => {
  console.error('[DB ERROR]', err);
  process.exit(1); // Stop server if DB connection fails
});


// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/profile', profileRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '../frontend/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'))
  );
}

// Example route in Node.js with Express
app.get('api/tasks/find', async (req, res) => {
  const { taskId } = req.query;
  try {
    const task = await TeamTask.findOne({ taskId });
    if (task) {
      return res.json({ task });
    }
    return res.status(404).json({ message: 'Task not found' });
  } catch (error) {
    console.error('Error finding task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Start the server
const PORT = process.env.PORT || 5080;
app.listen(PORT, () => {
  console.log("[SERVER] Backend is running");
});