# GameHub - Full Stack Application

A full-stack gaming platform featuring simple games like tic-tac-toe, chess, and more.

## Tech Stack
- **Frontend**: Next.js (React)
- **Backend**: Node.js with Express
- **Database**: MongoDB

## Prerequisites
- Node.js (v14 or higher)
- MongoDB installed locally
- npm or yarn

## Quick Start

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Start everything with one command
```bash
npm run dev
```

This will start:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 3000

## Individual Commands

If you prefer to run services individually:

### Start MongoDB only:
```bash
npm run dev:db
```

### Start Backend only:
```bash
npm run dev:backend
```

### Start Frontend only:
```bash
npm run dev:frontend
```

## Production

### Build and start for production:
```bash
npm run build
npm start
```

## Project Structure

```
GameHub-FE/
├── package.json           # Root package.json with orchestration scripts
├── mongodb-data/          # MongoDB data directory
├── gamehub-FE/           # Next.js frontend
│   ├── package.json
│   └── ...
└── gamehub-BE/           # Node.js backend
    ├── package.json
    └── ...
```

## URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: mongodb://localhost:27017/gamehub

## Troubleshooting

If MongoDB fails to start, make sure:
1. MongoDB is installed on your system
2. The `mongodb-data` directory exists and has proper permissions
3. Port 27017 is not already in use

For alternative MongoDB setup (if local installation issues), you can:
1. Use MongoDB Atlas (cloud)
2. Use Docker: `docker run -d -p 27017:27017 --name mongodb mongo`
