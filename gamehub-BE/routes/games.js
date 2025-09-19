const express = require('express');
const router = express.Router();
const Game = require('../models/Game');
const User = require('../models/User');

// GET /api/games - Get all games
router.get('/', async (req, res) => {
  try {
    const { status, gameType, userId } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (gameType) filter.gameType = gameType;
    if (userId) filter['players.userId'] = userId;
    
    const games = await Game.find(filter)
      .populate('winner', 'username avatar')
      .populate('players.userId', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/games - Create a new game
router.post('/', async (req, res) => {
  try {
    const { gameType, userId, username, timeControl } = req.body;
    
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const gameData = {
      board: getInitialBoard(gameType),
      currentTurn: gameType === 'chess' ? 'white' : 'x',
      moveHistory: [],
      moveCount: 0
    };

    if (timeControl) {
      gameData.timeControl = timeControl;
      gameData.playerTimes = {
        player1: timeControl.timeLimit,
        player2: timeControl.timeLimit
      };
    }

    const game = new Game({
      gameType,
      players: [{
        userId,
        username: user.username,
        color: gameType === 'chess' ? 'white' : 'x'
      }],
      gameData
    });

    await game.save();
    await game.populate('players.userId', 'username avatar');
    
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/games/:id/join - Join a game
router.post('/:id/join', async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not waiting for players' });
    }

    if (game.players.length >= 2) {
      return res.status(400).json({ error: 'Game is full' });
    }

    // Check if user is already in the game
    if (game.players.some(p => p.userId.toString() === userId)) {
      return res.status(400).json({ error: 'User already in this game' });
    }

    const color = game.gameType === 'chess' ? 'black' : 'o';
    await game.addPlayer(userId, user.username, color);
    await game.populate('players.userId', 'username avatar');
    
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/games/:id/move - Make a move
router.post('/:id/move', async (req, res) => {
  try {
    const { userId, move } = req.body;
    
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    // Verify it's the player's turn
    const playerIndex = game.players.findIndex(p => p.userId.toString() === userId);
    if (playerIndex === -1) {
      return res.status(400).json({ error: 'User not in this game' });
    }

    await game.makeMove(userId, move);
    
    // Check for game end conditions (you'll implement game-specific logic)
    // For now, just update the turn
    updateGameState(game, move);
    
    await game.save();
    await game.populate('players.userId', 'username avatar');
    
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/games/:id/end - End a game
router.put('/:id/end', async (req, res) => {
  try {
    const { winnerId, isDraw } = req.body;
    
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    await game.endGame(winnerId, isDraw);
    
    // Update user statistics
    await updateUserStats(game);
    
    await game.populate('winner', 'username avatar');
    await game.populate('players.userId', 'username avatar');
    
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/games/stats - Get game statistics
router.get('/stats', async (req, res) => {
  try {
    const totalGames = await Game.countDocuments();
    const activeGames = await Game.countDocuments({ status: 'active' });
    const waitingGames = await Game.countDocuments({ status: 'waiting' });
    
    const gameTypeStats = await Game.aggregate([
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

    res.json({
      totalGames,
      activeGames,
      waitingGames,
      gameTypeStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper functions
function getInitialBoard(gameType) {
  switch (gameType) {
    case 'tictactoe':
      return ['', '', '', '', '', '', '', '', ''];
    case 'chess':
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'; // FEN notation
    case 'checkers':
      return Array(64).fill('').map((_, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        if ((row + col) % 2 === 1) {
          if (row < 3) return 'b'; // black pieces
          if (row > 4) return 'r'; // red pieces
        }
        return '';
      });
    default:
      return [];
  }
}

function updateGameState(game, move) {
  // This is where you'd implement game-specific logic
  // For now, just toggle the turn
  if (game.gameType === 'tictactoe') {
    game.gameData.currentTurn = game.gameData.currentTurn === 'x' ? 'o' : 'x';
  } else if (game.gameType === 'chess') {
    game.gameData.currentTurn = game.gameData.currentTurn === 'white' ? 'black' : 'white';
  }
}

async function updateUserStats(game) {
  // Update statistics for both players
  for (const player of game.players) {
    const user = await User.findById(player.userId);
    if (user) {
      user.gamesPlayed += 1;
      
      if (game.isDraw) {
        user.draws += 1;
      } else if (game.winner && game.winner.toString() === player.userId.toString()) {
        user.wins += 1;
      } else {
        user.losses += 1;
      }

      // Update game-specific stats
      if (game.gameType === 'tictactoe') {
        user.tictactoeStats.played += 1;
        if (game.winner && game.winner.toString() === player.userId.toString()) {
          user.tictactoeStats.won += 1;
        } else if (!game.isDraw) {
          user.tictactoeStats.lost += 1;
        }
      } else if (game.gameType === 'chess') {
        user.chessStats.played += 1;
        if (game.winner && game.winner.toString() === player.userId.toString()) {
          user.chessStats.won += 1;
        } else if (!game.isDraw) {
          user.chessStats.lost += 1;
        }
      }

      await user.save();
    }
  }
}

module.exports = router;
