# MongoDB Database Access Guide for GameHub

This guide shows you multiple ways to access and manipulate your MongoDB database for the GameHub project.

## 🚀 Quick Start

### 1. Start your stack:
```bash
npm run dev
```

### 2. Seed the database with sample data:
```bash
cd gamehub-BE
npm run seed
```

## 📊 Database Access Methods

### Method 1: Interactive Database Manager (Recommended for beginners)
```bash
cd gamehub-BE
npm run db:manage
```

This opens an interactive CLI where you can:
- Create users and games
- View all data
- Get statistics
- Clear database
- And more!

### Method 2: HTTP API Endpoints (Best for frontend integration)

Your backend server provides REST API endpoints:

**Users:**
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get specific user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/stats` - Get user statistics

**Games:**
- `GET /api/games` - Get all games
- `POST /api/games` - Create new game
- `POST /api/games/:id/join` - Join a game
- `POST /api/games/:id/move` - Make a move
- `PUT /api/games/:id/end` - End a game
- `GET /api/games/stats` - Get game statistics

### Method 3: Direct Database Scripts

**Seed database:**
```bash
cd gamehub-BE
npm run seed
```

**Clear database:**
```bash
cd gamehub-BE
npm run db:clear
```

**Custom script:**
```javascript
// Create your own script in gamehub-BE/scripts/
const DatabaseManager = require('./dbManager');
const db = new DatabaseManager();

async function myCustomOperation() {
  await db.connect();
  
  // Your custom database operations here
  const users = await db.getAllUsers();
  console.log(users);
  
  await db.disconnect();
}

myCustomOperation();
```

## 🔧 API Usage Examples

### Using curl to test your API:

**Create a user:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username": "newplayer", "email": "player@example.com"}'
```

**Get all users:**
```bash
curl http://localhost:5000/api/users
```

**Create a game:**
```bash
curl -X POST http://localhost:5000/api/games \
  -H "Content-Type: application/json" \
  -d '{"gameType": "tictactoe", "userId": "USER_ID_HERE", "username": "newplayer"}'
```

**Get all games:**
```bash
curl http://localhost:5000/api/games
```

### Using JavaScript fetch (for frontend):

```javascript
// Create a user
const createUser = async (username, email) => {
  const response = await fetch('http://localhost:5000/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email })
  });
  return response.json();
};

// Get user stats
const getUserStats = async (userId) => {
  const response = await fetch(`http://localhost:5000/api/users/${userId}/stats`);
  return response.json();
};

// Create a game
const createGame = async (gameType, userId, username) => {
  const response = await fetch('http://localhost:5000/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameType, userId, username })
  });
  return response.json();
};
```

## 🏗️ Database Structure

### Users Collection:
```json
{
  "_id": "ObjectId",
  "username": "string",
  "email": "string", 
  "createdAt": "Date",
  "gamesPlayed": "Number",
  "wins": "Number",
  "losses": "Number",
  "draws": "Number",
  "tictactoeStats": {
    "played": "Number",
    "won": "Number", 
    "lost": "Number"
  },
  "chessStats": {
    "played": "Number",
    "won": "Number",
    "lost": "Number",
    "rating": "Number"
  }
}
```

### Games Collection:
```json
{
  "_id": "ObjectId",
  "gameType": "string", // 'tictactoe', 'chess', etc.
  "players": [
    {
      "userId": "ObjectId",
      "username": "string",
      "color": "string" // 'x', 'o', 'white', 'black'
    }
  ],
  "status": "string", // 'waiting', 'active', 'completed'
  "winner": "ObjectId",
  "isDraw": "Boolean",
  "gameData": {
    "board": "Mixed", // Game board state
    "currentTurn": "string",
    "moveHistory": "Array",
    "moveCount": "Number"
  },
  "createdAt": "Date",
  "completedAt": "Date"
}
```

## 🛠️ MongoDB Tools Installation (Optional)

If you want to use MongoDB shell or Compass:

**Install MongoDB Shell:**
```bash
# macOS
brew install mongosh

# Or download from: https://www.mongodb.com/try/download/shell
```

**Install MongoDB Compass (GUI):**
Download from: https://www.mongodb.com/try/download/compass

**Connect with MongoDB shell:**
```bash
mongosh "mongodb://localhost:27017/gamehub"
```

**MongoDB shell commands:**
```javascript
// Show all collections
show collections

// Find all users
db.users.find()

// Find all games
db.games.find()

// Find games by type
db.games.find({gameType: "tictactoe"})

// Count documents
db.users.countDocuments()

// Delete all users (be careful!)
db.users.deleteMany({})
```

## 🔍 Monitoring and Debugging

**Check database connection:**
```bash
curl http://localhost:5000/health
```

**View database in MongoDB Compass:**
- Connection string: `mongodb://localhost:27017`
- Database: `gamehub`

**Check logs:**
Your server logs will show all database operations when running in development mode.

## 📱 Next Steps

1. **Frontend Integration**: Use the API endpoints in your Next.js frontend
2. **Real-time Updates**: Add Socket.io for live game updates
3. **Authentication**: Add user login/signup functionality
4. **Game Logic**: Implement specific game rules and validation
5. **Deployment**: Deploy to MongoDB Atlas for production

## 🆘 Troubleshooting

**MongoDB not starting?**
- Make sure MongoDB is installed: `brew install mongodb-community`
- Check if port 27017 is available: `lsof -i :27017`
- Check the mongodb-data directory permissions

**API not working?**
- Ensure backend server is running: `npm run dev` in gamehub-BE
- Check server logs for errors
- Verify MongoDB connection in `/health` endpoint

**Database connection issues?**
- Check your `.env` file in gamehub-BE
- Verify MONGODB_URI is correct
- Ensure MongoDB service is running
