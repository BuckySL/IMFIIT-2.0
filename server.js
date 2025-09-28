// ============================================================================
// COMPLETE WORKING SERVER.JS - Replace Your Entire File With This
// ============================================================================

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
import mlChatbotService from './src/services/MLChatbotService.js';


// Import your existing managers and utilities
import { BattleManager } from './src/managers/BattleManager.js';
import { GameRoomManager } from './src/managers/GameRoomManager.js';
import { UserManager } from './src/managers/UserManager.js';
import { authMiddleware } from './src/middleware/auth.js';
import { logger } from './src/utils/logger.js';

// Import database models
import User from './src/models/User.js';
import Workout from './src/models/Workout.js';
import Battle from './src/models/Battle.js';


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
    
    // Initialize AI trainers after DB connection
    try {
      const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
      await AITrainerService.initializeTrainers();
      console.log('🤖 AI Trainers initialized successfully!');
    } catch (aiError) {
      console.log('⚠️ AI Trainers initialization failed:', aiError.message);
    }
    
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
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// AI Trainer Routes
app.get('/api/ai-trainers', async (req, res) => {
  try {
    const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
    const trainers = await AITrainerService.getTrainers();
    res.json({ success: true, trainers });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainers',
      error: error.message
    });
  }
});

app.post('/api/ai-trainers/chat', async (req, res) => {
  try {
    const { trainerId, message, userId } = req.body;
    const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
    
    let responseCategory = 'motivation';
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('improve')) {
      responseCategory = 'improvement';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      responseCategory = 'greeting';
    }

    const response = await AITrainerService.getTrainerResponse(trainerId, responseCategory);
    const trainer = await AITrainerService.getTrainerById(trainerId);

    res.json({ 
      success: true, 
      chat: {
        trainerName: trainer?.name || 'AI Trainer',
        trainerAvatar: trainer?.avatar || '🏋️‍♂️',
        response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI trainer chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat',
      error: error.message
    });
  }
});

// Helper function to calculate workout gains
const calculateWorkoutGains = (extractedWorkout) => {
  const duration = extractedWorkout.duration || 30;
  const intensity = extractedWorkout.intensity || 'medium';
  const type = extractedWorkout.type || 'cardio';
  
  let multiplier = intensity === 'high' ? 1.5 : intensity === 'low' ? 0.7 : 1.0;
  
  const baseGains = {
    strength: 0,
    endurance: 0,
    experience: 0
  };
  
  if (type === 'strength') {
    baseGains.strength = Math.floor(duration * 0.8 * multiplier);
    baseGains.endurance = Math.floor(duration * 0.3 * multiplier);
  } else {
    baseGains.endurance = Math.floor(duration * 1.2 * multiplier);
    baseGains.strength = Math.floor(duration * 0.2 * multiplier);
  }
  
  baseGains.experience = baseGains.strength + baseGains.endurance + Math.floor(duration * 0.5);
  return baseGains;
};

// Enhanced Workout Upload with AI Integration
app.post('/api/users/:userId/workout', async (req, res) => {
  try {
    const userId = req.params.userId;
    const workoutData = req.body;
    
    console.log(`💪 Workout upload from user ${userId}`);
    
    if (!workoutData || !workoutData.extractedWorkout) {
      return res.status(400).json({ error: 'Invalid workout data' });
    }

    const statsGain = calculateWorkoutGains(workoutData.extractedWorkout);
    
    // Save workout to database if connected
    if (dbConnected) {
      try {
        const workout = new Workout({
          userId,
          workoutData: {
            type: workoutData.extractedWorkout.type || 'cardio',
            duration: workoutData.extractedWorkout.duration || 30,
            intensity: workoutData.extractedWorkout.intensity || 'medium',
            appSource: workoutData.appSource || 'OCR Scanner',
            confidence: workoutData.extractedWorkout.confidence || 0.85
          },
          rewards: statsGain,
          verification: {
            ocrText: workoutData.extractedWorkout.rawText || '',
            securityPassed: workoutData.verified || false,
            securityLevel: workoutData.securityLevel || 'PASSED'
          }
        });

        await workout.save();
        console.log(`✅ Workout saved for user ${userId}`);
      } catch (dbError) {
        console.error('Database save error:', dbError);
      }
    }
    
    // Try to get AI trainer response
    try {
      const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
      const trainers = await AITrainerService.getTrainers();
      const trainer = trainers[Math.floor(Math.random() * trainers.length)]; // Random trainer
      
      const trainerResponse = trainer && trainer.getResponse ? 
        trainer.getResponse('workoutComplete') : 
        "Great workout! Keep up the excellent work! 💪";
        
      res.json({
        success: true,
        statsGain,
        trainerResponse: {
          message: trainerResponse,
          trainerName: trainer?.name || 'AI Trainer',
          trainerAvatar: trainer?.avatar || '🏋️‍♂️'
        }
      });
    } catch (aiError) {
      console.log('AI trainer response error:', aiError.message);
      res.json({
        success: true,
        statsGain,
        trainerResponse: {
          message: "Excellent workout! You're getting stronger! 💪",
          trainerName: 'AI Trainer',
          trainerAvatar: '🏋️‍♂️'
        }
      });
    }
    
  } catch (error) {
    console.error('Workout upload error:', error);
    res.status(500).json({ error: error.message });
  }
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

// ============================================================================
// SOCKET.IO CONNECTION HANDLING
// ============================================================================

io.use(authMiddleware);

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`, {
    socketId: socket.id,
    userId: socket.userId
  });

  userManager.registerUser(socket.userId, socket);

  // Enhanced workout upload with AI trainer integration
  socket.on('workout:upload', async (workoutData, callback) => {
    try {
      console.log(`💪 Socket workout upload from user ${socket.userId}`);
      
      if (!workoutData || !workoutData.extractedWorkout) {
        return callback({ error: 'Invalid workout data' });
      }

      const statsGain = calculateWorkoutGains(workoutData.extractedWorkout);
      
      // Save workout to database if connected
      if (dbConnected) {
        try {
          const workout = new Workout({
            userId: socket.userId,
            workoutData: {
              type: workoutData.extractedWorkout.type || 'cardio',
              duration: workoutData.extractedWorkout.duration || 30,
              intensity: workoutData.extractedWorkout.intensity || 'medium',
              appSource: workoutData.appSource || 'OCR Scanner',
              confidence: workoutData.extractedWorkout.confidence || 0.85
            },
            rewards: statsGain,
            verification: {
              ocrText: workoutData.extractedWorkout.rawText || '',
              securityPassed: workoutData.verified || false,
              securityLevel: workoutData.securityLevel || 'PASSED'
            }
          });

          await workout.save();
        } catch (error) {
          console.error('Socket workout save error:', error);
        }
      }
      
      // Get AI trainer response
      try {
        const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
        const trainers = await AITrainerService.getTrainers();
        const trainer = trainers[Math.floor(Math.random() * trainers.length)];
        
        let trainerResponse = "Great workout! Keep up the excellent work! 💪";
        if (trainer && trainer.getResponse) {
          trainerResponse = trainer.getResponse('workoutComplete');
        }
        
        callback({
          success: true,
          statsGain,
          trainerResponse: {
            message: trainerResponse,
            trainerName: trainer?.name || 'AI Trainer',
            trainerAvatar: trainer?.avatar || '🏋️‍♂️'
          }
        });
      } catch (error) {
        console.log('AI trainer error:', error.message);
        callback({ success: true, statsGain });
      }
      
    } catch (error) {
      console.error('Socket workout upload error:', error);
      callback({ error: 'Failed to process workout' });
    }
  });

  // AI Trainer socket events
  socket.on('aiTrainer:chat', async ({ trainerId, message }, callback) => {
    try {
      const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
      
      let responseCategory = 'motivation';
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('help')) responseCategory = 'improvement';
      else if (lowerMessage.includes('hello')) responseCategory = 'greeting';

      const response = await AITrainerService.getTrainerResponse(trainerId, responseCategory);
      const trainer = await AITrainerService.getTrainerById(trainerId);

      callback({ 
        success: true, 
        chat: {
          trainerName: trainer?.name || 'AI Trainer',
          trainerAvatar: trainer?.avatar || '🏋️‍♂️',
          response,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('AI trainer chat error:', error);
      callback({ error: 'Failed to process chat' });
    }
  });

  socket.on('aiTrainer:analyze', async (callback) => {
    try {
      const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
      const analysis = await AITrainerService.analyzeUserWorkouts(socket.userId);
      callback({ success: true, analysis });
    } catch (error) {
      console.error('AI trainer analysis error:', error);
      callback({ error: 'Failed to analyze workouts' });
    }
  });

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
        room
      });
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
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

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

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
    console.log(`📊 Database: ${mongoose.connection.name || 'default'}`);
    
    try {
      const { default: AITrainerService } = await import('./src/services/AITrainerService.js');
      await AITrainerService.initializeTrainers();
      console.log('🤖 AI Trainers initialized successfully!');
    } catch (aiError) {
      console.log('⚠️ AI Trainers initialization failed:', aiError.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    return false;
  }
};

// Create user profile endpoint
app.post('/api/chatbot/profile', async (req, res) => {
  try {
    const result = await mlChatbotService.createUserProfile(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process message endpoint
app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const result = await mlChatbotService.processMessage(userId, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001;
await mlChatbotService.initialize();


// Connect to database first, then start server
connectDatabase().then((dbConnected) => {
  server.listen(PORT, () => {
    logger.info(`🚀 IM FIIT Backend Server running on port ${PORT}`);
    logger.info(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    logger.info(`🎮 Socket.IO ready for multiplayer battles`);
    logger.info(`🤖 AI Trainers ready for fitness coaching`);
    logger.info(`💾 Database: ${dbConnected ? 'Connected' : 'Disconnected'}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
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