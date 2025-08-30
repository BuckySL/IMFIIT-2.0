import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';

// Import managers (keep your existing imports)
import { BattleManager } from './src/managers/BattleManager.js';
import { GameRoomManager } from './src/managers/GameRoomManager.js';
import { UserManager } from './src/managers/UserManager.js';
import { authMiddleware } from './src/middleware/auth.js';
import { logger } from './src/utils/logger.js';

// ES modules setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// ============================================================================
// MIDDLEWARE & SECURITY
// ============================================================================

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let dbConnected = false;

const connectDatabase = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      console.log('⚠️ No MONGODB_URI provided, running without database');
      return false;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    dbConnected = true;
    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name || 'default'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// ============================================================================
// SOCKET.IO SETUP
// ============================================================================

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Initialize managers
const battleManager = new BattleManager(io);
const roomManager = new GameRoomManager(io);
const userManager = new UserManager();

// ============================================================================
// API ROUTES - THIS FIXES THE 404 ERRORS
// ============================================================================

// Health check (existing)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ============================================================================
// AUTH ROUTES - MISSING IN YOUR ORIGINAL
// ============================================================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { telegramUser } = req.body;
    
    if (!telegramUser) {
      return res.status(400).json({ error: 'Telegram user data required' });
    }

    // Create or get user
    const user = await userManager.createOrGetUser(telegramUser);
    
    res.json({ 
      success: true, 
      user,
      message: 'Logged in successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ============================================================================
// USER ROUTES (existing but enhanced)
// ============================================================================

app.get('/api/users/:userId/profile', async (req, res) => {
  try {
    const profile = await userManager.getUserProfile(req.params.userId);
    res.json(profile);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const profile = await userManager.updateUserProfile(req.params.userId, req.body);
    res.json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Workout upload (existing but enhanced)
app.post('/api/users/:userId/workout', async (req, res) => {
  try {
    const result = await userManager.processWorkout(req.params.userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Battle history (existing)
app.get('/api/users/:userId/battles', async (req, res) => {
  try {
    const battles = await battleManager.getUserBattles(req.params.userId);
    res.json(battles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// AI TRAINER ROUTES - MISSING IN YOUR ORIGINAL
// ============================================================================

// Get all trainers
app.get('/api/ai-trainers', async (req, res) => {
  try {
    // Mock trainers for now - replace with actual service
    const mockTrainers = [
      {
        id: 'trainer-1',
        name: 'Coach Mike',
        specialty: 'Strength Training',
        personality: 'Motivational',
        experience: 'Expert',
        avatar: '🏋️‍♂️',
        description: 'Focuses on building muscle and strength',
        stats: { strength: 95, endurance: 80, intelligence: 85 }
      },
      {
        id: 'trainer-2', 
        name: 'Trainer Sarah',
        specialty: 'Cardio',
        personality: 'Encouraging',
        experience: 'Advanced',
        avatar: '🏃‍♀️',
        description: 'Expert in cardiovascular fitness',
        stats: { strength: 70, endurance: 95, intelligence: 88 }
      }
    ];
    
    res.json({
      success: true,
      trainers: mockTrainers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific trainer
app.get('/api/ai-trainers/:id', async (req, res) => {
  try {
    // Mock response - replace with actual service
    const mockTrainer = {
      id: req.params.id,
      name: 'Coach Mike',
      specialty: 'Strength Training',
      personality: 'Motivational',
      experience: 'Expert',
      avatar: '🏋️‍♂️',
      description: 'Focuses on building muscle and strength',
      stats: { strength: 95, endurance: 80, intelligence: 85 }
    };
    
    res.json({
      success: true,
      trainer: mockTrainer
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat with trainer
app.post('/api/ai-trainers/chat', async (req, res) => {
  try {
    const { trainerId, message, userId } = req.body;
    
    if (!trainerId || !message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID, message, and user ID are required'
      });
    }

    // Mock response - replace with actual AI service
    const mockResponse = {
      success: true,
      chat: {
        trainerName: 'Coach Mike',
        trainerAvatar: '🏋️‍♂️',
        userMessage: message,
        trainerResponse: "Great question! Keep pushing yourself and you'll see amazing results! 💪",
        timestamp: new Date().toISOString()
      }
    };
    
    res.json(mockResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GAME/BATTLE ROUTES (existing but enhanced)
// ============================================================================

// Leaderboard (existing)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await userManager.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Room list (existing)
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await roomManager.getPublicRooms();
    res.json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create room
app.post('/api/rooms', async (req, res) => {
  try {
    const { userId, config } = req.body;
    const room = await roomManager.createRoom(userId, config);
    res.json({ success: true, room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join room
app.post('/api/rooms/:roomId/join', async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await roomManager.joinRoom(req.params.roomId, userId);
    res.json({ success: true, room });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// FILE UPLOAD ROUTES - MISSING IN YOUR ORIGINAL
// ============================================================================

app.post('/api/upload/workout-image', async (req, res) => {
  try {
    // Handle image upload - implement based on your needs
    const { image, userId } = req.body;
    
    // Mock response for now
    res.json({
      success: true,
      imageUrl: '/uploads/workout-' + Date.now() + '.jpg',
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// SOCKET.IO CONNECTION HANDLING
// ============================================================================

io.use(authMiddleware);

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`, {
    socketId: socket.id,
    userId: socket.userId
  });

  // Register user
  userManager.registerUser(socket.userId, socket);

  // Room events
  socket.on('room:create', async (config) => {
    try {
      const room = await roomManager.createRoom(socket.userId, config);
      socket.join(room.id);
      socket.emit('room:created', room);
      logger.info(`Room created: ${room.id} by user ${socket.userId}`);
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Room creation failed:', error);
    }
  });

  socket.on('room:join', async (roomId) => {
    try {
      const room = await roomManager.joinRoom(roomId, socket.userId);
      socket.join(roomId);
      socket.emit('room:joined', room);
      socket.to(roomId).emit('player:joined', { userId: socket.userId });
      logger.info(`User ${socket.userId} joined room ${roomId}`);
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Room join failed:', error);
    }
  });

  // Battle events
  socket.on('battle:start', async (config, callback) => {
    try {
      const battle = await battleManager.startBattle(socket.userId, config);
      callback({ success: true, battle });
      logger.info(`Battle started: ${battle.id}`);
    } catch (error) {
      callback({ error: error.message });
      logger.error('Battle start failed:', error);
    }
  });

  socket.on('battle:action', async ({ battleId, action }, callback) => {
    try {
      const result = await battleManager.processBattleAction(battleId, socket.userId, action);
      callback({ success: true, result });
      
      // Broadcast to battle participants
      io.to(`battle_${battleId}`).emit('battle:update', result);
    } catch (error) {
      callback({ error: error.message });
      logger.error('Battle action failed:', error);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.userId}`);
    userManager.unregisterUser(socket.userId);
  });
});

// ============================================================================
// ERROR HANDLING - CRITICAL FOR DEBUGGING
// ============================================================================

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler with detailed logging
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/users/:userId/profile',
      'POST /api/users/:userId/workout',
      'GET /api/ai-trainers',
      'POST /api/ai-trainers/chat',
      'GET /api/rooms',
      'POST /api/rooms',
      'GET /api/leaderboard'
    ]
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001;

// Connect to database first, then start server
connectDatabase().then((connected) => {
  server.listen(PORT, () => {
    console.log(`🚀 IM FIIT Backend Server running on port ${PORT}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`💾 Database: ${connected ? 'Connected' : 'Disconnected'}`);
    console.log(`🎮 Socket.IO ready for multiplayer battles`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Available routes:`);
    console.log(`   GET /api/health`);
    console.log(`   POST /api/auth/login`);
    console.log(`   GET /api/users/:userId/profile`);
    console.log(`   POST /api/users/:userId/workout`);
    console.log(`   GET /api/ai-trainers`);
    console.log(`   POST /api/ai-trainers/chat`);
    console.log(`   GET /api/rooms`);
    console.log(`   POST /api/rooms`);
    console.log(`   GET /api/leaderboard`);
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (dbConnected) {
    await mongoose.connection.close();
  }
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (dbConnected) {
    await mongoose.connection.close();
  }
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;