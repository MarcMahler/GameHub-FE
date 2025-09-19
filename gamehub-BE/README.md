# GameHub Backend

Backend API for GameHub - A platform for simple games like tic-tac-toe, chess, etc.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)

## Installation

1. Navigate to the backend directory:
   ```bash
   cd gamehub-BE
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env` file and configure your MongoDB connection string
   - Default local MongoDB URI: `mongodb://localhost:27017/gamehub`

## Running the Server

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000` by default.

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

## Project Structure

```
gamehub-BE/
├── server.js          # Main server file
├── routes/            # API routes
├── models/            # MongoDB models
├── controllers/       # Route controllers
├── package.json       # Dependencies and scripts
├── .env              # Environment variables
└── .gitignore        # Git ignore rules
```

## Dependencies

- **express**: Web framework for Node.js
- **mongoose**: MongoDB ODM
- **mongodb**: MongoDB driver
- **cors**: CORS middleware
- **dotenv**: Environment variables loader
- **nodemon**: Development dependency for auto-restarting
