const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamehub';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');
const adminRoutes = require('./routes/admin');

app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/admin/database', adminRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'GameHub Backend API is running!',
    endpoints: {
      users: '/api/users',
      games: '/api/games',
      health: '/health'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
