// DataService.ts - Integrate your training datasets
// Place in: imfiit/src/services/DataService.ts

import ocrData from '../../data/ocr-training.json';
import chatbotData from '../../data/chatbot-training.json';
import battleData from '../../data/battle-training.json';

export interface OCRTrainingEntry {
  id: string;
  app_source: string;
  extracted_text: string;
  parsed_data: {
    type: string;
    duration_minutes: number;
    distance_km?: number;
    calories: number;
    heart_rate_avg?: number;
    heart_rate_max?: number;
    steps?: number;
    date: string;
  };
  confidence_score: number;
  is_valid: boolean;
  anti_cheat_flags: string[];
}

export interface ChatbotConversation {
  conversation_id: string;
  user_profile: {
    fitness_level: string;
    goals: string[];
    age: number;
    injuries?: string[];
  };
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    intent: string;
    suggestions?: string[];
    action_items?: string[];
  }>;
  topics: string[];
  outcome: string;
}

export interface BattleScenario {
  battle_id: string;
  player1: PlayerData;
  player2: PlayerData;
  battle_log: BattleTurn[];
  winner: 'player1' | 'player2';
  battle_duration_seconds: number;
  total_damage_dealt: {
    player1: number;
    player2: number;
  };
}

interface PlayerData {
  username: string;
  level: number;
  stats: {
    strength: number;
    endurance: number;
    agility: number;
    defense: number;
  };
  recent_workouts: string[];
  win_rate: number;
}

interface BattleTurn {
  turn: number;
  attacker: string;
  move: string;
  damage: number;
  critical: boolean;
  description: string;
}

class DataService {
  private ocrTrainingData: OCRTrainingEntry[];
  private chatbotData: ChatbotConversation[];
  private battleData: BattleScenario[];

  constructor() {
    // Load and validate datasets
    this.ocrTrainingData = ocrData.ocr_training_data || [];
    this.chatbotData = chatbotData.chatbot_training_data || [];
    this.battleData = battleData.battle_training_data || [];
    
    console.log(`✅ Loaded ${this.ocrTrainingData.length} OCR training samples`);
    console.log(`✅ Loaded ${this.chatbotData.length} chatbot conversations`);
    console.log(`✅ Loaded ${this.battleData.length} battle scenarios`);
  }

  // OCR Methods
  getOCRTrainingSample(index?: number): OCRTrainingEntry {
    if (index !== undefined && index < this.ocrTrainingData.length) {
      return this.ocrTrainingData[index];
    }
    return this.ocrTrainingData[Math.floor(Math.random() * this.ocrTrainingData.length)];
  }

  validateOCRResult(extractedText: string): {
    isValid: boolean;
    confidence: number;
    flags: string[];
  } {
    // Compare against training data patterns
    const sample = this.findSimilarOCRPattern(extractedText);
    
    if (!sample) {
      return { isValid: false, confidence: 0.3, flags: ['no_pattern_match'] };
    }

    // Check for suspicious patterns
    const flags: string[] = [];
    
    // Check for unrealistic values
    if (extractedText.includes('999') || extractedText.includes('10000')) {
      flags.push('suspicious_values');
    }
    
    // Check for known fake patterns from training data
    const fakePatterns = this.ocrTrainingData
      .filter(d => !d.is_valid)
      .map(d => d.extracted_text.substring(0, 50));
    
    if (fakePatterns.some(pattern => extractedText.includes(pattern))) {
      flags.push('matches_fake_pattern');
    }

    return {
      isValid: flags.length === 0,
      confidence: flags.length === 0 ? sample.confidence_score : 0.4,
      flags
    };
  }

  private findSimilarOCRPattern(text: string): OCRTrainingEntry | null {
  const lowerText = text.toLowerCase();
  
  // 🔧 EXPANDED KEYWORDS - Now includes Samsung Health daily summary terms
  const fitnessKeywords = [
    // Original workout terms
    'workout', 'exercise', 'training',
    
    // Duration/Time terms
    'duration', 'time', 'active time', 'mins', 'minutes', 'min',
    
    // Calories terms  
    'calories', 'kcal', 'cal', 'energy', 'activity calories', 'burnt calories',
    
    // Distance terms
    'distance', 'km', 'miles', 'mi', 'distance while active',
    
    // Heart rate terms
    'heart rate', 'hr', 'bpm', 'avg heart rate',
    
    // Step terms (Samsung Health specific)
    'steps', 'step', 'step count',
    
    // App identifiers
    'samsung health', 'apple health', 'strava', 'fitbit', 'garmin',
    'myfitnesspal', 'google fit'
  ];

  // Count keyword matches
  const matchCount = fitnessKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length;

  console.log(`🔍 Pattern matching: Found ${matchCount} fitness keywords in text`);
  console.log(`📝 Text sample: ${text.substring(0, 100)}...`);

  // 🎯 LOWERED THRESHOLD - Now requires only 2 matches instead of 3
  // This allows Samsung Health daily summaries to pass
  if (matchCount >= 2) {
    const validEntry = this.ocrTrainingData.find(d => d.is_valid);
    console.log(`✅ Pattern match found! Using training entry confidence.`);
    return validEntry || null;
  }

  console.log(`❌ Pattern match failed. Need at least 2 fitness keywords, found ${matchCount}`);
  return null;
}

// 🔧 ALSO UPDATE - Make validation more lenient for daily summaries  
validateOCRResult(extractedText: string): {
  isValid: boolean;
  confidence: number;
  flags: string[];
} {
  const lowerText = extractedText.toLowerCase();
  
  // 🚀 QUICK CHECK - If it's clearly Samsung Health, approve it immediately
  if (lowerText.includes('samsung health') && 
      (lowerText.includes('steps') || lowerText.includes('calories') || lowerText.includes('distance'))) {
    console.log('🏃‍♂️ Samsung Health detected - auto-approving!');
    return { 
      isValid: true, 
      confidence: 0.9, 
      flags: [] 
    };
  }

  // Compare against training data patterns
  const sample = this.findSimilarOCRPattern(extractedText);
  
  if (!sample) {
    return { isValid: false, confidence: 0.3, flags: ['no_pattern_match'] };
  }

  // Check for suspicious patterns
  const flags: string[] = [];
  
  // 🔧 UPDATED - More realistic suspicious value detection
  if (extractedText.includes('999999') || extractedText.includes('100000')) {
    flags.push('suspicious_values');
  }
  
  // Check for known fake patterns from training data
  const fakePatterns = this.ocrTrainingData
    .filter(d => !d.is_valid)
    .map(d => d.extracted_text.substring(0, 50));
  
  if (fakePatterns.some(pattern => extractedText.includes(pattern))) {
    flags.push('matches_fake_pattern');
  }

  return {
    isValid: flags.length === 0,
    confidence: flags.length === 0 ? sample.confidence_score : 0.4,
    flags
  };
}

  // Chatbot Methods
  getChatbotResponse(userMessage: string, context?: any): {
    response: string;
    suggestions: string[];
    intent: string;
  } {
    // Find relevant conversation based on message content
    const relevantConv = this.findRelevantConversation(userMessage);
    
    if (!relevantConv) {
      return {
        response: "I understand you have a fitness question. Could you provide more details about your workout or what you'd like help with?",
        suggestions: ['workout_plan', 'form_check', 'nutrition'],
        intent: 'clarification'
      };
    }

    // Find similar user message in the conversation
    const userMessages = relevantConv.messages.filter(m => m.role === 'user');
    const similarities = userMessages.map(msg => ({
      msg,
      similarity: this.calculateSimilarity(userMessage.toLowerCase(), msg.content.toLowerCase())
    }));
    
    const bestMatch = similarities.sort((a, b) => b.similarity - a.similarity)[0];
    
    // Get the assistant's response after the matched message
    const msgIndex = relevantConv.messages.indexOf(bestMatch.msg);
    const assistantResponse = relevantConv.messages[msgIndex + 1];
    
    if (assistantResponse && assistantResponse.role === 'assistant') {
      return {
        response: this.personalizeResponse(assistantResponse.content, context),
        suggestions: assistantResponse.suggestions || [],
        intent: assistantResponse.intent
      };
    }

    return {
      response: "Let me help you with your fitness journey. What specific aspect would you like to work on?",
      suggestions: ['strength', 'cardio', 'flexibility'],
      intent: 'general_help'
    };
  }

  private findRelevantConversation(message: string): ChatbotConversation | null {
    const keywords = message.toLowerCase().split(' ');
    
    // Score each conversation based on topic relevance
    const scores = this.chatbotData.map(conv => {
      const topicScore = conv.topics.reduce((score, topic) => {
        return score + (keywords.some(k => topic.includes(k)) ? 1 : 0);
      }, 0);
      
      const messageScore = conv.messages.reduce((score, msg) => {
        return score + keywords.filter(k => 
          msg.content.toLowerCase().includes(k)
        ).length;
      }, 0);
      
      return { conv, score: topicScore * 2 + messageScore };
    });
    
    const best = scores.sort((a, b) => b.score - a.score)[0];
    return best.score > 0 ? best.conv : null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(w => words2.includes(w));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private personalizeResponse(template: string, context?: any): string {
    if (!context) return template;
    
    // Replace placeholders with actual user data
    let response = template;
    
    if (context.userName) {
      response = response.replace(/\byou\b/gi, context.userName);
    }
    
    if (context.fitnessLevel) {
      response = response.replace(/\[fitness_level\]/g, context.fitnessLevel);
    }
    
    return response;
  }

  // Battle Methods
  getBattleScenario(player1Stats: any, player2Stats: any): BattleScenario {
    // Find a battle scenario with similar stat distributions
    const bestMatch = this.battleData.reduce((best, scenario) => {
      const statDiff1 = Math.abs(scenario.player1.stats.strength - player1Stats.strength) +
                       Math.abs(scenario.player1.stats.endurance - player1Stats.endurance);
      const statDiff2 = Math.abs(scenario.player2.stats.strength - player2Stats.strength) +
                       Math.abs(scenario.player2.stats.endurance - player2Stats.endurance);
      const totalDiff = statDiff1 + statDiff2;
      
      if (!best || totalDiff < best.diff) {
        return { scenario, diff: totalDiff };
      }
      return best;
    }, null as any);
    
    return bestMatch?.scenario || this.battleData[0];
  }

  simulateBattleTurn(
    attacker: any,
    defender: any,
    turnNumber: number
  ): BattleTurn {
    // Use training data to generate realistic battle turns
    const allTurns = this.battleData.flatMap(b => b.battle_log);
    const similarTurns = allTurns.filter(t => t.turn === turnNumber);
    
    if (similarTurns.length > 0) {
      const template = similarTurns[Math.floor(Math.random() * similarTurns.length)];
      
      // Calculate damage based on stats
      const baseDamage = attacker.strength * 0.5 + attacker.agility * 0.3;
      const defense = defender.defense * 0.4;
      const damage = Math.max(5, Math.floor(baseDamage - defense + Math.random() * 10));
      
      return {
        turn: turnNumber,
        attacker: attacker.username,
        move: template.move,
        damage,
        critical: Math.random() < 0.15,
        description: template.description.replace(/\w+/, attacker.username)
      };
    }
    
    // Fallback
    return {
      turn: turnNumber,
      attacker: attacker.username,
      move: 'basic_attack',
      damage: Math.floor(attacker.strength * 0.3),
      critical: false,
      description: `${attacker.username} attacks!`
    };
  }

  // Export methods for testing
  getAllOCRSamples(): OCRTrainingEntry[] {
    return this.ocrTrainingData;
  }

  getAllConversations(): ChatbotConversation[] {
    return this.chatbotData;
  }

  getAllBattleScenarios(): BattleScenario[] {
    return this.battleData;
  }

  // Training data statistics
  getDataStats() {
    return {
      ocr: {
        total: this.ocrTrainingData.length,
        valid: this.ocrTrainingData.filter(d => d.is_valid).length,
        invalid: this.ocrTrainingData.filter(d => !d.is_valid).length,
        avgConfidence: this.ocrTrainingData.reduce((sum, d) => sum + d.confidence_score, 0) / this.ocrTrainingData.length
      },
      chatbot: {
        total: this.chatbotData.length,
        avgTurns: this.chatbotData.reduce((sum, c) => sum + c.messages.length, 0) / this.chatbotData.length,
        topics: [...new Set(this.chatbotData.flatMap(c => c.topics))].length
      },
      battles: {
        total: this.battleData.length,
        avgDuration: this.battleData.reduce((sum, b) => sum + b.battle_duration_seconds, 0) / this.battleData.length,
        player1Wins: this.battleData.filter(b => b.winner === 'player1').length
      }
    };
  }
}

// Singleton instance
const dataService = new DataService();
export default dataService;

// Test function to verify data loading
export function testDataService() {
  console.log('🧪 Testing Data Service...');
  
  // Test OCR
  const ocrSample = dataService.getOCRTrainingSample();
  console.log('OCR Sample:', ocrSample);
  
  const validation = dataService.validateOCRResult('Workout Summary Duration 30:00 Calories 250');
  console.log('OCR Validation:', validation);
  
  // Test Chatbot
  const response = dataService.getChatbotResponse('My knee hurts after running');
  console.log('Chatbot Response:', response);
  
  // Test Battle
  const battleScenario = dataService.getBattleScenario(
    { strength: 80, endurance: 70 },
    { strength: 75, endurance: 85 }
  );
  console.log('Battle Scenario:', battleScenario);
  
  // Show stats
  console.log('Data Statistics:', dataService.getDataStats());
}