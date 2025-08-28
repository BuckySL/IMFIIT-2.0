// ============================================================================
// AI TRAINER API ROUTES AND INTEGRATION
// Add these to your existing server.js or create separate route files
// ============================================================================

// src/routes/aiTrainerRoutes.js
const express = require('express');
const router = express.Router();
const AITrainerService = require('../services/AITrainerService');
const AITrainer = require('../models/AITrainer');
const User = require('../models/User');

// GET /api/ai-trainers - Get all available trainers
router.get('/', async (req, res) => {
  try {
    const trainers = await AITrainerService.getTrainers();
    
    res.json({
      success: true,
      trainers: trainers.map(trainer => ({
        id: trainer._id,
        name: trainer.name,
        specialty: trainer.specialty,
        personality: trainer.personality,
        experience: trainer.experience,
        avatar: trainer.avatar,
        description: trainer.description,
        stats: trainer.stats
      }))
    });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainers',
      error: error.message
    });
  }
});

// GET /api/ai-trainers/:id - Get specific trainer details
router.get('/:id', async (req, res) => {
  try {
    const trainer = await AITrainerService.getTrainerById(req.params.id);
    
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    res.json({
      success: true,
      trainer: {
        id: trainer._id,
        name: trainer.name,
        specialty: trainer.specialty,
        personality: trainer.personality,
        experience: trainer.experience,
        avatar: trainer.avatar,
        description: trainer.description,
        stats: trainer.stats,
        responses: trainer.responses
      }
    });
  } catch (error) {
    console.error('Get trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer',
      error: error.message
    });
  }
});

// POST /api/ai-trainers/:id/analyze - Get workout analysis from specific trainer
router.post('/:id/analyze', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get workout analysis
    const analysis = await AITrainerService.analyzeUserWorkouts(userId);
    
    // Get trainer-specific response
    const trainer = await AITrainerService.getTrainerById(req.params.id);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Get personalized message from this trainer
    const personalMessage = await AITrainerService.getTrainerResponse(
      req.params.id, 
      'motivation',
      { 
        workoutCount: analysis.totalWorkouts,
        fitnessLevel: analysis.fitnessLevel 
      }
    );

    res.json({
      success: true,
      analysis: {
        ...analysis,
        trainerName: trainer.name,
        trainerMessage: personalMessage,
        trainerAvatar: trainer.avatar
      }
    });
  } catch (error) {
    console.error('Analyze workouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze workouts',
      error: error.message
    });
  }
});

// POST /api/ai-trainers/:id/workout-complete - Get trainer response for completed workout
router.post('/:id/workout-complete', async (req, res) => {
  try {
    const { workoutData, userId } = req.body;
    
    if (!workoutData || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Workout data and user ID are required'
      });
    }

    // Get trainer response
    const response = await AITrainerService.getTrainerResponse(
      req.params.id,
      'workoutComplete',
      {
        workoutType: workoutData.type,
        duration: workoutData.duration,
        intensity: workoutData.intensity
      }
    );

    // Get improvement suggestions if available
    const analysis = await AITrainerService.analyzeUserWorkouts(userId);
    let improvementSuggestion = null;
    
    if (analysis.improvementAreas.length > 0) {
      improvementSuggestion = await AITrainerService.getTrainerResponse(
        req.params.id,
        'improvement',
        { improvementArea: analysis.improvementAreas[0] }
      );
    }

    res.json({
      success: true,
      trainerResponse: {
        congratsMessage: response,
        improvementTip: improvementSuggestion,
        nextRecommendation: analysis.nextWorkout,
        motivationalMessage: analysis.motivationalMessage
      }
    });
  } catch (error) {
    console.error('Workout complete response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trainer response',
      error: error.message
    });
  }
});

// POST /api/ai-trainers/:id/get-recommendation - Get workout recommendation from trainer
router.post('/:id/get-recommendation', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get workout recommendation
    const recommendation = await AITrainerService.getWorkoutRecommendation(
      req.params.id,
      user.profile.level,
      user.profile.stats
    );

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Failed to generate recommendation'
      });
    }

    res.json({
      success: true,
      recommendation
    });
  } catch (error) {
    console.error('Get recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendation',
      error: error.message
    });
  }
});

// POST /api/ai-trainers/chat - Chat with AI trainer
router.post('/chat', async (req, res) => {
  try {
    const { trainerId, message, userId, context } = req.body;
    
    if (!trainerId || !message || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Trainer ID, message, and user ID are required'
      });
    }

    // Get trainer
    const trainer = await AITrainerService.getTrainerById(trainerId);
    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Simple keyword-based response system
    let responseCategory = 'motivation';
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      responseCategory = 'workoutComplete';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('improve')) {
      responseCategory = 'improvement';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      responseCategory = 'greeting';
    }

    const response = await AITrainerService.getTrainerResponse(
      trainerId,
      responseCategory,
      context || {}
    );

    res.json({
      success: true,
      chat: {
        trainerName: trainer.name,
        trainerAvatar: trainer.avatar,
        userMessage: message,
        trainerResponse: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat',
      error: error.message
    });
  }
});

// GET /api/ai-trainers/user/:userId/recommended - Get recommended trainer for user
router.get('/user/:userId/recommended', async (req, res) => {
  try {
    const analysis = await AITrainerService.analyzeUserWorkouts(req.params.userId);
    
    // Find the recommended trainer
    const recommendedTrainer = await AITrainer.findOne({ 
      name: analysis.recommendedTrainer 
    });

    if (!recommendedTrainer) {
      return res.status(404).json({
        success: false,
        message: 'Recommended trainer not found'
      });
    }

    res.json({
      success: true,
      recommendedTrainer: {
        id: recommendedTrainer._id,
        name: recommendedTrainer.name,
        specialty: recommendedTrainer.specialty,
        personality: recommendedTrainer.personality,
        avatar: recommendedTrainer.avatar,
        description: recommendedTrainer.description,
        reason: `Based on your ${analysis.preferredType} focus and ${analysis.fitnessLevel} level`
      },
      analysis: {
        fitnessLevel: analysis.fitnessLevel,
        preferredType: analysis.preferredType,
        weeklyFrequency: analysis.weeklyFrequency,
        consistencyScore: analysis.consistencyScore
      }
    });
  } catch (error) {
    console.error('Get recommended trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommended trainer',
      error: error.message
    });
  }
});

module.exports = router;

// ============================================================================
// UPDATE YOUR SERVER.JS TO INCLUDE AI TRAINER ROUTES
// Add this to your existing server.js file
// ============================================================================

// In your server.js setupRoutes() method, add this line:

// this.app.use('/api/ai-trainers', require('./src/routes/aiTrainerRoutes'));

// ============================================================================
// ENHANCED SERVER.JS INTEGRATION
// Add these methods to your IMFiitServer class
// ============================================================================

// Add this to your IMFiitServer class constructor
async initializeAITrainers() {
  const AITrainerService = require('./src/services/AITrainerService');
  await AITrainerService.initializeTrainers();
}

// Update your connectDatabase method to call this:
async connectDatabase() {
  try {
    logger.info('🔗 Connecting to MongoDB...');
    
    if (!process.env.MONGODB_URI) {
      logger.warn('⚠️ No MONGODB_URI provided, running without database');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 2000
    });

    this.dbConnected = true;
    logger.info('✅ MongoDB Connected successfully');
    logger.info(`📊 Database: ${mongoose.connection.name}`);
    
    // Initialize AI trainers
    await this.initializeAITrainers();
    
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error.message);
    this.dbConnected = false;
  }
}

// Enhanced handleWorkoutUpload with AI trainer integration
async handleWorkoutUpload(socket, workoutData, callback) {
  try {
    logger.info(`💪 Workout upload from user ${socket.userProfile.id}`);
    
    if (!workoutData || !workoutData.extractedWorkout) {
      return callback({ error: 'Invalid workout data' });
    }

    const statsGain = this.calculateWorkoutGains(workoutData.extractedWorkout);
    
    // Save workout to database
    if (this.dbConnected) {
      try {
        const workout = new Workout({
          userId: socket.userProfile.id,
          workoutData: {
            type: workoutData.extractedWorkout.type || 'cardio',
            duration: workoutData.extractedWorkout.duration || 0,
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
        
        // Get AI trainer response for workout completion
        const AITrainerService = require('./src/services/AITrainerService');
        const analysis = await AITrainerService.analyzeUserWorkouts(socket.userProfile.id);
        
        // Get response from recommended trainer
        const recommendedTrainer = await AITrainerService.getTrainers();
        const trainer = recommendedTrainer.find(t => t.name === analysis.recommendedTrainer);
        
        let trainerResponse = "Great workout! Keep up the excellent work! 💪";
        if (trainer) {
          trainerResponse = await AITrainerService.getTrainerResponse(
            trainer._id,
            'workoutComplete',
            {
              workoutType: workoutData.extractedWorkout.type,
              duration: workoutData.extractedWorkout.duration,
              intensity: workoutData.extractedWorkout.intensity
            }
          );
        }

        logger.info(`✅ Workout saved with AI trainer response for user ${socket.userProfile.id}`);
        
        // Send enhanced response with AI trainer feedback
        callback({ 
          success: true, 
          statsGain,
          databaseSaved: true,
          aiTrainer: {
            name: trainer?.name || 'AI Trainer',
            avatar: trainer?.avatar || '🏋️‍♂️',
            response: trainerResponse,
            analysis: {
              fitnessLevel: analysis.fitnessLevel,
              nextWorkout: analysis.nextWorkout,
              weeklyGoal: analysis.weeklyGoal
            }
          }
        });
        
      } catch (dbError) {
        logger.error('Database save error (continuing without DB):', dbError);
        callback({ 
          success: true, 
          statsGain,
          databaseSaved: false
        });
      }
    } else {
      callback({ 
        success: true, 
        statsGain,
        databaseSaved: false
      });
    }

    // Update user stats in memory
    const updatedProfile = await this.userManager.updateUserStats(
      socket.userProfile.id, 
      statsGain
    );

    socket.emit('fitness:statsUpdated', {
      statsGain,
      newProfile: updatedProfile
    });

  } catch (error) {
    logger.error('Workout upload error:', error);
    callback({ error: 'Failed to process workout' });
  }
}

// Add AI trainer socket events to your setupSocketHandlers method:
setupSocketHandlers() {
  // ... existing socket setup ...

  this.io.on('connection', (socket) => {
    // ... existing connection handlers ...

    // AI Trainer events
    socket.on('aiTrainer:getRecommendation', async (data, callback) => {
      try {
        const { trainerId } = data;
        const AITrainerService = require('./src/services/AITrainerService');
        
        const user = await User.findById(socket.userProfile.id);
        if (!user) {
          return callback({ error: 'User not found' });
        }

        const recommendation = await AITrainerService.getWorkoutRecommendation(
          trainerId,
          user.profile.level,
          user.profile.stats
        );

        callback({ success: true, recommendation });
      } catch (error) {
        logger.error('AI trainer recommendation error:', error);
        callback({ error: 'Failed to get recommendation' });
      }
    });

    socket.on('aiTrainer:chat', async (data, callback) => {
      try {
        const { trainerId, message } = data;
        const AITrainerService = require('./src/services/AITrainerService');
        
        let responseCategory = 'motivation';
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('workout')) responseCategory = 'workoutComplete';
        else if (lowerMessage.includes('help')) responseCategory = 'improvement';
        else if (lowerMessage.includes('hello')) responseCategory = 'greeting';

        const response = await AITrainerService.getTrainerResponse(
          trainerId,
          responseCategory
        );

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
        logger.error('AI trainer chat error:', error);
        callback({ error: 'Failed to process chat' });
      }
    });

    socket.on('aiTrainer:analyze', async (callback) => {
      try {
        const AITrainerService = require('./src/services/AITrainerService');
        const analysis = await AITrainerService.analyzeUserWorkouts(socket.userProfile.id);
        
        callback({ success: true, analysis });
      } catch (error) {
        logger.error('AI trainer analysis error:', error);
        callback({ error: 'Failed to analyze workouts' });
      }
    });

    // ... rest of existing socket handlers ...
  });
}

// ============================================================================
// FRONTEND INTEGRATION EXAMPLES
// How to use these AI trainer features in your React app
// ============================================================================

/*
// Frontend API calls examples:

// 1. Get all trainers
const getTrainers = async () => {
  const response = await fetch('/api/ai-trainers');
  const data = await response.json();
  return data.trainers;
};

// 2. Get workout analysis from specific trainer
const getTrainerAnalysis = async (trainerId, userId) => {
  const response = await fetch(`/api/ai-trainers/${trainerId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  const data = await response.json();
  return data.analysis;
};

// 3. Get trainer response after workout
const getWorkoutResponse = async (trainerId, workoutData, userId) => {
  const response = await fetch(`/api/ai-trainers/${trainerId}/workout-complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workoutData, userId })
  });
  const data = await response.json();
  return data.trainerResponse;
};

// 4. Chat with trainer
const chatWithTrainer = async (trainerId, message, userId) => {
  const response = await fetch('/api/ai-trainers/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trainerId, message, userId })
  });
  const data = await response.json();
  return data.chat;
};

// 5. Get recommended trainer for user
const getRecommendedTrainer = async (userId) => {
  const response = await fetch(`/api/ai-trainers/user/${userId}/recommended`);
  const data = await response.json();
  return data.recommendedTrainer;
};

// Socket.io events examples:

// 1. Get recommendation via socket
socket.emit('aiTrainer:getRecommendation', { trainerId }, (response) => {
  if (response.success) {
    console.log('Trainer recommendation:', response.recommendation);
  }
});

// 2. Chat via socket
socket.emit('aiTrainer:chat', { trainerId, message: 'Hello coach!' }, (response) => {
  if (response.success) {
    console.log('Trainer response:', response.chat.response);
  }
});

// 3. Get analysis via socket
socket.emit('aiTrainer:analyze', (response) => {
  if (response.success) {
    console.log('Workout analysis:', response.analysis);
  }
});
*/