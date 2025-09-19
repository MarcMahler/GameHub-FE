const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: false, // For now, we'll add authentication later
    minlength: 6
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  // Game statistics
  gamesPlayed: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  // Game-specific stats
  tictactoeStats: {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 }
  },
  chessStats: {
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    rating: { type: Number, default: 1200 }
  }
});

// Virtual for win rate
UserSchema.virtual('winRate').get(function() {
  if (this.gamesPlayed === 0) return 0;
  return ((this.wins / this.gamesPlayed) * 100).toFixed(1);
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);
