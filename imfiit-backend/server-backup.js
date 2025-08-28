// server.js - Main IM FIIT Backend Server
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import managers and routes
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

// Security headers
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

// Compression
app.use(compression());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
      socket.to(roomId).emit('player:joined', {
        userId: socket.userId,
        profile: socket.userProfile
      });
      logger.info(`User ${socket.userId} joined room ${roomId}`);
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Room join failed:', error);
    }
  });

  socket.on('room:leave', async () => {
    try {
      const rooms = Array.from(socket.rooms);
      for (const roomId of rooms) {
        if (roomId !== socket.id) {
          await roomManager.leaveRoom(roomId, socket.userId);
          socket.leave(roomId);
          socket.to(roomId).emit('player:left', socket.userId);
        }
      }
      logger.info(`User ${socket.userId} left all rooms`);
    } catch (error) {
      logger.error('Room leave failed:', error);
    }
  });

  socket.on('room:ready', async (roomId) => {
    try {
      const room = await roomManager.setPlayerReady(roomId, socket.userId);
      io.to(roomId).emit('room:updated', room);
      
      // Start battle if both players ready
      if (room.status === 'ready') {
        const battle = await battleManager.startBattle(room);
        io.to(roomId).emit('battle:started', battle);
      }
      logger.info(`User ${socket.userId} ready in room ${roomId}`);
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Player ready failed:', error);
    }
  });

  // Battle events
  socket.on('battle:action', async (action) => {
    try {
      const result = await battleManager.processAction(action, socket.userId);
      const roomId = result.roomId;
      
      // Broadcast action result to all players in room
      io.to(roomId).emit('battle:turn', result);
      
      // Check if battle ended
      if (result.battleEnded) {
        const finalResult = await battleManager.endBattle(result.battleId, result.winner);
        io.to(roomId).emit('battle:ended', finalResult);
        
        // Update user stats
        await userManager.updateUserStats(result.winner, finalResult.winnerGains);
        if (result.loser) {
          await userManager.updateUserStats(result.loser, finalResult.loserGains);
        }
      }
      
      logger.info(`Battle action processed: ${action.action} by ${socket.userId}`);
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Battle action failed:', error);
    }
  });

  // Chat events
  socket.on('chat:message', (data) => {
    const rooms = Array.from(socket.rooms);
    for (const roomId of rooms) {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('chat:message', {
          userId: socket.userId,
          username: socket.userProfile?.telegramUser?.first_name || 'Unknown',
          message: data.message,
          timestamp: new Date()
        });
      }
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.userId}`, {
      socketId: socket.id,
      userId: socket.userId
    });
    
    userManager.unregisterUser(socket.userId);
    
    // Leave all rooms
    const rooms = Array.from(socket.rooms);
    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('player:left', socket.userId);
        roomManager.leaveRoom(roomId, socket.userId).catch(err => {
          logger.error('Error leaving room on disconnect:', err);
        });
      }
    });
  });
});

// ============================================================================
// REST API ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// User routes
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

// Battle history
app.get('/api/users/:userId/battles', async (req, res) => {
  try {
    const battles = await battleManager.getUserBattles(req.params.userId);
    res.json(battles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await userManager.getLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Room list
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await roomManager.getPublicRooms();
    res.json(rooms);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Workout upload
app.post('/api/users/:userId/workout', async (req, res) => {
  try {
    const result = await userManager.processWorkout(req.params.userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`🚀 IM FIIT Backend Server running on port ${PORT}`);
  logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  logger.info(`🎮 Socket.IO ready for multiplayer battles`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;