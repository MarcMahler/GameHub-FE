const mongoose = require('mongoose');
require('dotenv').config();

// Import models (you'll need to create these in your models folder)
const User = require('../models/User');
const Game = require('../models/Game');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    if (!this.isConnected) {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamehub';
      await mongoose.connect(MONGODB_URI);
      this.isConnected = true;
      console.log('Connected to MongoDB');
    }
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  // USER OPERATIONS
  async createUser(userData) {
    await this.connect();
    const user = new User(userData);
    await user.save();
    console.log('User created:', user);
    return user;
  }

  async getAllUsers() {
    await this.connect();
    const users = await User.find({});
    console.log('All users:', users);
    return users;
  }

  async getUserById(id) {
    await this.connect();
    const user = await User.findById(id);
    console.log('User found:', user);
    return user;
  }

  async updateUser(id, updates) {
    await this.connect();
    const user = await User.findByIdAndUpdate(id, updates, { new: true });
    console.log('User updated:', user);
    return user;
  }

  async deleteUser(id) {
    await this.connect();
    const result = await User.findByIdAndDelete(id);
    console.log('User deleted:', result);
    return result;
  }

  // GAME OPERATIONS
  async createGame(gameData) {
    await this.connect();
    const game = new Game(gameData);
    await game.save();
    console.log('Game created:', game);
    return game;
  }

  async getAllGames() {
    await this.connect();
    const games = await Game.find({}).populate('winner', 'username').populate('players.userId', 'username');
    console.log('All games:', games);
    return games;
  }

  async getGamesByType(gameType) {
    await this.connect();
    const games = await Game.find({ gameType }).populate('winner', 'username');
    console.log(`${gameType} games:`, games);
    return games;
  }

  async updateGame(id, updates) {
    await this.connect();
    const game = await Game.findByIdAndUpdate(id, updates, { new: true });
    console.log('Game updated:', game);
    return game;
  }

  async deleteGame(id) {
    await this.connect();
    const result = await Game.findByIdAndDelete(id);
    console.log('Game deleted:', result);
    return result;
  }

  // STATISTICS
  async getUserStats(userId) {
    await this.connect();
    const user = await User.findById(userId);
    const userGames = await Game.find({
      'players.userId': userId,
      status: 'completed'
    });
    
    const wins = await Game.countDocuments({ winner: userId });
    const totalGames = userGames.length;
    const losses = totalGames - wins;
    
    const stats = {
      user: user.username,
      totalGames,
      wins,
      losses,
      winRate: totalGames > 0 ? (wins / totalGames * 100).toFixed(1) + '%' : '0%'
    };
    
    console.log('User stats:', stats);
    return stats;
  }

  async getGameTypeStats() {
    await this.connect();
    const stats = await Game.aggregate([
      {
        $group: {
          _id: '$gameType',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          waiting: {
            $sum: { $cond: [{ $eq: ['$status', 'waiting'] }, 1, 0] }
          }
        }
      }
    ]);
    
    console.log('Game type statistics:', stats);
    return stats;
  }

  // UTILITY FUNCTIONS
  async clearDatabase() {
    await this.connect();
    await User.deleteMany({});
    await Game.deleteMany({});
    console.log('Database cleared!');
  }

  async dropDatabase() {
    await this.connect();
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped!');
  }
}

// Interactive CLI
async function runInteractiveCLI() {
  const db = new DatabaseManager();
  const readline = require('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
  }

  console.log('\n=== GameHub Database Manager ===');
  console.log('Available commands:');
  console.log('1. Create user');
  console.log('2. List all users');
  console.log('3. Create game');
  console.log('4. List all games');
  console.log('5. Get user stats');
  console.log('6. Get game type stats');
  console.log('7. Clear database');
  console.log('8. Exit');

  while (true) {
    const choice = await question('\nEnter your choice (1-8): ');

    try {
      switch (choice) {
        case '1':
          const username = await question('Username: ');
          const email = await question('Email: ');
          await db.createUser({ username, email });
          break;

        case '2':
          await db.getAllUsers();
          break;

        case '3':
          const gameType = await question('Game type (tictactoe/chess): ');
          const playerUsername = await question('Player username: ');
          const users = await db.getAllUsers();
          const player = users.find(u => u.username === playerUsername);
          if (player) {
            await db.createGame({
              gameType,
              players: [{ userId: player._id, username: player.username }],
              gameData: {}
            });
          } else {
            console.log('User not found!');
          }
          break;

        case '4':
          await db.getAllGames();
          break;

        case '5':
          const allUsers = await db.getAllUsers();
          if (allUsers.length > 0) {
            console.log('Available users:');
            allUsers.forEach((u, i) => console.log(`${i + 1}. ${u.username}`));
            const userChoice = await question('Select user number: ');
            const selectedUser = allUsers[parseInt(userChoice) - 1];
            if (selectedUser) {
              await db.getUserStats(selectedUser._id);
            }
          }
          break;

        case '6':
          await db.getGameTypeStats();
          break;

        case '7':
          const confirm = await question('Are you sure? (yes/no): ');
          if (confirm.toLowerCase() === 'yes') {
            await db.clearDatabase();
          }
          break;

        case '8':
          await db.disconnect();
          rl.close();
          return;

        default:
          console.log('Invalid choice!');
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
}

// Export for programmatic use
module.exports = DatabaseManager;

// Run CLI if this file is executed directly
if (require.main === module) {
  runInteractiveCLI().catch(console.error);
}
