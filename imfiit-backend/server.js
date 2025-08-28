// ============================================================================
// COMPLETE IM FIIT BACKEND SERVER WITH MULTIPLAYER BATTLE ROOMS
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

// In-memory storage for active rooms and battles
const activeRooms = new Map();
const activeBattles = new Map();

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
      const trainer = trainers[Math.floor(Math.random() * trainers.length)];
      
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

// Room list (now returns empty - private rooms only)
app.get('/api/rooms', async (req, res) => {
  try {
    // No public rooms in friend-only system
    res.json([]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================================================
// SOCKET.IO CONNECTION HANDLING WITH MULTIPLAYER ROOMS
// ============================================================================

io.use(authMiddleware);

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.userId}`, {
    socketId: socket.id,
    userId: socket.userId
  });

  userManager.registerUser(socket.userId, socket);

  // ====================================
  // ROOMS:GET - REMOVED (NO PUBLIC ROOMS)
  // ====================================
  socket.on('rooms:get', () => {
    // No public rooms - users need room codes from friends
    socket.emit('rooms:list', []);
    console.log(`📋 No public rooms - friend-only system active`);
  });

  // ====================================
  // ROOM:CREATE - PRIVATE WITH ROOM CODE
  // ====================================
  socket.on('room:create', async (config) => {
    try {
      console.log('🏠 Creating private room with config:', config);
      
      // Generate short, easy-to-share room code (6 characters)
      const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
      const roomId = `room_${Date.now()}_${roomCode}`;
      
      const room = {
        id: roomId,
        code: roomCode, // This is what friends will use to join
        creator: {
          id: socket.userId,
          name: socket.userProfile?.telegramUser?.first_name || `Player_${socket.userId.slice(-4)}`,
          telegramUser: socket.userProfile?.telegramUser || {
            first_name: `Player_${socket.userId.slice(-4)}`
          },
          stats: socket.userProfile?.stats || { level: 1, strength: 50, endurance: 50 },
          bodyType: socket.userProfile?.bodyType || 'fit-male'
        },
        players: [{
          id: socket.userId,
          name: socket.userProfile?.telegramUser?.first_name || `Player_${socket.userId.slice(-4)}`,
          telegramUser: socket.userProfile?.telegramUser || {
            first_name: `Player_${socket.userId.slice(-4)}`
          },
          stats: socket.userProfile?.stats || { level: 1, strength: 50, endurance: 50 },
          bodyType: socket.userProfile?.bodyType || 'fit-male'
        }],
        wager: config.wager || 100,
        status: 'waiting',
        maxPlayers: 2,
        isPrivate: true,
        createdAt: new Date(),
        createdBy: socket.userId
      };

      // Store room in memory
      activeRooms.set(roomId, room);
      
      // Join socket to room
      socket.join(roomId);
      
      // Send room with CODE to creator
      socket.emit('room:created', {
        ...room,
        roomCode: roomCode // Frontend needs this to display to user
      });
      
      // NO BROADCASTING - This is private!
      
      console.log(`✅ Private room created: ${roomCode} by ${socket.userId}`);
      logger.info(`Private room created: ${roomCode} by user ${socket.userId}`);
      
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Room creation failed:', error);
    }
  });

  // ====================================
  // ROOM:JOIN - BY ROOM CODE (PRIVATE)
  // ====================================
  socket.on('room:join', async (roomCode) => {
    try {
      console.log(`🚪 User ${socket.userId} trying to join room with code: ${roomCode}`);
      
      // Find room by code instead of ID
      let targetRoom = null;
      let targetRoomId = null;
      
      activeRooms.forEach((room, roomId) => {
        if (room.code === roomCode.toUpperCase()) {
          targetRoom = room;
          targetRoomId = roomId;
        }
      });
      
      if (!targetRoom) {
        socket.emit('error', 'Invalid room code');
        return;
      }
      
      if (targetRoom.players.length >= targetRoom.maxPlayers) {
        socket.emit('error', 'Room is full');
        return;
      }
      
      if (targetRoom.players.find(p => p.id === socket.userId)) {
        socket.emit('error', 'Already in this room');
        return;
      }

      // Add player to room
      const newPlayer = {
        id: socket.userId,
        name: socket.userProfile?.telegramUser?.first_name || `Player_${socket.userId.slice(-4)}`,
        telegramUser: socket.userProfile?.telegramUser || {
          first_name: `Player_${socket.userId.slice(-4)}`
        },
        stats: socket.userProfile?.stats || { level: 1, strength: 50, endurance: 50 },
        bodyType: socket.userProfile?.bodyType || 'fit-male'
      };
      
      targetRoom.players.push(newPlayer);
      
      // Update room status
      if (targetRoom.players.length === targetRoom.maxPlayers) {
        targetRoom.status = 'ready';
      }
      
      // Join socket to room
      socket.join(targetRoomId);
      
      // Send room to the joiner
      socket.emit('room:joined', targetRoom);
      
      // Notify existing players in the room ONLY
      socket.to(targetRoomId).emit('room:updated', targetRoom);
      
      // NO BROADCASTING - This is private!
      
      console.log(`✅ User ${socket.userId} joined private room ${roomCode}`);
      logger.info(`User ${socket.userId} joined room ${roomCode}`);
      
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Room join failed:', error);
    }
  });

  // ====================================
  // ROOM:LEAVE - PRIVATE ROOM
  // ====================================
  socket.on('room:leave', async (roomId) => {
    try {
      const room = activeRooms.get(roomId);
      if (!room) return;
      
      // Remove player from room
      room.players = room.players.filter(p => p.id !== socket.userId);
      
      // Leave socket room
      socket.leave(roomId);
      
      // If room is empty, delete it
      if (room.players.length === 0) {
        activeRooms.delete(roomId);
        console.log(`🗑️ Deleted empty private room: ${room.code}`);
      } else {
        // Reset room status to waiting
        room.status = 'waiting';
        // Notify remaining players
        socket.to(roomId).emit('room:updated', room);
      }
      
      // NO BROADCASTING - Private rooms
      
      console.log(`👋 User ${socket.userId} left private room ${room.code || roomId}`);
      logger.info(`User ${socket.userId} left room ${room.code || roomId}`);
      
    } catch (error) {
      logger.error('Room leave failed:', error);
    }
  });

  // ====================================
  // ROOM:READY - START BATTLE
  // ====================================
  socket.on('room:ready', async (roomId) => {
    try {
      const room = activeRooms.get(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }
      
      if (room.players.length !== 2) {
        socket.emit('error', 'Need 2 players to start battle');
        return;
      }
      
      // Set room status to fighting
      room.status = 'fighting';
      
      // Create battle state
      const battleId = `battle_${Date.now()}`;
      const battleState = {
        id: battleId,
        roomId: roomId,
        players: {
          [room.players[0].id]: { ...room.players[0], health: 100 },
          [room.players[1].id]: { ...room.players[1], health: 100 }
        },
        currentTurn: room.players[0].id, // First player starts
        turnTimeLeft: 30,
        status: 'fighting',
        battleLog: [
          `🥊 Battle started!`,
          `${room.players[0].telegramUser?.first_name} vs ${room.players[1].telegramUser?.first_name}`,
          `Wager: ${room.wager} tokens - Winner takes all!`
        ]
      };
      
      // Store battle
      activeBattles.set(battleId, battleState);
      
      // Remove room from available battles (private room)
      
      // Start battle for both players
      io.to(roomId).emit('battle:started', battleState);
      
      console.log(`⚔️ Battle started in room ${roomId}: ${battleId}`);
      logger.info(`Battle started in room ${roomId}`);
      
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Room ready failed:', error);
    }
  });

  // ====================================
  // BATTLE:ACTION - TURN-BASED COMBAT
  // ====================================
  socket.on('battle:action', async (actionData) => {
    try {
      const { battleId, action, playerId } = actionData;
      console.log(`🥊 Battle action: ${playerId} used ${action}`);
      
      // Find battle and room
      const battle = activeBattles.get(battleId);
      if (!battle) {
        socket.emit('error', 'Battle not found');
        return;
      }
      
      const room = activeRooms.get(battle.roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }
      
      // Validate turn
      if (battle.currentTurn !== playerId) {
        socket.emit('error', 'Not your turn');
        return;
      }
      
      // Simple battle logic
      const attacker = battle.players[playerId];
      const defenderId = Object.keys(battle.players).find(id => id !== playerId);
      const defender = battle.players[defenderId];
      
      let damage = 0;
      let actionMessage = '';
      
      if (action === 'attack') {
        damage = Math.floor(Math.random() * 25) + 15; // 15-40 damage
        defender.health = Math.max(0, defender.health - damage);
        actionMessage = `💥 ${attacker.name || attacker.id.slice(-4)} attacks for ${damage} damage!`;
      } else if (action === 'defend') {
        damage = Math.floor(Math.random() * 10) + 5; // 5-15 damage (reduced)
        defender.health = Math.max(0, defender.health - damage);
        actionMessage = `🛡️ ${attacker.name || attacker.id.slice(-4)} defends and counters for ${damage} damage!`;
      } else if (action === 'special') {
        damage = Math.floor(Math.random() * 35) + 20; // 20-55 damage (high risk/reward)
        defender.health = Math.max(0, defender.health - damage);
        actionMessage = `⚡ ${attacker.name || attacker.id.slice(-4)} uses special attack for ${damage} damage!`;
      }
      
      // Add to battle log
      battle.battleLog.push(actionMessage);
      battle.battleLog.push(`❤️ ${defender.name || defender.id.slice(-4)} has ${defender.health} health remaining`);
      
      // Check for winner
      if (defender.health <= 0) {
        // Battle ended!
        battle.status = 'finished';
        battle.winner = playerId;
        
        const endMessage = `🏆 ${attacker.name || attacker.id.slice(-4)} wins the battle!`;
        battle.battleLog.push(endMessage);
        battle.battleLog.push(`💰 Winner receives ${room.wager} tokens!`);
        
        // Send battle end event
        io.to(room.id).emit('battle:ended', {
          winner: playerId,
          loser: defenderId,
          battleLog: battle.battleLog,
          wager: room.wager
        });
        
        // Clean up
        activeBattles.delete(battleId);
        activeRooms.delete(room.id);
        
        console.log(`🏆 Battle ${battleId} won by ${playerId}`);
        
      } else {
        // Switch turns
        battle.currentTurn = defenderId;
        battle.turnTimeLeft = 30;
        
        // Send turn update
        io.to(room.id).emit('battle:turn', {
          currentTurn: defenderId,
          turnTimeLeft: 30,
          players: battle.players,
          battleLog: battle.battleLog.slice(-5), // Last 5 messages
          lastAction: {
            playerId,
            action,
            damage
          }
        });
      }
      
    } catch (error) {
      socket.emit('error', error.message);
      logger.error('Battle action failed:', error);
    }
  });

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

  // ====================================
  // DISCONNECT CLEANUP
  // ====================================
  socket.on('disconnect', () => {
    console.log(`👋 User ${socket.userId} disconnected`);
    
    // Remove user from all rooms
    activeRooms.forEach((room, roomId) => {
      const playerIndex = room.players.findIndex(p => p.id === socket.userId);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          activeRooms.delete(roomId);
          console.log(`🗑️ Deleted empty private room: ${room.code}`);
        } else {
          room.status = 'waiting';
          socket.to(roomId).emit('room:updated', room);
        }
      }
    });
    
    // No broadcasting for private rooms
    
    logger.info(`User disconnected: ${socket.userId}`);
    userManager.unregisterUser(socket.userId);
  });
});

// ============================================================================
// HELPER FUNCTIONS - SIMPLIFIED FOR PRIVATE ROOMS
// ============================================================================

// Optional: Periodic room cleanup (no broadcasting needed)
setInterval(() => {
  let cleanedRooms = 0;
  activeRooms.forEach((room, roomId) => {
    if (room.players.length === 0) {
      activeRooms.delete(roomId);
      cleanedRooms++;
    }
  });
  
  if (cleanedRooms > 0) {
    console.log(`🧹 Cleaned up ${cleanedRooms} empty private rooms`);
  }
}, 30000); // Every 30 seconds

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

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3001;

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