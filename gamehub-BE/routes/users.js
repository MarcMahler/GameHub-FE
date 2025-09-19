const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'User with this email or username already exists' 
      });
    }

    const user = new User({ username, email, password });
    await user.save();
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { username, email, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, avatar, lastActive: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id/stats - Get user statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const Game = require('../models/Game');
    
    // Get user's games
    const userGames = await Game.find({
      'players.userId': req.params.id,
      status: 'completed'
    });

    const wins = await Game.countDocuments({ winner: req.params.id });
    const totalGames = userGames.length;
    const losses = totalGames - wins - user.draws;
    
    const stats = {
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar
      },
      totalGames,
      wins,
      losses,
      draws: user.draws,
      winRate: totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0,
      gameTypeStats: {
        tictactoe: user.tictactoeStats,
        chess: user.chessStats
      },
      recentGames: userGames.slice(-5) // Last 5 games
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
