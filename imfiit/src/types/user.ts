export type BodyType = 'fit-male' | 'fit-female' | 'skinny-male' | 'skinny-female' | 'obese-male' | 'obese-female' | 'overweight-male' | 'overweight-female';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface UserStats {
  strength: number;      // 0-100 based on workout intensity
  endurance: number;     // 0-100 based on workout frequency  
  level: number;         // Overall fitness level (1-50)
  experience: number;    // XP points for leveling up
  totalWorkouts: number; // Total workouts completed
  weeklyWorkouts: number; // Workouts this week
  lastWorkoutDate?: Date;
}

export interface UserProfile {
  id: string;
  telegramId: number;
  telegramUser: TelegramUser;
  walletAddress?: string;
  bodyType: BodyType;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
  
  // BMR Calculation data
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
}

export interface Workout {
  id: string;
  userId: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';
  exercises: Exercise[];
  duration: number; // in minutes
  intensity: 'low' | 'medium' | 'high';
  caloriesBurned?: number;
  date: Date;
  verified: boolean; // OCR verification status
  strengthGain: number; // Stats gained from this workout
  enduranceGain: number;
}

export interface Exercise {
  name: string;
  reps?: number;
  sets?: number;
  weight?: number; // in kg
  duration?: number; // in minutes for cardio
  distance?: number; // in km for running/walking
}

export interface UserPreferences {
  notifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  language: string;
  theme: 'dark' | 'light' | 'auto';
}