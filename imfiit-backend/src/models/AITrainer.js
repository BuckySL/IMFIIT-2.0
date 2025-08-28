// ============================================================================
// AI TRAINER MODEL - Fixed ES Modules Version
// File: src/models/AITrainer.js
// ============================================================================

import mongoose from 'mongoose';

const aiTrainerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  specialty: {
    type: String,
    enum: ['strength', 'endurance', 'flexibility', 'general'],
    required: true
  },
  personality: {
    type: String,
    enum: ['motivational', 'analytical', 'supportive', 'challenging'],
    required: true
  },
  experience: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  avatar: {
    type: String,
    default: '🏋️‍♂️'
  },
  description: {
    type: String,
    required: true
  },
  stats: {
    strength: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    endurance: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    intelligence: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    }
  },
  responses: {
    workoutComplete: [String],
    motivation: [String],
    improvement: [String],
    greeting: [String]
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Method to get a random response from a category
aiTrainerSchema.methods.getResponse = function(category) {
  const responses = this.responses[category] || [];
  if (responses.length === 0) return "Keep up the great work!";
  
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

// Static method to get trainer by specialty
aiTrainerSchema.statics.getBySpecialty = function(specialty) {
  return this.find({ specialty, active: true });
};

// Static method to get random trainer response
aiTrainerSchema.statics.getRandomResponse = function(category = 'motivation') {
  const defaultResponses = {
    workoutComplete: [
      "Amazing workout! You're getting stronger! 💪",
      "Great job! Your dedication is showing!",
      "Fantastic effort! Keep pushing forward!",
      "You crushed that workout! Well done!",
      "Excellent work! Your progress is real!"
    ],
    motivation: [
      "You've got this! Every rep counts!",
      "Push through - you're stronger than you think!",
      "Consistency is key - keep showing up!",
      "Your future self will thank you!",
      "One more rep, one step closer to your goals!"
    ],
    improvement: [
      "Focus on your form for maximum effectiveness!",
      "Try increasing the intensity gradually!",
      "Consider adding variety to challenge yourself!",
      "Listen to your body and progress safely!",
      "Small improvements compound into big results!"
    ],
    greeting: [
      "Ready to train? Let's make it count!",
      "Time to get stronger! I believe in you!",
      "Let's turn today's effort into tomorrow's strength!",
      "Another day, another opportunity to improve!",
      "Your workout journey continues - let's go!"
    ]
  };

  const responses = defaultResponses[category] || defaultResponses.motivation;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

export default mongoose.model('AITrainer', aiTrainerSchema);