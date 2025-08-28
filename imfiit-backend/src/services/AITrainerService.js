// ============================================================================
// AI TRAINER SERVICE - Fixed ES Modules Version
// File: src/services/AITrainerService.js
// ============================================================================

import mongoose from 'mongoose';

// Import the CommonJS model with dynamic import fallback
let AITrainer;
try {
  const { default: AITrainerModel } = await import('../models/AITrainer.js');
  AITrainer = AITrainerModel;
} catch (error) {
  // Fallback for CommonJS
  const AITrainerModule = await import('../models/AITrainer.js');
  AITrainer = AITrainerModule.default || AITrainerModule;
}

// Dynamic import for other models
let Workout, User;
try {
  ({ default: Workout } = await import('../models/Workout.js'));
  ({ default: User } = await import('../models/User.js'));
} catch (error) {
  console.warn('Could not import Workout/User models:', error.message);
}

class AITrainerService {
  
  // Initialize default AI trainers
  static async initializeTrainers() {
    try {
      if (!AITrainer) {
        console.log('⚠️ AITrainer model not available, skipping initialization');
        return;
      }

      const trainerCount = await AITrainer.countDocuments();
      
      if (trainerCount > 0) {
        console.log('✅ AI Trainers already initialized');
        return;
      }

      const defaultTrainers = [
        {
          name: 'Coach Mike',
          specialty: 'strength',
          personality: 'motivational',
          experience: 95,
          avatar: '💪',
          description: 'The ultimate strength coach who pushes you beyond your limits',
          stats: { strength: 95, endurance: 75, intelligence: 80 },
          responses: {
            workoutComplete: [
              'Beast mode activated! 💪 You crushed that workout!',
              'Those gains are real! Keep pushing your limits!',
              'Strength is built one rep at a time - amazing work!',
              'Your muscles are screaming, but your spirit is roaring! 🔥',
              'That\'s how champions train! Time to eat and recover!'
            ],
            motivation: [
              'Pain is temporary, but quitting lasts forever!',
              'Your body can do it. It\'s your mind you need to convince!',
              'Champions train, losers complain. Which are you?',
              'Every rep counts, every set matters, every workout builds the legend!',
              'Comfort is the enemy of greatness. Embrace the struggle!'
            ],
            improvement: [
              'I see room for improvement in your form. Let\'s work on that!',
              'Your endurance is building - time to increase intensity!',
              'Consider adding more compound movements to your routine.',
              'Your strength is impressive, but let\'s balance it with flexibility.',
              'Progressive overload is key - time to up those weights!'
            ],
            greeting: [
              'Ready to build some serious muscle? Let\'s do this! 💪',
              'Time to separate the strong from the stronger!',
              'Your muscles are calling for growth - answer that call!',
              'Another day, another opportunity to become unstoppable!'
            ]
          },
          active: true
        },
        {
          name: 'Dr. Sarah',
          specialty: 'endurance',
          personality: 'analytical',
          experience: 88,
          avatar: '🏃‍♀️',
          description: 'Expert in cardiovascular fitness and endurance optimization',
          stats: { strength: 70, endurance: 95, intelligence: 90 },
          responses: {
            workoutComplete: [
              'Excellent cardiovascular performance! Your heart is getting stronger 💓',
              'Your endurance metrics are improving steadily - great progress!',
              'Based on your heart rate data, you\'re in the optimal training zone!',
              'Your VO2 max is definitely improving with this consistency!',
              'Perfect pacing! You\'re building sustainable endurance.'
            ],
            motivation: [
              'Endurance is built mile by mile, breath by breath.',
              'Your cardiovascular system is adapting - trust the process!',
              'Every heartbeat in training makes you stronger for life.',
              'The mind gives up before the body - keep pushing your mental limits!',
              'Consistency beats intensity - you\'re on the right track!'
            ],
            improvement: [
              'Consider incorporating interval training for better results.',
              'Your heart rate variability suggests you need more recovery.',
              'I recommend adding some strength work to complement your cardio.',
              'Try extending your warm-up - it will improve performance.',
              'Focus on breathing technique to maximize oxygen efficiency.'
            ],
            greeting: [
              'Ready to optimize your cardiovascular performance? 🏃‍♀️',
              'Let\'s analyze your endurance data and push your limits!',
              'Time to train smart and build that aerobic base!',
              'Your heart is your engine - let\'s make it powerful!'
            ]
          },
          active: true
        },
        {
          name: 'Zen Master Liu',
          specialty: 'flexibility',
          personality: 'supportive',
          experience: 92,
          avatar: '🧘‍♂️',
          description: 'Master of mindful movement, flexibility, and mental wellness',
          stats: { strength: 60, endurance: 80, intelligence: 95 },
          responses: {
            workoutComplete: [
              'Beautiful mindful movement! Your body and spirit are aligning 🧘‍♂️',
              'I can sense greater flexibility and inner peace in your practice.',
              'Your breathing was excellent - mind-body connection is strengthening.',
              'Each stretch brings you closer to your true potential.',
              'Your dedication to flexibility will serve you in all aspects of life.'
            ],
            motivation: [
              'Flexibility of body creates flexibility of mind.',
              'Every stretch is a step toward greater self-awareness.',
              'Patience, young warrior. Progress comes to those who persist.',
              'The body achieves what the mind believes.',
              'In stillness, we find our greatest strength.'
            ],
            improvement: [
              'Hold your stretches longer - allow the muscles to truly release.',
              'Focus on your breathing - it\'s the bridge between body and mind.',
              'Consider adding meditation to enhance your flexibility practice.',
              'Your hip flexors need attention - spend more time on them.',
              'Balance is key - work both sides equally for harmony.'
            ],
            greeting: [
              'Welcome to the path of mindful movement 🧘‍♂️',
              'Let us cultivate flexibility in body, mind, and spirit.',
              'Today we stretch not just muscles, but limitations.',
              'Inner peace begins with outer flexibility.'
            ]
          },
          active: true
        },
        {
          name: 'Coach Thunder',
          specialty: 'general',
          personality: 'challenging',
          experience: 85,
          avatar: '⚡',
          description: 'High-energy coach who adapts to any fitness challenge',
          stats: { strength: 85, endurance: 85, intelligence: 75 },
          responses: {
            workoutComplete: [
              'BOOM! That\'s what I\'m talking about! ⚡ Electricity in motion!',
              'You just electrified that workout! The energy is REAL!',
              'Lightning doesn\'t strike twice - but champions train every day!',
              'That workout had more energy than a thunderstorm! Amazing!',
              'You\'re not just working out - you\'re POWERING UP! ⚡'
            ],
            motivation: [
              'Energy is everything! Bring that THUNDER! ⚡',
              'No excuses, no shortcuts - just pure POWER!',
              'Champions don\'t wait for motivation - they CREATE it!',
              'You\'ve got lightning in your veins - USE IT!',
              'Storm through those limits! Break every barrier!'
            ],
            improvement: [
              'More INTENSITY! I know you\'ve got another gear!',
              'Speed up that tempo - let\'s see some LIGHTNING moves!',
              'Your form is good, but your POWER can be GREATER!',
              'Don\'t just exercise - EXPLODE through every rep!',
              'Challenge accepted! Now let\'s SUPERCHARGE your routine!'
            ],
            greeting: [
              'Ready to bring the THUNDER?! ⚡ Let\'s ENERGIZE!',
              'Time to ELECTRIFY your fitness! Charge up!',
              'Lightning mode: ACTIVATED! Let\'s storm this workout!',
              'Bring that HIGH VOLTAGE energy! I\'m pumped!'
            ]
          },
          active: true
        },
        {
          name: 'Mentor Grace',
          specialty: 'general',
          personality: 'supportive',
          experience: 90,
          avatar: '🌟',
          description: 'Wise and encouraging guide for sustainable fitness journey',
          stats: { strength: 75, endurance: 85, intelligence: 95 },
          responses: {
            workoutComplete: [
              'Beautiful work! You\'re growing stronger every day 🌟',
              'I\'m so proud of your dedication and consistency!',
              'Your progress may be gradual, but it\'s absolutely real.',
              'Every workout is an investment in your future self.',
              'You showed up, you gave your best - that\'s what matters most.'
            ],
            motivation: [
              'You are capable of more than you know.',
              'Progress isn\'t always linear, but it\'s always valuable.',
              'Your effort today creates the strength you\'ll need tomorrow.',
              'Small steps taken consistently lead to big transformations.',
              'Believe in yourself - I certainly believe in you!'
            ],
            improvement: [
              'Consider this gentle adjustment to optimize your form...',
              'You\'re doing great! Here\'s how we can make it even better.',
              'Listen to your body - it will guide you to the right intensity.',
              'Let\'s build on your strengths while addressing areas for growth.',
              'Remember, sustainable progress beats unsustainable perfection.'
            ],
            greeting: [
              'Hello there! Ready for another step on your journey? 🌟',
              'I\'m here to support you every step of the way.',
              'Let\'s make today\'s workout meaningful and enjoyable!',
              'Your future self will thank you for what we do today.'
            ]
          },
          active: true
        }
      ];

      await AITrainer.insertMany(defaultTrainers);
      console.log('🤖 AI Trainers initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize AI trainers:', error.message);
    }
  }

  // Get all active trainers
  static async getTrainers() {
    try {
      if (!AITrainer) {
        // Return fallback trainers if database is not available
        return this.getFallbackTrainers();
      }
      
      const trainers = await AITrainer.find({ active: true });
      return trainers.length > 0 ? trainers : this.getFallbackTrainers();
    } catch (error) {
      console.error('Error getting trainers:', error);
      return this.getFallbackTrainers();
    }
  }

  // Fallback trainers for when database is not available
  static getFallbackTrainers() {
    return [
      {
        _id: 'coach_mike',
        name: 'Coach Mike',
        specialty: 'strength',
        personality: 'motivational',
        experience: 95,
        avatar: '💪',
        description: 'The ultimate strength coach who pushes you beyond your limits',
        stats: { strength: 95, endurance: 75, intelligence: 80 },
        getResponse: (category) => {
          const responses = {
            workoutComplete: 'Beast mode activated! 💪 You crushed that workout!',
            motivation: 'Pain is temporary, but quitting lasts forever!',
            improvement: 'I see room for improvement in your form. Let\'s work on that!',
            greeting: 'Ready to build some serious muscle? Let\'s do this! 💪'
          };
          return responses[category] || responses.motivation;
        }
      },
      {
        _id: 'dr_sarah',
        name: 'Dr. Sarah',
        specialty: 'endurance',
        personality: 'analytical',
        experience: 88,
        avatar: '🏃‍♀️',
        description: 'Expert in cardiovascular fitness and endurance optimization',
        stats: { strength: 70, endurance: 95, intelligence: 90 },
        getResponse: (category) => {
          const responses = {
            workoutComplete: 'Excellent cardiovascular performance! Your heart is getting stronger 💓',
            motivation: 'Endurance is built mile by mile, breath by breath.',
            improvement: 'Consider incorporating interval training for better results.',
            greeting: 'Ready to optimize your cardiovascular performance? 🏃‍♀️'
          };
          return responses[category] || responses.motivation;
        }
      },
      {
        _id: 'zen_liu',
        name: 'Zen Master Liu',
        specialty: 'flexibility',
        personality: 'supportive',
        experience: 92,
        avatar: '🧘‍♂️',
        description: 'Master of mindful movement, flexibility, and mental wellness',
        stats: { strength: 60, endurance: 80, intelligence: 95 },
        getResponse: (category) => {
          const responses = {
            workoutComplete: 'Beautiful mindful movement! Your body and spirit are aligning 🧘‍♂️',
            motivation: 'Flexibility of body creates flexibility of mind.',
            improvement: 'Focus on your breathing - it\'s the bridge between body and mind.',
            greeting: 'Welcome to the path of mindful movement 🧘‍♂️'
          };
          return responses[category] || responses.motivation;
        }
      }
    ];
  }

  // Get trainer by ID
  static async getTrainerById(trainerId) {
    try {
      if (!AITrainer) {
        const fallbackTrainers = this.getFallbackTrainers();
        return fallbackTrainers.find(t => t._id === trainerId || t.name.toLowerCase().includes(trainerId.toLowerCase()));
      }
      
      const trainer = await AITrainer.findById(trainerId);
      if (!trainer) {
        // Try to find by name as fallback
        const trainerByName = await AITrainer.findOne({ 
          name: { $regex: trainerId, $options: 'i' } 
        });
        return trainerByName;
      }
      return trainer;
    } catch (error) {
      console.error('Error getting trainer by ID:', error);
      const fallbackTrainers = this.getFallbackTrainers();
      return fallbackTrainers.find(t => t._id === trainerId);
    }
  }

  // Get trainer response
  static async getTrainerResponse(trainerId, category = 'motivation') {
    try {
      const trainer = await this.getTrainerById(trainerId);
      if (!trainer) {
        return "Keep up the great work! You're getting stronger every day! 💪";
      }

      if (trainer.getResponse) {
        return trainer.getResponse(category);
      }

      // Database trainer object
      const responses = trainer.responses && trainer.responses[category];
      if (responses && responses.length > 0) {
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
      }

      return "Keep pushing forward! Every workout counts! 🔥";
    } catch (error) {
      console.error('Error getting trainer response:', error);
      return "You're doing amazing! Stay consistent and results will follow! ⭐";
    }
  }

  // Analyze user workouts
  static async analyzeUserWorkouts(userId) {
    try {
      let workouts = [];
      
      // Try to get workouts from database
      if (Workout && mongoose.connection.readyState === 1) {
        try {
          workouts = await Workout.find({ userId }).sort({ createdAt: -1 }).limit(30);
        } catch (dbError) {
          console.warn('Could not fetch workouts from database:', dbError.message);
        }
      }

      // Analyze workouts or provide default analysis
      const analysis = {
        totalWorkouts: workouts.length,
        avgDuration: workouts.length > 0 ? 
          workouts.reduce((sum, w) => sum + (w.workoutData?.duration || 30), 0) / workouts.length : 30,
        weeklyFrequency: Math.min(workouts.length / 4, 7), // Rough weekly estimate
        consistencyScore: workouts.length > 0 ? Math.min((workouts.length / 10) * 100, 100) : 0,
        fitnessLevel: 'intermediate',
        preferredType: 'cardio',
        suggestions: [],
        recommendedTrainer: 'Coach Mike',
        weeklyGoal: 'Complete 3-4 workouts this week',
        nextWorkout: 'Try a 30-minute cardio session',
        motivationalMessage: 'You\'re building great habits! Keep it up! 🎯'
      };

      // Analyze workout types if we have data
      if (workouts.length > 0) {
        const typeCount = workouts.reduce((acc, workout) => {
          const type = workout.workoutData?.type || 'cardio';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        analysis.preferredType = Object.keys(typeCount).reduce((a, b) => 
          typeCount[a] > typeCount[b] ? a : b
        );

        // Set fitness level based on workout count and duration
        if (workouts.length < 5) analysis.fitnessLevel = 'beginner';
        else if (workouts.length < 15) analysis.fitnessLevel = 'intermediate';
        else analysis.fitnessLevel = 'advanced';

        // Determine recommended trainer based on analysis
        if (analysis.preferredType === 'strength') {
          analysis.recommendedTrainer = 'Coach Mike';
        } else if (analysis.preferredType === 'cardio') {
          analysis.recommendedTrainer = 'Dr. Sarah';
        } else if (analysis.preferredType === 'flexibility') {
          analysis.recommendedTrainer = 'Zen Master Liu';
        } else {
          analysis.recommendedTrainer = 'Mentor Grace';
        }

        // Generate suggestions
        if (analysis.weeklyFrequency < 3) {
          analysis.suggestions.push('Try to increase workout frequency to 3-4 times per week');
        }
        if (analysis.avgDuration < 20) {
          analysis.suggestions.push('Consider extending your workouts to 20-30 minutes');
        }
        if (analysis.consistencyScore < 70) {
          analysis.suggestions.push('Focus on building consistency - small daily efforts add up!');
        }
      } else {
        // Default suggestions for new users
        analysis.suggestions = [
          'Start with 2-3 short workouts per week',
          'Focus on building the habit first, then increase intensity',
          'Try different types of exercises to find what you enjoy'
        ];
      }

      return analysis;
      
    } catch (error) {
      console.error('Error analyzing user workouts:', error);
      
      // Return default analysis on error
      return {
        totalWorkouts: 0,
        avgDuration: 30,
        weeklyFrequency: 2,
        consistencyScore: 0,
        fitnessLevel: 'beginner',
        preferredType: 'cardio',
        suggestions: [
          'Start your fitness journey with small, consistent steps',
          'Set realistic goals and celebrate small wins',
          'Listen to your body and progress gradually'
        ],
        recommendedTrainer: 'Mentor Grace',
        weeklyGoal: 'Complete your first workout this week',
        nextWorkout: 'Try a 15-minute beginner-friendly session',
        motivationalMessage: 'Every expert was once a beginner. Your journey starts now! 🌟'
      };
    }
  }

  // Get workout completion response
  static async getWorkoutCompletionResponse(userId, workoutData) {
    try {
      const analysis = await this.analyzeUserWorkouts(userId);
      const trainers = await this.getTrainers();
      const trainer = trainers.find(t => t.name === analysis.recommendedTrainer) || trainers[0];
      
      const response = trainer.getResponse ? 
        trainer.getResponse('workoutComplete') : 
        (trainer.responses?.workoutComplete?.[0] || "Amazing workout! You're getting stronger! 💪");

      return {
        message: response,
        trainerName: trainer.name,
        trainerAvatar: trainer.avatar,
        analysis: {
          workoutCount: analysis.totalWorkouts + 1,
          suggestion: analysis.suggestions[0] || 'Keep up the excellent work!',
          nextGoal: analysis.weeklyGoal
        }
      };
    } catch (error) {
      console.error('Error getting workout completion response:', error);
      return {
        message: "Outstanding workout! You're building incredible habits! 🔥",
        trainerName: 'AI Trainer',
        trainerAvatar: '🏋️‍♂️',
        analysis: {
          workoutCount: 1,
          suggestion: 'Consistency is key - keep showing up!',
          nextGoal: 'Complete another workout this week'
        }
      };
    }
  }

  // Get recommended trainer for user
  static async getRecommendedTrainer(userId) {
    try {
      const analysis = await this.analyzeUserWorkouts(userId);
      const trainers = await this.getTrainers();
      const recommendedTrainer = trainers.find(t => t.name === analysis.recommendedTrainer) || trainers[0];

      return {
        trainer: {
          id: recommendedTrainer._id || recommendedTrainer.id,
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
      };
    } catch (error) {
      console.error('Error getting recommended trainer:', error);
      const fallbackTrainers = this.getFallbackTrainers();
      return {
        trainer: {
          id: fallbackTrainers[0]._id,
          name: fallbackTrainers[0].name,
          specialty: fallbackTrainers[0].specialty,
          personality: fallbackTrainers[0].personality,
          avatar: fallbackTrainers[0].avatar,
          description: fallbackTrainers[0].description,
          reason: 'Recommended for beginners'
        },
        analysis: {
          fitnessLevel: 'beginner',
          preferredType: 'general',
          weeklyFrequency: 0,
          consistencyScore: 0
        }
      };
    }
  }
}

export default AITrainerService;