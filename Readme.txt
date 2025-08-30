# IM FIIT - Multiplayer Fitness Battle Game

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher 
- Git

## Installation & Setup

1. **Clone and Navigate**
   ```bash
   git clone [your-repository-url]
   cd imfiit
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Setup Backend**
   ```bash
   cd imfiit-backend
   npm install
   ```

4. **Configure Backend Environment**
   
   Create `.env` file in `imfiit-backend/` folder:
   ```env
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your-jwt-secret-here
   JWT_EXPIRES_IN=7d
   BCRYPT_ROUNDS=12
   SESSION_SECRET=your-session-secret
   BATTLE_TURN_TIMEOUT=30000
   ROOM_CLEANUP_INTERVAL=300000
   MAX_ROOMS_PER_USER=5
   
   # Optional: Add MongoDB connection
   # MONGODB_URI=mongodb://localhost:27017/imfiit
   ```

5. **Start Backend Server**
   ```bash
   # From imfiit-backend directory
   npm start
   ```
   
   Backend runs on: `http://localhost:3001`

6. **Start Frontend (New Terminal)**
   ```bash
   # Navigate back to main project folder
   cd ..
   npm run dev
   ```
   
   Frontend runs on: `http://localhost:5173`

## Running the Application

1. **Backend Terminal:**
   ```bash
   cd imfiit-backend
   npm start
   ```

2. **Frontend Terminal:**
   ```bash
   cd imfiit  
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Available Scripts

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Commands  
```bash
npm start            # Start server
npm run dev          # Start with nodemon (auto-restart)
npm run lint         # Run ESLint
```

## Troubleshooting

- **Port 3001 in use:** Change `PORT=3002` in `.env` file
- **Port 5173 in use:** Frontend will auto-assign next available port  
- **Database errors:** System works without database - remove `MONGODB_URI` from `.env`
- **OCR processing slow:** First-time Tesseract.js download may take time
- **Module errors:** Delete `node_modules` and run `npm install` again