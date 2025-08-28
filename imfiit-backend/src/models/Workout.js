import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workoutData: {
    type: {
      type: String,
      enum: ['cardio', 'strength', 'flexibility', 'sports', 'other'],
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: 1
    },
    intensity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    calories: Number,
    distance: Number,
    heartRate: Number,
    appSource: {
      type: String,
      enum: ['Samsung Health', 'Apple Health', 'Strava', 'MyFitnessPal', 'Garmin', 'Fitbit'],
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.85
    }
  },
  rewards: {
    strength: {
      type: Number,
      default: 0
    },
    endurance: {
      type: Number,
      default: 0
    },
    experience: {
      type: Number,
      default: 0
    }
  },
  verification: {
    ocrText: String,
    securityPassed: {
      type: Boolean,
      default: false
    },
    imageHash: String,
    securityLevel: {
      type: String,
      enum: ['PASSED', 'SUSPICIOUS', 'REJECTED'],
      default: 'PASSED'
    }
  },
  processed: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
workoutSchema.index({ userId: 1, createdAt: -1 });
workoutSchema.index({ 'verification.imageHash': 1 });

export default mongoose.model('Workout', workoutSchema);