import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    age: {
      type: Number,
      min: 13,
      max: 120,
      default: 25
    },
    level: {
      type: Number,
      default: 1,
      min: 1
    },
    stats: {
      strength: {
        type: Number,
        default: 50,
        min: 0
      },
      endurance: {
        type: Number,
        default: 50,
        min: 0
      },
      experience: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    achievements: [{
      type: String
    }],
    totalWorkouts: {
      type: Number,
      default: 0
    },
    joinDate: {
      type: Date,
      default: Date.now
    }
  },
  nftCharacter: {
    tokenId: String,
    contractAddress: String,
    traits: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }
}, {
  timestamps: true
});

// Calculate level based on experience
userSchema.methods.calculateLevel = function() {
  this.profile.level = Math.floor(Math.sqrt(this.profile.stats.experience / 100)) + 1;
  return this.profile.level;
};

// Add experience and update level
userSchema.methods.addExperience = function(exp) {
  this.profile.stats.experience += exp;
  this.calculateLevel();
  return this.save();
};

export default mongoose.model('User', userSchema);