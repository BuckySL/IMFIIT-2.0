import mongoose from 'mongoose';

const battleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  battleType: {
    type: String,
    enum: ['ai', 'multiplayer'],
    required: true
  },
  opponent: {
    type: {
      type: String,
      enum: ['ai', 'user'],
      required: true
    },
    id: String, // AI personality ID or user ID
    name: String,
    stats: {
      strength: Number,
      endurance: Number,
      level: Number
    }
  },
  result: {
    winner: {
      type: String,
      enum: ['user', 'opponent', 'draw'],
      required: true
    },
    userScore: {
      type: Number,
      default: 0
    },
    opponentScore: {
      type: Number,
      default: 0
    },
    duration: Number, // battle duration in seconds
    rounds: [{
      roundNumber: Number,
      userAction: String,
      opponentAction: String,
      userDamage: Number,
      opponentDamage: Number,
      userEnergy: Number,
      opponentEnergy: Number
    }]
  },
  rewards: {
    experience: {
      type: Number,
      default: 0
    },
    strength: {
      type: Number,
      default: 0
    },
    endurance: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for leaderboards and user history
battleSchema.index({ userId: 1, createdAt: -1 });
battleSchema.index({ 'result.winner': 1, createdAt: -1 });

export default mongoose.model('Battle', battleSchema);