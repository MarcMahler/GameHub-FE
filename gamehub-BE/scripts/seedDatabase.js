const mongoose = require('mongoose');
require('dotenv').config();

// Sample User model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  gamesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

// Sample Game model
const GameSchema = new mongoose.Schema({
  gameType: { type: String, required: true }, // 'tictactoe', 'chess', etc.
  players: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String 
  }],
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gameData: { type: mongoose.Schema.Types.Mixed }, // Game-specific data
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});

const Game = mongoose.model('Game', GameSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamehub';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Game.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const users = await User.insertMany([
      {
        username: 'player1',
        email: 'player1@example.com',
        gamesPlayed: 15,
        wins: 8,
        losses: 7
      },
      {
        username: 'player2',
        email: 'player2@example.com',
        gamesPlayed: 12,
        wins: 6,
        losses: 6
      },
      {
        username: 'chessmaster',
        email: 'chess@example.com',
        gamesPlayed: 25,
        wins: 20,
        losses: 5
      },
      {
        username: 'tictactoe_pro',
        email: 'ttt@example.com',
        gamesPlayed: 30,
        wins: 18,
        losses: 12
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create sample games
    const games = await Game.insertMany([
      {
        gameType: 'tictactoe',
        players: [
          { userId: users[0]._id, username: users[0].username },
          { userId: users[1]._id, username: users[1].username }
        ],
        status: 'completed',
        winner: users[0]._id,
        gameData: {
          board: ['X', 'O', 'X', 'O', 'X', 'O', 'X', '', ''],
          moves: 7
        },
        completedAt: new Date()
      },
      {
        gameType: 'chess',
        players: [
          { userId: users[2]._id, username: users[2].username },
          { userId: users[1]._id, username: users[1].username }
        ],
        status: 'active',
        gameData: {
          board: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR', // FEN notation
          currentTurn: 'black',
          moveCount: 1
        }
      },
      {
        gameType: 'tictactoe',
        players: [
          { userId: users[3]._id, username: users[3].username }
        ],
        status: 'waiting',
        gameData: {
          board: ['', '', '', '', '', '', '', '', ''],
          moves: 0
        }
      }
    ]);

    console.log(`Created ${games.length} games`);

    // Display created data
    console.log('\n=== USERS ===');
    const allUsers = await User.find({});
    allUsers.forEach(user => {
      console.log(`${user.username} (${user.email}) - Games: ${user.gamesPlayed}, W/L: ${user.wins}/${user.losses}`);
    });

    console.log('\n=== GAMES ===');
    const allGames = await Game.find({}).populate('winner', 'username');
    allGames.forEach(game => {
      console.log(`${game.gameType} - Status: ${game.status} - Players: ${game.players.length} - Winner: ${game.winner ? game.winner.username : 'None'}`);
    });

    console.log('\nDatabase seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the seeding function
seedDatabase();
