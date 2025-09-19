const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  gameType: {
    type: String,
    required: true,
    enum: ['tictactoe', 'chess', 'checkers', 'connect4'],
    lowercase: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    color: {
      type: String, // For games like chess: 'white', 'black'
      enum: ['white', 'black', 'red', 'yellow', 'x', 'o', '']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isDraw: {
    type: Boolean,
    default: false
  },
  gameData: {
    // This will store game-specific data
    board: mongoose.Schema.Types.Mixed, // Board state
    currentTurn: String, // Which player's turn
    moveHistory: [mongoose.Schema.Types.Mixed], // All moves made
    moveCount: { type: Number, default: 0 },
    timeControl: {
      type: { type: String, enum: ['blitz', 'rapid', 'classical', 'unlimited'] },
      timeLimit: Number, // in seconds
      increment: Number // increment per move in seconds
    },
    playerTimes: {
      player1: Number, // remaining time in seconds
      player2: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  lastMoveAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
GameSchema.index({ status: 1 });
GameSchema.index({ gameType: 1, status: 1 });
GameSchema.index({ 'players.userId': 1 });
GameSchema.index({ createdAt: -1 });

// Virtual for game duration
GameSchema.virtual('duration').get(function() {
  if (!this.completedAt || !this.startedAt) return null;
  return Math.round((this.completedAt - this.startedAt) / 1000); // in seconds
});

// Method to add a player to the game
GameSchema.methods.addPlayer = function(userId, username, color = '') {
  if (this.players.length >= 2) {
    throw new Error('Game is full');
  }
  
  this.players.push({
    userId,
    username,
    color,
    joinedAt: new Date()
  });
  
  // Start the game if we have 2 players
  if (this.players.length === 2 && this.status === 'waiting') {
    this.status = 'active';
    this.startedAt = new Date();
  }
  
  return this.save();
};

// Method to make a move
GameSchema.methods.makeMove = function(playerId, moveData) {
  if (this.status !== 'active') {
    throw new Error('Game is not active');
  }
  
  // Add move to history
  if (!this.gameData.moveHistory) {
    this.gameData.moveHistory = [];
  }
  
  this.gameData.moveHistory.push({
    playerId,
    move: moveData,
    timestamp: new Date(),
    moveNumber: this.gameData.moveCount + 1
  });
  
  this.gameData.moveCount += 1;
  this.lastMoveAt = new Date();
  
  return this.save();
};

// Method to end the game
GameSchema.methods.endGame = function(winnerId = null, isDraw = false) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.winner = winnerId;
  this.isDraw = isDraw;
  
  return this.save();
};

// Ensure virtual fields are serialized
GameSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Game', GameSchema);
