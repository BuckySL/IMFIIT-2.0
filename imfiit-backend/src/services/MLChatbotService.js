// ============================================================================
// ML FITNESS CHATBOT INTEGRATION FOR NODE.JS BACKEND
// File: imfiit-backend/src/services/MLChatbotService.js
// ============================================================================

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MLChatbotService {
  constructor() {
    this.pythonProcess = null;
    this.isInitialized = false;
    this.userProfiles = new Map();
    this.conversationHistory = new Map();
  }

  /**
   * Initialize the Python ML chatbot process
   */
  async initialize() {
    try {
      // Check if Python script exists
      const scriptPath = path.join(__dirname, '../ml/fitness_chatbot.py');
      await fs.access(scriptPath);
      
      // Start Python process
      this.pythonProcess = spawn('python', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.pythonProcess.stderr.on('data', (data) => {
        console.error(`Python Error: ${data}`);
      });

      this.isInitialized = true;
      console.log('ML Chatbot initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize ML Chatbot:', error);
      // Fallback to JavaScript implementation if Python fails
      this.isInitialized = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Send request to Python ML chatbot
   */
  async sendToPython(data) {
    return new Promise((resolve, reject) => {
      if (!this.pythonProcess) {
        reject(new Error('Python process not initialized'));
        return;
      }

      const request = JSON.stringify(data) + '\n';
      let responseData = '';

      const onData = (chunk) => {
        responseData += chunk.toString();
        try {
          const response = JSON.parse(responseData);
          this.pythonProcess.stdout.removeListener('data', onData);
          resolve(response);
        } catch (e) {
          // Continue collecting data
        }
      };

      this.pythonProcess.stdout.on('data', onData);
      this.pythonProcess.stdin.write(request);

      setTimeout(() => {
        this.pythonProcess.stdout.removeListener('data', onData);
        reject(new Error('Python process timeout'));
      }, 5000);
    });
  }

  /**
   * Create or update user profile
   */
  async createUserProfile(userData) {
    try {
      // Calculate BMI
      const heightM = userData.height / 100;
      const bmi = userData.weight / (heightM * heightM);
      
      const profile = {
        userId: userData.userId,
        age: userData.age,
        weight: userData.weight,
        height: userData.height,
        gender: userData.gender,
        activityLevel: userData.activityLevel || 'moderate',
        bmi: Math.round(bmi * 10) / 10,
        bmiCategory: this.categorizeBMI(bmi),
        fitnessLevel: userData.fitnessLevel || 'beginner',
        goals: userData.goals || ['general_fitness'],
        healthConditions: userData.healthConditions || [],
        dietaryRestrictions: userData.dietaryRestrictions || []
      };

      this.userProfiles.set(userData.userId, profile);

      // If Python process is available, send to ML backend
      if (this.isInitialized) {
        const response = await this.sendToPython({
          action: 'create_profile',
          user_data: profile
        });
        return response;
      }

      // Fallback to JavaScript assessment
      return this.generateJSAssessment(profile);
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Process user message with ML
   */
  async processMessage(userId, message) {
    try {
      // Check if user profile exists
      if (!this.userProfiles.has(userId)) {
        return {
          response: "I need your basic information first. Please provide your age, weight, height, and gender.",
          requiresProfile: true
        };
      }

      const profile = this.userProfiles.get(userId);

      // Store conversation history
      if (!this.conversationHistory.has(userId)) {
        this.conversationHistory.set(userId, []);
      }

      const history = this.conversationHistory.get(userId);
      history.push({
        timestamp: new Date().toISOString(),
        message: message,
        type: 'user'
      });

      // If Python ML is available, use it
      if (this.isInitialized) {
        const response = await this.sendToPython({
          action: 'process_message',
          user_id: userId,
          message: message
        });
        
        history.push({
          timestamp: new Date().toISOString(),
          message: response.response,
          type: 'bot'
        });
        
        return response;
      }

      // Fallback to JavaScript intent classification
      const intent = this.classifyIntent(message);
      const response = this.generateResponse(profile, intent, message);
      
      history.push({
        timestamp: new Date().toISOString(),
        message: response.response,
        type: 'bot'
      });

      return response;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        response: "I'm having trouble processing your request. Please try again.",
        error: error.message
      };
    }
  }

  /**
   * JavaScript fallback: Categorize BMI
   */
  categorizeBMI(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    if (bmi < 35) return 'obese_class_1';
    if (bmi < 40) return 'obese_class_2';
    return 'obese_class_3';
  }

  /**
   * JavaScript fallback: Classify intent from message
   */
  classifyIntent(message) {
    const lowerMessage = message.toLowerCase();
    
    const intentPatterns = {
      greeting: ['hi', 'hello', 'hey', 'good morning', 'good evening'],
      bmi_query: ['bmi', 'body mass', 'weight status', 'overweight', 'underweight'],
      diet_plan: ['diet', 'meal', 'eat', 'nutrition', 'calories', 'food'],
      workout_plan: ['workout', 'exercise', 'training', 'gym', 'fitness'],
      health_risk: ['risk', 'disease', 'diabetes', 'heart', 'health problem'],
      progress: ['progress', 'track', 'measure', 'improvement', 'results'],
      motivation: ['motivate', 'tired', 'give up', 'can\'t', 'help me', 'struggling'],
      supplement: ['supplement', 'vitamin', 'protein', 'creatine', 'whey'],
      injury: ['injury', 'pain', 'hurt', 'sore', 'prevent'],
      recovery: ['recover', 'rest', 'sleep', 'fatigue'],
      hydration: ['water', 'drink', 'hydration', 'thirsty']
    };

    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  /**
   * JavaScript fallback: Generate response based on intent
   */
  generateResponse(profile, intent, message) {
    const responses = {
      greeting: () => this.handleGreeting(profile),
      bmi_query: () => this.handleBMIQuery(profile),
      diet_plan: () => this.handleDietPlan(profile),
      workout_plan: () => this.handleWorkoutPlan(profile),
      health_risk: () => this.handleHealthRisk(profile),
      progress: () => this.handleProgressTracking(profile),
      motivation: () => this.handleMotivation(profile),
      supplement: () => this.handleSupplementInfo(profile),
      injury: () => this.handleInjuryPrevention(profile),
      recovery: () => this.handleRecovery(profile),
      hydration: () => this.handleHydration(profile),
      general: () => this.handleGeneral(profile)
    };

    const handler = responses[intent] || responses.general;
    return handler();
  }

  /**
   * JavaScript fallback: Generate initial assessment
   */
  generateJSAssessment(profile) {
    const bmr = this.calculateBMR(profile);
    const tdee = this.calculateTDEE(profile, bmr);
    const macros = this.calculateMacros(profile, tdee);
    const healthRisks = this.getHealthRisks(profile.bmiCategory);
    
    return {
      success: true,
      profile: {
        bmi: profile.bmi,
        category: profile.bmiCategory,
        fitness_level: profile.fitnessLevel
      },
      assessment: {
        bmi_analysis: {
          value: profile.bmi,
          category: profile.bmiCategory,
          interpretation: this.interpretBMI(profile.bmiCategory),
          ideal_weight_range: this.calculateIdealWeight(profile.height)
        },
        health_assessment: {
          potential_risks: healthRisks.risks,
          recommendations: healthRisks.recommendations,
          priority_actions: this.getPriorityActions(profile)
        },
        nutrition_plan: {
          bmr: bmr,
          tdee: tdee,
          daily_targets: macros,
          meal_timing: this.getMealTiming(profile),
          food_suggestions: this.getFoodSuggestions(profile)
        },
        workout_plan: this.generateWorkoutPlan(profile),
        timeline: this.generateTimeline(profile)
      }
    };
  }

  /**
   * Calculate Basal Metabolic Rate
   */
  calculateBMR(profile) {
    // Mifflin-St Jeor Equation
    if (profile.gender === 'male') {
      return Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5);
    } else {
      return Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161);
    }
  }

  /**
   * Calculate Total Daily Energy Expenditure
   */
  calculateTDEE(profile, bmr) {
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    const multiplier = activityMultipliers[profile.activityLevel] || 1.2;
    return Math.round(bmr * multiplier);
  }

  /**
   * Calculate macronutrient distribution
   */
  calculateMacros(profile, tdee) {
    let calories = tdee;
    let proteinRatio = 0.25;
    let fatRatio = 0.30;
    let carbRatio = 0.45;

    // Adjust based on goals
    if (profile.goals.includes('weight_loss')) {
      calories = tdee - 500; // 500 calorie deficit
      proteinRatio = 0.35;
      fatRatio = 0.25;
      carbRatio = 0.40;
    } else if (profile.goals.includes('muscle_gain')) {
      calories = tdee + 300; // 300 calorie surplus
      proteinRatio = 0.30;
      fatRatio = 0.25;
      carbRatio = 0.45;
    }

    return {
      calories: Math.round(calories),
      protein: Math.round((calories * proteinRatio) / 4), // 4 cal/g
      carbs: Math.round((calories * carbRatio) / 4), // 4 cal/g
      fats: Math.round((calories * fatRatio) / 9) // 9 cal/g
    };
  }

  /**
   * Get health risks based on BMI category
   */
  getHealthRisks(category) {
    const risks = {
      underweight: {
        risks: ['Malnutrition', 'Osteoporosis', 'Weakened immune system'],
        recommendations: ['Increase caloric intake', 'Focus on nutrient-dense foods', 'Strength training']
      },
      normal: {
        risks: ['Low risk of weight-related diseases'],
        recommendations: ['Maintain healthy habits', 'Regular exercise', 'Balanced diet']
      },
      overweight: {
        risks: ['Type 2 diabetes', 'High blood pressure', 'Heart disease'],
        recommendations: ['Create caloric deficit', 'Regular cardio', 'Monitor health markers']
      },
      obese_class_1: {
        risks: ['Type 2 diabetes', 'Cardiovascular disease', 'Joint problems'],
        recommendations: ['Medical consultation', 'Structured weight loss', 'Low-impact exercise']
      },
      obese_class_2: {
        risks: ['Severe cardiovascular risk', 'Type 2 diabetes', 'Sleep disorders'],
        recommendations: ['Medical supervision', 'Gradual weight loss', 'Water-based exercises']
      },
      obese_class_3: {
        risks: ['Life-threatening conditions', 'Severe diabetes risk', 'Mobility issues'],
        recommendations: ['Immediate medical attention', 'Bariatric consultation', 'Supervised exercise']
      }
    };

    return risks[category] || risks.normal;
  }

  /**
   * Response handlers
   */
  handleGreeting(profile) {
    return {
      response: `Hello! I'm your AI fitness coach. Based on your profile, your BMI is ${profile.bmi} (${profile.bmiCategory}). How can I help you today? I can provide diet plans, workout routines, health advice, and track your progress.`,
      suggestions: [
        'Show me my diet plan',
        'Create a workout routine',
        'What are my health risks?',
        'How can I lose weight?'
      ],
      data: {
        bmi: profile.bmi,
        category: profile.bmiCategory
      }
    };
  }

  handleBMIQuery(profile) {
    const idealWeight = this.calculateIdealWeight(profile.height);
    const interpretation = this.interpretBMI(profile.bmiCategory);
    
    return {
      response: `Your BMI Analysis:\n\n📊 Current BMI: ${profile.bmi}\n📈 Category: ${profile.bmiCategory}\n⚖️ Current Weight: ${profile.weight} kg\n🎯 Ideal Weight Range: ${idealWeight.min}-${idealWeight.max} kg\n\n${interpretation}`,
      data: {
        bmi: profile.bmi,
        category: profile.bmiCategory,
        ideal_weight: idealWeight
      }
    };
  }

  handleDietPlan(profile) {
    const bmr = this.calculateBMR(profile);
    const tdee = this.calculateTDEE(profile, bmr);
    const macros = this.calculateMacros(profile, tdee);
    
    return {
      response: `Your Personalized Nutrition Plan:\n\n🔥 Daily Calorie Targets:\n• BMR: ${bmr} calories\n• TDEE: ${tdee} calories\n• Target: ${macros.calories} calories\n\n🥗 Macros:\n• Protein: ${macros.protein}g\n• Carbs: ${macros.carbs}g\n• Fats: ${macros.fats}g\n\n💧 Hydration: ${Math.round(profile.weight * 0.033)}L daily`,
      data: {
        bmr, tdee, macros,
        hydration: Math.round(profile.weight * 0.033)
      }
    };
  }

  handleWorkoutPlan(profile) {
    const plan = this.generateWorkoutPlan(profile);
    
    return {
      response: `Your Workout Plan:\n\n${plan.overview}\n\n📅 Weekly Schedule:\n${Object.entries(plan.days).map(([day, details]) => 
        `${day}: ${details.type} (${details.duration})`
      ).join('\n')}\n\nStart with this plan and adjust based on how your body responds!`,
      data: plan
    };
  }

  handleHealthRisk(profile) {
    const risks = this.getHealthRisks(profile.bmiCategory);
    
    return {
      response: `Health Risk Assessment:\n\n⚠️ Potential Risks:\n${risks.risks.map(r => `• ${r}`).join('\n')}\n\n✅ Recommendations:\n${risks.recommendations.map(r => `• ${r}`).join('\n')}`,
      data: risks
    };
  }

  handleProgressTracking(profile) {
    return {
      response: `Progress Tracking Guidelines:\n\n📊 What to Track:\n• Weight: Weekly\n• Measurements: Bi-weekly\n• Photos: Weekly\n• Performance: Each workout\n• Energy: Daily (1-10)\n• Sleep: Daily\n\n📈 Expected Timeline:\n• Week 1-2: Energy improvements\n• Week 3-4: 1-2 kg change\n• Month 2: Visible changes\n• Month 3: Significant improvements`,
      data: {
        metrics: ['weight', 'measurements', 'photos', 'performance', 'energy', 'sleep'],
        timeline: this.generateTimeline(profile)
      }
    };
  }

  handleMotivation(profile) {
    const quotes = [
      "Every workout counts!",
      "Progress is progress, no matter how slow.",
      "You're building a better life!",
      "The only bad workout is the one that didn't happen."
    ];
    
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    
    return {
      response: `💪 Motivation Boost:\n\n"${quote}"\n\nRemember:\n• Small actions lead to big results\n• You're already ${profile.fitnessLevel} level!\n• Every healthy choice is a victory\n\nYour goals: ${profile.goals.join(', ')}\n\nKeep pushing forward! You've got this!`,
      data: { quote, goals: profile.goals }
    };
  }

  handleSupplementInfo(profile) {
    return {
      response: `Supplement Guide:\n\n🏃 Basics:\n• Multivitamin: Daily\n• Vitamin D3: 1000-2000 IU\n• Omega-3: 1-2g daily\n\n💪 Performance:\n• Whey Protein: 20-40g post-workout\n• Creatine: 5g daily\n• Caffeine: 100-200mg pre-workout\n\n⚠️ Always consult a healthcare provider before starting supplements!`,
      data: {
        basic: ['Multivitamin', 'Vitamin D3', 'Omega-3'],
        performance: ['Whey Protein', 'Creatine', 'Caffeine']
      }
    };
  }

  handleInjuryPrevention(profile) {
    return {
      response: `Injury Prevention:\n\n🛡️ Before Exercise:\n• Warm-up: 5-10 min\n• Dynamic stretching\n• Proper hydration\n\n⚠️ During:\n• Focus on form\n• Full range of motion\n• Stop if sharp pain\n\n🔄 After:\n• Cool down: 5-10 min\n• Static stretching\n• Foam rolling\n\n💡 Recovery: 7-9 hours sleep, 1-2 rest days/week`,
      data: {
        warm_up: '5-10 minutes',
        cool_down: '5-10 minutes',
        rest_days: '1-2 per week'
      }
    };
  }

  handleRecovery(profile) {
    return {
      response: `Recovery Optimization:\n\n😴 Sleep: 7-9 hours\n🍽️ Nutrition: Protein within 2 hours post-workout\n💧 Hydration: ${Math.round(profile.weight * 0.035)}L daily\n🧘 Active Recovery: Light walking, yoga\n🛁 Tools: Foam rolling, stretching, ice baths\n\n📊 Need more recovery if:\n• Declining performance\n• Persistent fatigue\n• Poor sleep\n• Elevated heart rate`,
      data: {
        sleep_hours: '7-9',
        hydration: `${Math.round(profile.weight * 0.035)}L`,
        protein_timing: 'Within 2 hours post-workout'
      }
    };
  }

  handleHydration(profile) {
    const daily = Math.round(profile.weight * 0.035 * 10) / 10;
    const exercise = Math.round(profile.weight * 0.005 * 10) / 10;
    
    return {
      response: `Hydration Guidelines:\n\n💧 Daily: ${daily}L\n🏃 Exercise days: +${exercise}L per hour\n🌡️ Hot weather: +20-30%\n\n⏰ Schedule:\n• Wake up: 500ml\n• Morning: 750ml\n• Afternoon: 750ml\n• Evening: 500ml\n• Pre-workout: 500ml\n\n📊 Check: Pale yellow urine = good hydration`,
      data: {
        daily_intake: `${daily}L`,
        exercise_addition: `${exercise}L per hour`,
        total_training: `${daily + exercise}L`
      }
    };
  }

  handleGeneral(profile) {
    return {
      response: `I can help with:\n\n• Diet plans\n• Workout routines\n• Health assessments\n• Progress tracking\n• Supplements\n• Injury prevention\n• Recovery\n• Motivation\n\nYour Status:\n• BMI: ${profile.bmi}\n• Level: ${profile.fitnessLevel}\n• Goals: ${profile.goals.join(', ')}\n\nWhat would you like help with?`,
      data: {
        services: ['Diet', 'Workout', 'Health', 'Progress', 'Supplements', 'Recovery'],
        user_status: {
          bmi: profile.bmi,
          level: profile.fitnessLevel,
          goals: profile.goals
        }
      }
    };
  }

  /**
   * Helper methods
   */
  interpretBMI(category) {
    const interpretations = {
      underweight: "You're underweight. Focus on healthy weight gain through balanced nutrition.",
      normal: "You're in a healthy weight range. Maintain through balanced diet and exercise.",
      overweight: "You're slightly overweight. A modest caloric deficit can help.",
      obese_class_1: "You're in the obese range. Significant lifestyle changes recommended.",
      obese_class_2: "You're severely obese. Medical supervision strongly recommended.",
      obese_class_3: "You're morbidly obese. Immediate medical intervention necessary."
    };
    
    return interpretations[category] || "Unable to interpret BMI category";
  }

  calculateIdealWeight(heightCm) {
    const heightM = heightCm / 100;
    return {
      min: Math.round(18.5 * heightM * heightM * 10) / 10,
      max: Math.round(24.9 * heightM * heightM * 10) / 10
    };
  }

  getPriorityActions(profile) {
    const actions = [];
    
    if (profile.bmiCategory.includes('obese')) {
      actions.push("Consult healthcare provider");
    }
    
    if (profile.bmiCategory === 'underweight') {
      actions.push("Increase calories by 300-500 daily");
    } else if (profile.bmiCategory !== 'normal') {
      actions.push("Create 500 calorie deficit");
    }
    
    actions.push("Track food intake");
    actions.push("Exercise 30 min daily");
    actions.push("Sleep 7-9 hours");
    actions.push("Drink 2-3L water");
    
    return actions.slice(0, 5);
  }

  getMealTiming(profile) {
    if (profile.goals.includes('weight_loss')) {
      return {
        breakfast: '7-8 AM',
        lunch: '12-1 PM',
        snack: '3-4 PM',
        dinner: '6-7 PM',
        notes: 'No eating 3 hours before bed'
      };
    } else if (profile.goals.includes('muscle_gain')) {
      return {
        breakfast: '7 AM',
        snack_1: '10 AM',
        lunch: '1 PM',
        pre_workout: '3:30 PM',
        post_workout: 'Within 30 min',
        dinner: '7 PM',
        before_bed: '9:30 PM'
      };
    }
    
    return {
      breakfast: '7-9 AM',
      lunch: '12-1:30 PM',
      snack: '3-4 PM (optional)',
      dinner: '6:30-8 PM'
    };
  }

  getFoodSuggestions(profile) {
    const suggestions = {
      proteins: [],
      carbs: ['Brown rice', 'Oats', 'Sweet potato', 'Quinoa'],
      fats: ['Avocado', 'Nuts', 'Olive oil', 'Seeds'],
      vegetables: ['Broccoli', 'Spinach', 'Bell peppers'],
      fruits: ['Berries', 'Apples', 'Bananas']
    };
    
    if (profile.dietaryRestrictions.includes('vegetarian')) {
      suggestions.proteins = ['Tofu', 'Legumes', 'Eggs', 'Greek yogurt'];
    } else if (profile.dietaryRestrictions.includes('vegan')) {
      suggestions.proteins = ['Tofu', 'Legumes', 'Tempeh', 'Quinoa'];
    } else {
      suggestions.proteins = ['Chicken', 'Fish', 'Lean beef', 'Eggs'];
    }
    
    return suggestions;
  }

  generateWorkoutPlan(profile) {
    const level = profile.fitnessLevel;
    const frequency = level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5;
    const duration = level === 'beginner' ? '30 min' : level === 'intermediate' ? '45 min' : '60 min';
    
    const days = {};
    const workoutTypes = [
      { type: 'Full Body Strength', focus: 'Compound movements' },
      { type: 'Cardio', focus: 'Moderate intensity' },
      { type: 'HIIT', focus: 'High intensity intervals' },
      { type: 'Upper Body', focus: 'Push/Pull' },
      { type: 'Lower Body', focus: 'Legs and glutes' }
    ];
    
    for (let i = 0; i < frequency; i++) {
      const workout = workoutTypes[i % workoutTypes.length];
      days[`Day ${i + 1}`] = {
        type: workout.type,
        focus: workout.focus,
        duration: duration
      };
    }
    
    return {
      overview: `${frequency} days/week, ${duration} per session`,
      days: days,
      progression: 'Increase intensity 5-10% weekly',
      recovery: '1-2 rest days per week'
    };
  }

  generateTimeline(profile) {
    return {
      'Week 1-2': 'Adaptation phase',
      'Week 3-4': 'Initial changes',
      'Month 2': 'Visible progress',
      'Month 3': 'Significant results',
      'Month 6': 'Transformation'
    };
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
const mlChatbotService = new MLChatbotService();
export default mlChatbotService;

//imfiit-backend\src\services\MLChatbotService.js