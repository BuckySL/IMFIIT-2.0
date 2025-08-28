// src/models/index.js - All database models and game state classes

// ============================================================================
// MONGOOSE MODELS (for persistent storage)
// ============================================================================

const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  telegramId: { type: Number, required: true, unique: true },
  telegramUser: {
    id: Number,
    first_name: String,
    last_name: String,
    username: String,
    photo_url: String,
    language_code: String
  },
  walletAddress: String,
  bodyType: {
    type: String,
    enum: ['fit-male', 'fit-female', 'skinny-male', 'skinny-female', 
           'overweight-male', 'overweight-female', 'obese-male', 'obese-female'],
    default: 'fit-male'
  },
  stats: {
    strength: { type: Number, default: 50, min: 0, max: 1000 },
    endurance: { type: Number, default: 50, min: 0, max: 1000 },
    level: { type: Number, default: 1, min: 1, max: 100 },
    experience: { type: Number, default: 0, min: 0 },
    totalWorkouts: { type: Number, default: 0, min: 0 },
    weeklyWorkouts: { type: Number, default: 0, min: 0 },
    lastWorkoutDate: Date
  },
  battleStats: {
    totalBattles: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 },
    maxWinStreak: { type: Number, default: 0 },
    totalDamageDealt: { type: Number, default: 0 },
    totalDamageReceived: { type: Number, default: 0 },
    ranking: { type: Number, default: 1000 }
  },
  fitnessProfile: {
    age: Number,
    height: Number, // cm
    weight: Number, // kg
    gender: { type: String, enum: ['male', 'female'] },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
      default: 'moderate'
    },
    bmr: Number
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    soundEffects: { type: Boolean, default: true },
    hapticFeedback: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
    theme: { type: String, enum: ['dark', 'light', 'auto'], default: 'auto' }
  },
  lastLoginAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ telegramId: 1 });
userSchema.index({ 'stats.experience': -1 });
userSchema.index({ 'battleStats.ranking': 1 });

// Workout Session Schema
const workoutSessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  exercises: [{
    name: String,
    reps: Number,
    sets: Number,
    weight: Number, // kg
    duration: Number, // minutes
    distance: Number, // km
    confidence: Number
  }],
  type: {
    type: String,
    enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
    default: 'other'
  },
  intensity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  duration: Number, // total workout duration in minutes
  caloriesBurned: Number,
  confidence: { type: Number, min: 0, max: 1 },
  rawText: String, // OCR extracted text
  imageUrl: String, // Reference to uploaded image
  verified: { type: Boolean, default: false },
  statsGain: {
    strength: Number,
    endurance: Number,
    experience: Number,
    reason: String
  },
  createdAt: { type: Date, default: Date.now }
});

workoutSessionSchema.index({ userId: 1, createdAt: -1 });

// Battle History Schema
const battleHistorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  roomId: String,
  players: [{
    userId: String,
    username: String,
    bodyType: String,
    level: Number,
    finalHealth: Number,
    damageDealt: Number,
    damageReceived: Number
  }],
  winner: String, // userId
  loser: String, // userId
  battleLog: [{
    turn: Number,
    playerId: String,
    action: String,
    hit: Boolean,
    damage: Number,
    critical: Boolean,
    timestamp: Date
  }],
  duration: Number, // seconds
  totalTurns: Number,
  betAmount: { type: Number, default: 0 },
  rewards: {
    winner: {
      experience: Number,
      coins: Number,
      winStreak: Number
    },
    loser: {
      experience: Number,
      coins: Number,
      winStreak: Number
    }
  },
  gameMode: { type: String, default: 'battle' },
  endReason: { type: String, enum: ['defeat', 'forfeit', 'disconnect', 'timeout'], default: 'defeat' },
  createdAt: { type: Date, default: Date.now },
  finishedAt: Date
});

battleHistorySchema.index({ winner: 1, createdAt: -1 });
battleHistorySchema.index({ loser: 1, createdAt: -1 });
battleHistorySchema.index({ createdAt: -1 });

// Ban Schema
const banSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  reason: { type: String, required: true },
  bannedBy: String, // admin userId
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

banSchema.index({ userId: 1, isActive: 1 });

// Export Mongoose Models
const User = mongoose.model('User', userSchema);
const WorkoutSession = mongoose.model('WorkoutSession', workoutSessionSchema);
const BattleHistory = mongoose.model('BattleHistory', battleHistorySchema);
const Ban = mongoose.model('Ban', banSchema);

// ============================================================================
// IN-MEMORY GAME STATE CLASSES (for real-time gameplay)
// ============================================================================

class GameRoom {
  constructor(config) {
    this.id = config.id;
    this.hostId = config.hostId;
    this.guestId = null;
    this.betAmount = config.betAmount || 0;
    this.isPrivate = config.isPrivate || false;
    this.maxPlayers = config.maxPlayers || 2;
    this.gameMode = config.gameMode || 'battle';
    this.status = 'waiting'; // waiting, ready, playing, finished
    this.players = [];
    this.createdAt = config.createdAt || new Date();
    this.gameStartedAt = null;
  }

  addPlayer(player) {
    if (this.players.length >= this.maxPlayers) {
      throw new Error('Room is full');
    }

    this.players.push(player);
    
    if (this.players.length === 1) {
      this.hostId = player.id;
      player.isHost = true;
    } else if (this.players.length === 2) {
      this.guestId = player.id;
    }
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    
    if (this.hostId === playerId && this.players.length > 0) {
      this.hostId = this.players[0].id;
      this.players[0].isHost = true;
    }
    
    if (this.guestId === playerId) {
      this.guestId = null;
    }
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  isHost(playerId) {
    return this.hostId === playerId;
  }

  isFull() {
    return this.players.length >= this.maxPlayers;
  }

  areAllPlayersReady() {
    return this.players.length >= 2 && this.players.every(p => p.isReady);
  }
}

class BattleState {
  constructor(room) {
    this.roomId = room.id;
    this.status = 'waiting'; // waiting, active, finished
    this.players = room.players.map(player => ({
      id: player.id,
      username: player.username,
      bodyType: player.bodyType,
      level: player.level || 1,
      strength: player.strength || 50,
      endurance: player.endurance || 50,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      position: player.id === room.hostId ? 'left' : 'right'
    }));
    this.currentTurn = null;
    this.turnTimeLeft = 10;
    this.turnCount = 0;
    this.battleLog = [];
    this.winner = null;
    this.createdAt = new Date();
    this.startedAt = null;
    this.finishedAt = null;
  }

  getPlayer(playerId) {
    return this.players.find(p => p.id === playerId);
  }

  getOpponent(playerId) {
    return this.players.find(p => p.id !== playerId);
  }

  addToLog(logEntry) {
    this.battleLog.push(logEntry);
  }

  isPlayerTurn(playerId) {
    return this.currentTurn === playerId;
  }

  switchTurn() {
    const currentIndex = this.players.findIndex(p => p.id === this.currentTurn);
    const nextIndex = (currentIndex + 1) % this.players.length;
    this.currentTurn = this.players[nextIndex].id;
    this.turnTimeLeft = 10;
    this.turnCount++;
  }
}

class Fighter {
  constructor(playerData) {
    this.id = playerData.id;
    this.username = playerData.username;
    this.bodyType = playerData.bodyType;
    this.level = playerData.level || 1;
    this.strength = playerData.strength || 50;
    this.endurance = playerData.endurance || 50;
    this.health = 100;
    this.maxHealth = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.position = playerData.position || 'left';
    this.status = 'idle'; // idle, attacking, defending, hit, victory, defeat
    this.buffs = []; // Active buffs/debuffs
    this.winStreak = playerData.winStreak || 0;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health <= 0;
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  useEnergy(amount) {
    this.energy = Math.max(0, this.energy - amount);
  }

  restoreEnergy(amount) {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
  }

  addBuff(buff) {
    this.buffs.push({
      ...buff,
      appliedAt: new Date(),
      expiresAt: new Date(Date.now() + (buff.duration || 30000))
    });
  }

  removeExpiredBuffs() {
    const now = new Date();
    this.buffs = this.buffs.filter(buff => buff.expiresAt > now);
  }

  getActiveBuff(type) {
    this.removeExpiredBuffs();
    return this.buffs.find(buff => buff.type === type);
  }

  calculateAttackDamage(baseAttack) {
    let damage = baseAttack;
    
    // Apply strength bonus
    damage += this.strength * 0.3;
    
    // Apply buffs
    const attackBuff = this.getActiveBuff('attack');
    if (attackBuff) {
      damage *= attackBuff.multiplier;
    }
    
    return Math.round(damage);
  }

  calculateDefense() {
    let defense = this.endurance * 0.2;
    
    // Apply buffs
    const defenseBuff = this.getActiveBuff('defense');
    if (defenseBuff) {
      defense *= defenseBuff.multiplier;
    }
    
    return Math.round(defense);
  }

  isAlive() {
    return this.health > 0;
  }

  isDead() {
    return this.health <= 0;
  }
}

// ============================================================================
// EXPORT ALL MODELS AND CLASSES
// ============================================================================

module.exports = {
  // Mongoose Models
  User,
  WorkoutSession,
  BattleHistory,
  Ban,
  
  // Game State Classes
  GameRoom,
  BattleState,
  Fighter
};