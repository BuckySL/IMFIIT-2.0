# ============================================================================
# PROFESSIONAL ML FITNESS CHATBOT BACKEND
# File: imfiit-backend/src/ml/fitness_chatbot.py
# ============================================================================

import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re
from dataclasses import dataclass
from enum import Enum
import pickle
import os

# For production, you'll need to install these:
# pip install scikit-learn pandas numpy tensorflow transformers

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    import joblib
except ImportError:
    print("Please install scikit-learn: pip install scikit-learn")

# ============================================================================
# DATA STRUCTURES
# ============================================================================

class BMICategory(Enum):
    UNDERWEIGHT = "underweight"
    NORMAL = "normal"
    OVERWEIGHT = "overweight"
    OBESE_1 = "obese_class_1"
    OBESE_2 = "obese_class_2"
    OBESE_3 = "obese_class_3"

class FitnessLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    ELITE = "elite"

class Goal(Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    ENDURANCE = "endurance"
    STRENGTH = "strength"
    GENERAL_FITNESS = "general_fitness"
    FLEXIBILITY = "flexibility"

@dataclass
class UserProfile:
    user_id: str
    age: int
    weight: float  # kg
    height: float  # cm
    gender: str  # male/female
    activity_level: str  # sedentary/light/moderate/active/very_active
    bmi: float = 0.0
    bmi_category: BMICategory = None
    fitness_level: FitnessLevel = FitnessLevel.BEGINNER
    goals: List[Goal] = None
    health_conditions: List[str] = None
    dietary_restrictions: List[str] = None
    
    def __post_init__(self):
        self.bmi = self.calculate_bmi()
        self.bmi_category = self.categorize_bmi()
        if self.goals is None:
            self.goals = []
        if self.health_conditions is None:
            self.health_conditions = []
        if self.dietary_restrictions is None:
            self.dietary_restrictions = []
    
    def calculate_bmi(self) -> float:
        """Calculate BMI from weight and height"""
        height_m = self.height / 100
        return round(self.weight / (height_m ** 2), 2)
    
    def categorize_bmi(self) -> BMICategory:
        """Categorize BMI according to WHO standards"""
        if self.bmi < 18.5:
            return BMICategory.UNDERWEIGHT
        elif 18.5 <= self.bmi < 25:
            return BMICategory.NORMAL
        elif 25 <= self.bmi < 30:
            return BMICategory.OVERWEIGHT
        elif 30 <= self.bmi < 35:
            return BMICategory.OBESE_1
        elif 35 <= self.bmi < 40:
            return BMICategory.OBESE_2
        else:
            return BMICategory.OBESE_3

# ============================================================================
# ML MODEL COMPONENTS
# ============================================================================

class IntentClassifier:
    """Classify user intent from their message"""
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 3))
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.intents = [
            'greeting', 'bmi_query', 'diet_plan', 'workout_plan',
            'health_risk', 'progress_tracking', 'motivation',
            'nutrition_info', 'exercise_info', 'medical_advice',
            'goal_setting', 'supplement_info', 'injury_prevention',
            'recovery', 'sleep_advice', 'hydration', 'meal_timing'
        ]
        self.trained = False
        
    def train(self, training_data: List[Dict]):
        """Train the intent classifier"""
        texts = []
        labels = []
        
        for item in training_data:
            texts.append(item['text'])
            labels.append(item['intent'])
        
        X = self.vectorizer.fit_transform(texts)
        self.classifier.fit(X, labels)
        self.trained = True
        
    def predict(self, text: str) -> Tuple[str, float]:
        """Predict intent from text"""
        if not self.trained:
            # Fallback to rule-based classification
            return self._rule_based_classify(text)
        
        X = self.vectorizer.transform([text])
        intent = self.classifier.predict(X)[0]
        confidence = max(self.classifier.predict_proba(X)[0])
        return intent, confidence
    
    def _rule_based_classify(self, text: str) -> Tuple[str, float]:
        """Rule-based classification fallback"""
        text_lower = text.lower()
        
        # Define keyword patterns for each intent
        patterns = {
            'greeting': ['hi', 'hello', 'hey', 'good morning', 'good evening'],
            'bmi_query': ['bmi', 'body mass', 'weight status', 'am i overweight'],
            'diet_plan': ['diet', 'meal plan', 'what to eat', 'nutrition plan', 'calories'],
            'workout_plan': ['workout', 'exercise', 'training', 'gym', 'fitness routine'],
            'health_risk': ['risk', 'disease', 'diabetes', 'heart', 'health problem'],
            'progress_tracking': ['progress', 'track', 'measure', 'improvement', 'results'],
            'motivation': ['motivate', 'tired', 'give up', 'can\'t', 'help me'],
            'nutrition_info': ['protein', 'carbs', 'fats', 'vitamins', 'nutrients'],
            'goal_setting': ['goal', 'target', 'achieve', 'want to', 'aim'],
            'supplement_info': ['supplement', 'vitamin', 'whey', 'creatine', 'bcaa'],
            'injury_prevention': ['injury', 'pain', 'hurt', 'prevent', 'safe'],
            'recovery': ['recover', 'rest', 'sore', 'muscle pain', 'fatigue'],
            'sleep_advice': ['sleep', 'insomnia', 'rest', 'tired', 'bedtime'],
            'hydration': ['water', 'drink', 'hydration', 'thirsty', 'fluids']
        }
        
        for intent, keywords in patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                return intent, 0.8
        
        return 'general', 0.5

class NutritionCalculator:
    """Calculate nutritional requirements based on user profile"""
    
    @staticmethod
    def calculate_bmr(profile: UserProfile) -> float:
        """Calculate Basal Metabolic Rate using Mifflin-St Jeor equation"""
        if profile.gender.lower() == 'male':
            bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
        else:
            bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
        return round(bmr, 0)
    
    @staticmethod
    def calculate_tdee(profile: UserProfile, bmr: float) -> float:
        """Calculate Total Daily Energy Expenditure"""
        activity_multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        }
        multiplier = activity_multipliers.get(profile.activity_level, 1.2)
        return round(bmr * multiplier, 0)
    
    @staticmethod
    def calculate_macros(profile: UserProfile, tdee: float) -> Dict:
        """Calculate macronutrient distribution"""
        macros = {}
        
        # Adjust based on goals
        if Goal.WEIGHT_LOSS in profile.goals:
            calories = tdee - 500  # 500 calorie deficit
            protein_ratio = 0.35
            fat_ratio = 0.25
            carb_ratio = 0.40
        elif Goal.MUSCLE_GAIN in profile.goals:
            calories = tdee + 300  # 300 calorie surplus
            protein_ratio = 0.30
            fat_ratio = 0.25
            carb_ratio = 0.45
        else:
            calories = tdee
            protein_ratio = 0.25
            fat_ratio = 0.30
            carb_ratio = 0.45
        
        macros['calories'] = round(calories, 0)
        macros['protein'] = round((calories * protein_ratio) / 4, 0)  # 4 cal/g
        macros['carbs'] = round((calories * carb_ratio) / 4, 0)  # 4 cal/g
        macros['fats'] = round((calories * fat_ratio) / 9, 0)  # 9 cal/g
        
        return macros

class WorkoutPlanner:
    """Generate personalized workout plans"""
    
    @staticmethod
    def generate_weekly_plan(profile: UserProfile) -> Dict:
        """Generate a weekly workout plan based on user profile"""
        plan = {
            'week_overview': '',
            'days': {},
            'progression_tips': [],
            'recovery_advice': []
        }
        
        # Determine workout frequency and intensity
        if profile.fitness_level == FitnessLevel.BEGINNER:
            frequency = 3
            intensity = 'low-moderate'
            duration = 30
        elif profile.fitness_level == FitnessLevel.INTERMEDIATE:
            frequency = 4
            intensity = 'moderate-high'
            duration = 45
        else:
            frequency = 5
            intensity = 'high'
            duration = 60
        
        # Create workout schedule based on goals
        if Goal.WEIGHT_LOSS in profile.goals:
            plan['week_overview'] = f"{frequency} days/week, {intensity} intensity, focus on cardio and circuit training"
            plan['days'] = WorkoutPlanner._generate_weight_loss_plan(frequency, duration)
        elif Goal.MUSCLE_GAIN in profile.goals:
            plan['week_overview'] = f"{frequency} days/week, {intensity} intensity, focus on progressive overload"
            plan['days'] = WorkoutPlanner._generate_muscle_gain_plan(frequency, duration)
        elif Goal.ENDURANCE in profile.goals:
            plan['week_overview'] = f"{frequency} days/week, {intensity} intensity, focus on cardiovascular endurance"
            plan['days'] = WorkoutPlanner._generate_endurance_plan(frequency, duration)
        else:
            plan['week_overview'] = f"{frequency} days/week, {intensity} intensity, balanced fitness approach"
            plan['days'] = WorkoutPlanner._generate_general_fitness_plan(frequency, duration)
        
        plan['progression_tips'] = [
            "Increase intensity by 5-10% each week",
            "Focus on proper form over weight/speed",
            "Track your workouts for progressive overload",
            "Listen to your body and rest when needed"
        ]
        
        plan['recovery_advice'] = [
            "Get 7-9 hours of sleep per night",
            "Stay hydrated (aim for 3-4L water daily)",
            "Include protein within 30 minutes post-workout",
            "Consider active recovery on rest days"
        ]
        
        return plan
    
    @staticmethod
    def _generate_weight_loss_plan(frequency: int, duration: int) -> Dict:
        """Generate weight loss focused workout plan"""
        days = {}
        workout_types = [
            {'type': 'HIIT Cardio', 'exercises': ['Burpees', 'Jump squats', 'Mountain climbers', 'High knees']},
            {'type': 'Circuit Training', 'exercises': ['Push-ups', 'Lunges', 'Plank', 'Jumping jacks']},
            {'type': 'Steady Cardio', 'exercises': ['Running', 'Cycling', 'Swimming', 'Rowing']},
            {'type': 'Full Body Strength', 'exercises': ['Squats', 'Deadlifts', 'Bench press', 'Rows']},
            {'type': 'Core & Flexibility', 'exercises': ['Plank variations', 'Yoga flow', 'Pilates', 'Stretching']}
        ]
        
        for i in range(frequency):
            day_num = i + 1
            workout = workout_types[i % len(workout_types)]
            days[f'Day {day_num}'] = {
                'type': workout['type'],
                'duration': f'{duration} minutes',
                'exercises': workout['exercises'],
                'sets': '3-4',
                'reps': '12-15' if 'Strength' in workout['type'] else 'Time-based',
                'rest': '30-45 seconds'
            }
        
        return days
    
    @staticmethod
    def _generate_muscle_gain_plan(frequency: int, duration: int) -> Dict:
        """Generate muscle gain focused workout plan"""
        days = {}
        split = [
            {'name': 'Push Day', 'muscles': 'Chest, Shoulders, Triceps', 
             'exercises': ['Bench Press', 'Shoulder Press', 'Dips', 'Tricep Extensions']},
            {'name': 'Pull Day', 'muscles': 'Back, Biceps',
             'exercises': ['Deadlifts', 'Pull-ups', 'Rows', 'Bicep Curls']},
            {'name': 'Leg Day', 'muscles': 'Quads, Hamstrings, Glutes',
             'exercises': ['Squats', 'Leg Press', 'Lunges', 'Calf Raises']},
            {'name': 'Upper Body', 'muscles': 'All Upper',
             'exercises': ['Bench Press', 'Rows', 'Shoulder Press', 'Pull-ups']},
            {'name': 'Lower Body', 'muscles': 'All Lower',
             'exercises': ['Squats', 'Deadlifts', 'Leg Curls', 'Lunges']}
        ]
        
        for i in range(frequency):
            day_num = i + 1
            workout = split[i % len(split)]
            days[f'Day {day_num}'] = {
                'name': workout['name'],
                'muscles': workout['muscles'],
                'duration': f'{duration} minutes',
                'exercises': workout['exercises'],
                'sets': '4-5',
                'reps': '6-12',
                'rest': '60-90 seconds',
                'notes': 'Progressive overload - increase weight when you can do 12 reps easily'
            }
        
        return days
    
    @staticmethod
    def _generate_endurance_plan(frequency: int, duration: int) -> Dict:
        """Generate endurance focused workout plan"""
        days = {}
        workouts = [
            {'type': 'Long Slow Distance', 'intensity': 'Zone 2 (60-70% max HR)'},
            {'type': 'Tempo Run', 'intensity': 'Zone 3-4 (70-85% max HR)'},
            {'type': 'Interval Training', 'intensity': 'Zone 4-5 (85-95% max HR)'},
            {'type': 'Recovery Run', 'intensity': 'Zone 1-2 (50-65% max HR)'},
            {'type': 'Cross Training', 'intensity': 'Moderate'}
        ]
        
        for i in range(frequency):
            day_num = i + 1
            workout = workouts[i % len(workouts)]
            days[f'Day {day_num}'] = {
                'type': workout['type'],
                'duration': f'{duration} minutes',
                'intensity': workout['intensity'],
                'notes': 'Monitor heart rate and stay in target zone'
            }
        
        return days
    
    @staticmethod
    def _generate_general_fitness_plan(frequency: int, duration: int) -> Dict:
        """Generate general fitness workout plan"""
        days = {}
        workouts = [
            {'type': 'Full Body Strength', 'focus': 'Compound movements'},
            {'type': 'Cardio', 'focus': 'Moderate intensity steady state'},
            {'type': 'Functional Training', 'focus': 'Movement patterns'},
            {'type': 'HIIT', 'focus': 'High intensity intervals'},
            {'type': 'Flexibility & Recovery', 'focus': 'Stretching and mobility'}
        ]
        
        for i in range(frequency):
            day_num = i + 1
            workout = workouts[i % len(workouts)]
            days[f'Day {day_num}'] = {
                'type': workout['type'],
                'focus': workout['focus'],
                'duration': f'{duration} minutes'
            }
        
        return days

# ============================================================================
# MAIN CHATBOT CLASS
# ============================================================================

class FitnessChatbot:
    """Professional ML-powered fitness chatbot"""
    
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.nutrition_calculator = NutritionCalculator()
        self.workout_planner = WorkoutPlanner()
        self.user_profiles = {}
        self.conversation_history = {}
        self.health_risks_db = self._load_health_risks()
        self.food_database = self._load_food_database()
        
    def _load_health_risks(self) -> Dict:
        """Load health risk information based on BMI categories"""
        return {
            BMICategory.UNDERWEIGHT: {
                'risks': ['Malnutrition', 'Osteoporosis', 'Weakened immune system', 'Fertility issues'],
                'recommendations': ['Increase caloric intake', 'Focus on nutrient-dense foods', 'Strength training', 'Regular health checkups']
            },
            BMICategory.OVERWEIGHT: {
                'risks': ['Type 2 diabetes', 'High blood pressure', 'Heart disease', 'Sleep apnea'],
                'recommendations': ['Create caloric deficit', 'Regular cardio exercise', 'Balanced diet', 'Monitor blood sugar']
            },
            BMICategory.OBESE_1: {
                'risks': ['Type 2 diabetes', 'Cardiovascular disease', 'Joint problems', 'Metabolic syndrome'],
                'recommendations': ['Medical consultation', 'Structured weight loss program', 'Low-impact exercise', 'Dietary counseling']
            },
            BMICategory.OBESE_2: {
                'risks': ['Severe cardiovascular risk', 'Type 2 diabetes', 'Sleep disorders', 'Joint degeneration'],
                'recommendations': ['Medical supervision required', 'Gradual weight loss', 'Water-based exercises', 'Psychological support']
            },
            BMICategory.OBESE_3: {
                'risks': ['Life-threatening conditions', 'Severe diabetes risk', 'Cardiovascular failure', 'Mobility issues'],
                'recommendations': ['Immediate medical attention', 'Bariatric consultation', 'Supervised exercise', 'Comprehensive health plan']
            }
        }
    
    def _load_food_database(self) -> Dict:
        """Load basic food database for nutritional information"""
        return {
            'proteins': {
                'chicken_breast': {'calories': 165, 'protein': 31, 'carbs': 0, 'fat': 3.6, 'serving': '100g'},
                'eggs': {'calories': 155, 'protein': 13, 'carbs': 1.1, 'fat': 11, 'serving': '100g'},
                'tofu': {'calories': 76, 'protein': 8, 'carbs': 1.9, 'fat': 4.8, 'serving': '100g'},
                'salmon': {'calories': 208, 'protein': 20, 'carbs': 0, 'fat': 13, 'serving': '100g'}
            },
            'carbs': {
                'rice': {'calories': 130, 'protein': 2.7, 'carbs': 28, 'fat': 0.3, 'serving': '100g'},
                'oats': {'calories': 389, 'protein': 17, 'carbs': 66, 'fat': 7, 'serving': '100g'},
                'sweet_potato': {'calories': 86, 'protein': 1.6, 'carbs': 20, 'fat': 0.1, 'serving': '100g'},
                'quinoa': {'calories': 120, 'protein': 4.4, 'carbs': 21, 'fat': 1.9, 'serving': '100g'}
            },
            'fats': {
                'avocado': {'calories': 160, 'protein': 2, 'carbs': 9, 'fat': 15, 'serving': '100g'},
                'almonds': {'calories': 579, 'protein': 21, 'carbs': 22, 'fat': 50, 'serving': '100g'},
                'olive_oil': {'calories': 884, 'protein': 0, 'carbs': 0, 'fat': 100, 'serving': '100g'}
            }
        }
    
    def create_user_profile(self, user_data: Dict) -> UserProfile:
        """Create or update user profile"""
        profile = UserProfile(
            user_id=user_data['user_id'],
            age=user_data['age'],
            weight=user_data['weight'],
            height=user_data['height'],
            gender=user_data['gender'],
            activity_level=user_data.get('activity_level', 'moderate'),
            fitness_level=FitnessLevel[user_data.get('fitness_level', 'BEGINNER').upper()],
            goals=[Goal[g.upper()] for g in user_data.get('goals', ['GENERAL_FITNESS'])],
            health_conditions=user_data.get('health_conditions', []),
            dietary_restrictions=user_data.get('dietary_restrictions', [])
        )
        
        self.user_profiles[user_data['user_id']] = profile
        return profile
    
    def generate_initial_assessment(self, profile: UserProfile) -> Dict:
        """Generate comprehensive initial assessment"""
        bmr = self.nutrition_calculator.calculate_bmr(profile)
        tdee = self.nutrition_calculator.calculate_tdee(profile, bmr)
        macros = self.nutrition_calculator.calculate_macros(profile, tdee)
        workout_plan = self.workout_planner.generate_weekly_plan(profile)
        health_info = self.health_risks_db.get(profile.bmi_category, {})
        
        assessment = {
            'bmi_analysis': {
                'value': profile.bmi,
                'category': profile.bmi_category.value,
                'interpretation': self._interpret_bmi(profile.bmi_category),
                'ideal_weight_range': self._calculate_ideal_weight_range(profile.height)
            },
            'health_assessment': {
                'potential_risks': health_info.get('risks', []),
                'recommendations': health_info.get('recommendations', []),
                'priority_actions': self._get_priority_actions(profile)
            },
            'nutrition_plan': {
                'bmr': bmr,
                'tdee': tdee,
                'daily_targets': macros,
                'meal_timing': self._generate_meal_timing(profile),
                'food_suggestions': self._get_food_suggestions(profile)
            },
            'workout_plan': workout_plan,
            'timeline': self._generate_timeline(profile),
            'monitoring_metrics': [
                'Weight (weekly)',
                'Body measurements (bi-weekly)',
                'Energy levels (daily)',
                'Sleep quality (daily)',
                'Workout performance (per session)'
            ]
        }
        
        return assessment
    
    def _interpret_bmi(self, category: BMICategory) -> str:
        """Interpret BMI category"""
        interpretations = {
            BMICategory.UNDERWEIGHT: "You're underweight. Focus on healthy weight gain through balanced nutrition and strength training.",
            BMICategory.NORMAL: "You're in a healthy weight range. Maintain this through balanced diet and regular exercise.",
            BMICategory.OVERWEIGHT: "You're slightly overweight. A modest caloric deficit and increased activity can help.",
            BMICategory.OBESE_1: "You're in the obese range. Significant lifestyle changes are recommended for health improvement.",
            BMICategory.OBESE_2: "You're severely obese. Medical supervision is strongly recommended for safe weight loss.",
            BMICategory.OBESE_3: "You're morbidly obese. Immediate medical intervention is necessary for health preservation."
        }
        return interpretations.get(category, "Unable to interpret BMI category")
    
    def _calculate_ideal_weight_range(self, height_cm: float) -> Dict:
        """Calculate ideal weight range based on height"""
        height_m = height_cm / 100
        min_bmi = 18.5
        max_bmi = 24.9
        
        return {
            'min_kg': round(min_bmi * (height_m ** 2), 1),
            'max_kg': round(max_bmi * (height_m ** 2), 1)
        }
    
    def _get_priority_actions(self, profile: UserProfile) -> List[str]:
        """Get priority actions based on profile"""
        actions = []
        
        if profile.bmi_category in [BMICategory.OBESE_2, BMICategory.OBESE_3]:
            actions.append("Consult with a healthcare provider immediately")
        
        if profile.bmi_category == BMICategory.UNDERWEIGHT:
            actions.append("Increase caloric intake by 300-500 calories daily")
        elif profile.bmi_category in [BMICategory.OVERWEIGHT, BMICategory.OBESE_1]:
            actions.append("Create a 500 calorie daily deficit for safe weight loss")
        
        if profile.activity_level in ['sedentary', 'light']:
            actions.append("Increase daily activity to at least 30 minutes")
        
        actions.append("Start tracking food intake and exercise")
        actions.append("Establish consistent sleep schedule (7-9 hours)")
        actions.append("Increase water intake to 2-3 liters daily")
        
        return actions[:5]  # Return top 5 priorities
    
    def _generate_meal_timing(self, profile: UserProfile) -> Dict:
        """Generate meal timing recommendations"""
        if Goal.WEIGHT_LOSS in profile.goals:
            return {
                'breakfast': '7:00-8:00 AM',
                'snack_1': '10:00 AM (optional)',
                'lunch': '12:30-1:30 PM',
                'snack_2': '3:30 PM (protein-based)',
                'dinner': '6:30-7:30 PM',
                'notes': 'Avoid eating 3 hours before bed'
            }
        elif Goal.MUSCLE_GAIN in profile.goals:
            return {
                'breakfast': '7:00 AM',
                'snack_1': '10:00 AM',
                'lunch': '1:00 PM',
                'pre_workout': '3:30 PM',
                'post_workout': 'Within 30 min after training',
                'dinner': '7:00 PM',
                'before_bed': '9:30 PM (casein protein)',
                'notes': 'Frequent protein intake for muscle synthesis'
            }
        else:
            return {
                'breakfast': '7:00-9:00 AM',
                'lunch': '12:00-1:30 PM',
                'snack': '3:00-4:00 PM (optional)',
                'dinner': '6:30-8:00 PM',
                'notes': 'Maintain consistent meal times'
            }
    
    def _get_food_suggestions(self, profile: UserProfile) -> Dict:
        """Get personalized food suggestions"""
        suggestions = {
            'proteins': [],
            'carbs': [],
            'fats': [],
            'vegetables': ['Broccoli', 'Spinach', 'Bell peppers', 'Cauliflower', 'Zucchini'],
            'fruits': ['Berries', 'Apples', 'Oranges', 'Bananas', 'Kiwi']
        }
        
        # Filter based on dietary restrictions
        if 'vegetarian' in profile.dietary_restrictions:
            suggestions['proteins'] = ['Tofu', 'Legumes', 'Quinoa', 'Greek yogurt', 'Eggs']
        elif 'vegan' in profile.dietary_restrictions:
            suggestions['proteins'] = ['Tofu', 'Legumes', 'Quinoa', 'Tempeh', 'Seitan']
        else:
            suggestions['proteins'] = ['Chicken breast', 'Fish', 'Lean beef', 'Eggs', 'Greek yogurt']
        
        suggestions['carbs'] = ['Brown rice', 'Oats', 'Sweet potato', 'Quinoa', 'Whole grain bread']
        suggestions['fats'] = ['Avocado', 'Nuts', 'Olive oil', 'Seeds', 'Fatty fish']
        
        return suggestions
    
    def _generate_timeline(self, profile: UserProfile) -> Dict:
        """Generate expected timeline for results"""
        timeline = {
            'week_1_2': 'Adaptation phase - Focus on building habits',
            'week_3_4': 'Initial changes - Energy levels improve, slight weight change',
            'month_2': 'Visible progress - 2-4 kg weight change, strength gains',
            'month_3': 'Significant results - 4-8 kg total change, body composition improvements',
            'month_6': 'Transformation - Major health improvements, sustainable lifestyle established'
        }
        
        return timeline
    
    def process_message(self, user_id: str, message: str) -> Dict:
        """Process user message and generate response"""
        # Get or create user profile
        if user_id not in self.user_profiles:
            return {
                'response': "I need your basic information first. Please provide your age, weight, height, and gender.",
                'requires_profile': True
            }
        
        profile = self.user_profiles[user_id]
        
        # Classify intent
        intent, confidence = self.intent_classifier.predict(message)
        
        # Generate response based on intent
        response_data = self._generate_intent_response(profile, intent, message)
        
        # Store conversation history
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        
        self.conversation_history[user_id].append({
            'timestamp': datetime.now().isoformat(),
            'message': message,
            'intent': intent,
            'response': response_data['response']
        })
        
        return response_data
    
    def _generate_intent_response(self, profile: UserProfile, intent: str, message: str) -> Dict:
        """Generate response based on intent"""
        responses = {
            'greeting': self._handle_greeting,
            'bmi_query': self._handle_bmi_query,
            'diet_plan': self._handle_diet_plan,
            'workout_plan': self._handle_workout_plan,
            'health_risk': self._handle_health_risk,
            'progress_tracking': self._handle_progress_tracking,
            'motivation': self._handle_motivation,
            'nutrition_info': self._handle_nutrition_info,
            'goal_setting': self._handle_goal_setting,
            'supplement_info': self._handle_supplement_info,
            'injury_prevention': self._handle_injury_prevention,
            'recovery': self._handle_recovery,
            'sleep_advice': self._handle_sleep_advice,
            'hydration': self._handle_hydration
        }
        
        handler = responses.get(intent, self._handle_general)
        return handler(profile, message)
    
    def _handle_greeting(self, profile: UserProfile, message: str) -> Dict:
        """Handle greeting messages"""
        bmr = self.nutrition_calculator.calculate_bmr(profile)
        
        return {
            'response': f"Hello! I'm your AI fitness coach. Based on your profile, your BMI is {profile.bmi} ({profile.bmi_category.value}). How can I help you today? I can provide diet plans, workout routines, health advice, and track your progress.",
            'suggestions': [
                'Show me my diet plan',
                'Create a workout routine',
                'What are my health risks?',
                'How can I lose weight?'
            ],
            'data': {
                'bmi': profile.bmi,
                'category': profile.bmi_category.value,
                'bmr': bmr
            }
        }
    
    def _handle_bmi_query(self, profile: UserProfile, message: str) -> Dict:
        """Handle BMI related queries"""
        ideal_range = self._calculate_ideal_weight_range(profile.height)
        health_info = self.health_risks_db.get(profile.bmi_category, {})
        
        response_text = f"""Your BMI Analysis:
        
📊 Current BMI: {profile.bmi}
📈 Category: {profile.bmi_category.value.replace('_', ' ').title()}
⚖️ Current Weight: {profile.weight} kg
📏 Height: {profile.height} cm
🎯 Ideal Weight Range: {ideal_range['min_kg']}-{ideal_range['max_kg']} kg

{self._interpret_bmi(profile.bmi_category)}

⚠️ Potential Health Risks:
{chr(10).join(['• ' + risk for risk in health_info.get('risks', [])])}

✅ Recommendations:
{chr(10).join(['• ' + rec for rec in health_info.get('recommendations', [])])}
"""
        
        return {
            'response': response_text,
            'data': {
                'bmi': profile.bmi,
                'category': profile.bmi_category.value,
                'ideal_range': ideal_range,
                'risks': health_info.get('risks', []),
                'recommendations': health_info.get('recommendations', [])
            }
        }
    
    def _handle_diet_plan(self, profile: UserProfile, message: str) -> Dict:
        """Handle diet plan requests"""
        bmr = self.nutrition_calculator.calculate_bmr(profile)
        tdee = self.nutrition_calculator.calculate_tdee(profile, bmr)
        macros = self.nutrition_calculator.calculate_macros(profile, tdee)
        meal_timing = self._generate_meal_timing(profile)
        foods = self._get_food_suggestions(profile)
        
        response_text = f"""Your Personalized Nutrition Plan:

🔥 Daily Calorie Targets:
• BMR (Basal Metabolic Rate): {bmr} calories
• TDEE (Total Daily Energy): {tdee} calories
• Target Intake: {macros['calories']} calories

🥗 Macronutrient Distribution:
• Protein: {macros['protein']}g ({macros['protein']*4} calories)
• Carbohydrates: {macros['carbs']}g ({macros['carbs']*4} calories)
• Fats: {macros['fats']}g ({macros['fats']*9} calories)

⏰ Meal Timing:
{chr(10).join([f"• {meal}: {time}" for meal, time in meal_timing.items() if meal != 'notes'])}
💡 {meal_timing.get('notes', '')}

🍽️ Recommended Foods:
Proteins: {', '.join(foods['proteins'][:3])}
Carbs: {', '.join(foods['carbs'][:3])}
Healthy Fats: {', '.join(foods['fats'][:3])}
Vegetables: Unlimited green vegetables

💧 Hydration: Aim for {round(profile.weight * 0.033, 1)}L of water daily

Would you like a detailed meal plan for the week?"""
        
        return {
            'response': response_text,
            'data': {
                'bmr': bmr,
                'tdee': tdee,
                'macros': macros,
                'meal_timing': meal_timing,
                'food_suggestions': foods
            }
        }
    
    def _handle_workout_plan(self, profile: UserProfile, message: str) -> Dict:
        """Handle workout plan requests"""
        plan = self.workout_planner.generate_weekly_plan(profile)
        
        response_text = f"""Your Personalized Workout Plan:

🎯 Overview: {plan['week_overview']}

📅 Weekly Schedule:
"""
        
        for day, details in plan['days'].items():
            response_text += f"\n{day}:\n"
            for key, value in details.items():
                if key == 'exercises' and isinstance(value, list):
                    response_text += f"  • Exercises: {', '.join(value)}\n"
                else:
                    response_text += f"  • {key.replace('_', ' ').title()}: {value}\n"
        
        response_text += f"""
📈 Progression Tips:
{chr(10).join(['• ' + tip for tip in plan['progression_tips']])}

🔄 Recovery Advice:
{chr(10).join(['• ' + advice for advice in plan['recovery_advice']])}

Start with this plan and adjust based on how your body responds. Need help with exercise form or modifications?"""
        
        return {
            'response': response_text,
            'data': plan
        }
    
    def _handle_health_risk(self, profile: UserProfile, message: str) -> Dict:
        """Handle health risk queries"""
        health_info = self.health_risks_db.get(profile.bmi_category, {})
        priority_actions = self._get_priority_actions(profile)
        
        response_text = f"""Health Risk Assessment for BMI {profile.bmi}:

⚠️ Potential Health Risks:
{chr(10).join(['• ' + risk for risk in health_info.get('risks', [])])}

🛡️ Prevention Strategies:
{chr(10).join(['• ' + rec for rec in health_info.get('recommendations', [])])}

🎯 Priority Actions:
{chr(10).join([f"{i+1}. {action}" for i, action in enumerate(priority_actions)])}

⚕️ Medical Advice:
"""
        
        if profile.bmi_category in [BMICategory.OBESE_2, BMICategory.OBESE_3]:
            response_text += "⚠️ IMPORTANT: Please consult with a healthcare provider before starting any exercise program. Medical supervision is strongly recommended for your BMI category."
        elif profile.bmi_category == BMICategory.OBESE_1:
            response_text += "Consider consulting with a healthcare provider for a comprehensive health assessment and personalized guidance."
        else:
            response_text += "Regular health check-ups are recommended to monitor your progress and overall health status."
        
        return {
            'response': response_text,
            'data': {
                'risks': health_info.get('risks', []),
                'recommendations': health_info.get('recommendations', []),
                'priority_actions': priority_actions
            }
        }
    
    def _handle_progress_tracking(self, profile: UserProfile, message: str) -> Dict:
        """Handle progress tracking queries"""
        return {
            'response': f"""Progress Tracking Guidelines:

📊 What to Track:
• Weight: Weekly (same day, same time, preferably morning)
• Body Measurements: Bi-weekly (waist, hips, chest, arms, thighs)
• Photos: Weekly (front, side, back views)
• Performance: Each workout (weights lifted, reps, duration)
• Energy Levels: Daily (1-10 scale)
• Sleep Quality: Daily (hours and quality)

📈 Expected Progress Timeline:
• Week 1-2: Energy improvements, better sleep
• Week 3-4: 1-2 kg weight change, strength gains
• Month 2: Visible body changes, 2-4 kg total change
• Month 3: Significant improvements in all metrics

💡 Tips for Accurate Tracking:
• Use the same scale at the same time of day
• Take measurements at the same body points
• Log immediately after workouts
• Be patient - progress isn't always linear

Would you like me to help you set specific tracking goals?""",
            'data': {
                'metrics': ['weight', 'measurements', 'photos', 'performance', 'energy', 'sleep'],
                'timeline': self._generate_timeline(profile)
            }
        }
    
    def _handle_motivation(self, profile: UserProfile, message: str) -> Dict:
        """Handle motivation and encouragement"""
        motivational_quotes = [
            "Every workout counts, no matter how small!",
            "You're not just building a better body, you're building a better life.",
            "Progress is progress, no matter how slow.",
            "The only bad workout is the one that didn't happen.",
            "Your future self will thank you for starting today."
        ]
        
        import random
        quote = random.choice(motivational_quotes)
        
        return {
            'response': f"""💪 Motivation Boost:

"{quote}"

Remember why you started:
• Your health is an investment, not an expense
• Small consistent actions lead to big results
• You're already {profile.fitness_level.value} level - that's progress!
• Every healthy choice is a victory

🎯 Your Goals:
{chr(10).join(['• ' + goal.value.replace('_', ' ').title() for goal in profile.goals])}

📊 You've already taken the first step by being here. Your BMI of {profile.bmi} is just a number - what matters is the direction you're heading.

Need help overcoming a specific challenge? Let me know what's holding you back, and I'll help you push through!""",
            'data': {
                'quote': quote,
                'goals': [g.value for g in profile.goals]
            }
        }
    
    def _handle_nutrition_info(self, profile: UserProfile, message: str) -> Dict:
        """Handle nutrition information queries"""
        return {
            'response': """Nutrition Fundamentals:

🥗 Macronutrients:
• Proteins (4 cal/g): Build & repair muscle, satiety
  - Sources: Meat, fish, eggs, legumes, dairy
  - Need: 1.6-2.2g per kg body weight
  
• Carbohydrates (4 cal/g): Primary energy source
  - Sources: Grains, fruits, vegetables
  - Focus on complex carbs for sustained energy
  
• Fats (9 cal/g): Hormone production, nutrient absorption
  - Sources: Nuts, oils, avocado, fatty fish
  - Need: 20-35% of total calories

💊 Key Micronutrients:
• Vitamin D: Bone health, immunity
• Iron: Oxygen transport
• Calcium: Bone strength
• B12: Energy metabolism
• Omega-3: Heart & brain health

🍽️ Portion Control Tips:
• Protein: Palm-sized portion
• Carbs: Cupped hand portion
• Fats: Thumb-sized portion
• Vegetables: 2 fist-sized portions

Need specific food recommendations or have dietary restrictions?""",
            'data': {
                'macros_info': {
                    'protein_per_kg': 1.8,
                    'fat_percentage': 25,
                    'carb_percentage': 45
                }
            }
        }
    
    def _handle_goal_setting(self, profile: UserProfile, message: str) -> Dict:
        """Handle goal setting and adjustment"""
        current_goals = [g.value for g in profile.goals]
        
        return {
            'response': f"""Goal Setting Strategy:

📋 Current Goals:
{chr(10).join(['• ' + goal.replace('_', ' ').title() for goal in current_goals])}

🎯 SMART Goal Framework:
• Specific: Clear and well-defined
• Measurable: Track with numbers
• Achievable: Realistic for your level
• Relevant: Aligned with your values
• Time-bound: Set deadlines

📊 Based on your BMI ({profile.bmi}), here are realistic targets:

Short-term (4 weeks):
• Weight change: 2-4 kg
• Exercise: 3-4 sessions/week
• Daily steps: 8,000-10,000

Medium-term (12 weeks):
• Weight change: 6-12 kg
• Body fat: -3-5%
• Strength: +20-30% on major lifts

Long-term (6 months):
• Total transformation possible
• Sustainable habits established
• Health markers improved

Would you like to adjust your goals or add specific targets?""",
            'data': {
                'current_goals': current_goals,
                'suggested_targets': {
                    'short_term': '2-4 kg in 4 weeks',
                    'medium_term': '6-12 kg in 12 weeks',
                    'long_term': 'Complete transformation in 6 months'
                }
            }
        }
    
    def _handle_supplement_info(self, profile: UserProfile, message: str) -> Dict:
        """Handle supplement information"""
        return {
            'response': """Supplement Guide:

🏃 Basic Supplements:
• Multivitamin: Fill nutritional gaps
• Vitamin D3: 1000-2000 IU daily
• Omega-3: 1-2g EPA/DHA daily
• Probiotics: Gut health support

💪 Performance Supplements:
• Whey Protein: 20-40g post-workout
• Creatine: 5g daily (most researched)
• Caffeine: 100-200mg pre-workout
• Beta-Alanine: 2-5g daily for endurance

🎯 Goal-Specific:
For Weight Loss:
• Green tea extract
• Fiber supplements
• CLA (limited evidence)

For Muscle Gain:
• Casein protein (before bed)
• BCAAs (if low protein intake)
• HMB (for muscle preservation)

⚠️ Important Notes:
• Supplements don't replace good nutrition
• Consult healthcare provider before starting
• Buy from reputable brands only
• Start with basics, add others gradually

Need specific supplement recommendations for your goals?""",
            'data': {
                'basic': ['Multivitamin', 'Vitamin D3', 'Omega-3'],
                'performance': ['Whey Protein', 'Creatine', 'Caffeine'],
                'goal_specific': profile.goals[0].value if profile.goals else 'general'
            }
        }
    
    def _handle_injury_prevention(self, profile: UserProfile, message: str) -> Dict:
        """Handle injury prevention advice"""
        return {
            'response': """Injury Prevention Guidelines:

🛡️ Before Exercise:
• Warm-up: 5-10 minutes gradual movement
• Dynamic stretching: Leg swings, arm circles
• Activation: Light sets of planned exercises
• Proper hydration: Drink 500ml water

⚠️ During Exercise:
• Focus on form over weight/speed
• Use full range of motion
• Control the eccentric (lowering) phase
• Stop if you feel sharp pain
• Breathe properly (exhale on exertion)

🔄 After Exercise:
• Cool down: 5-10 minutes light cardio
• Static stretching: Hold 20-30 seconds
• Foam rolling: Target tight areas
• Proper nutrition: Protein within 2 hours

🚫 Common Mistakes to Avoid:
• Progressing too quickly (10% rule)
• Ignoring pain signals
• Poor form when fatigued
• Inadequate recovery time
• Neglecting mobility work

💡 Recovery Protocol:
• Sleep: 7-9 hours minimum
• Rest days: 1-2 per week
• Active recovery: Light walking/swimming
• Massage/stretching: Regular practice

Having any specific pain or discomfort?""",
            'data': {
                'warm_up_time': '5-10 minutes',
                'cool_down_time': '5-10 minutes',
                'rest_days_per_week': '1-2'
            }
        }
    
    def _handle_recovery(self, profile: UserProfile, message: str) -> Dict:
        """Handle recovery advice"""
        return {
            'response': """Recovery Optimization:

😴 Sleep Optimization:
• Target: 7-9 hours nightly
• Consistent schedule (same bedtime)
• Dark, cool room (18-20°C)
• No screens 1 hour before bed
• Avoid caffeine after 2 PM

🍽️ Nutrition for Recovery:
• Post-workout: Protein + carbs within 2 hours
• Daily protein: 1.6-2.2g per kg body weight
• Anti-inflammatory foods: Berries, fatty fish
• Hydration: 35-40ml per kg body weight

🧘 Active Recovery Methods:
• Light walking: 20-30 minutes
• Swimming: Low-impact full body
• Yoga: Flexibility and relaxation
• Foam rolling: 10-15 minutes daily
• Stretching: Focus on tight areas

🛁 Recovery Tools:
• Ice baths: 10-15 min at 10-15°C
• Contrast showers: Alternate hot/cold
• Compression garments: During/after exercise
• Massage: Weekly if possible
• Sauna: 15-20 minutes post-workout

📊 Signs You Need More Recovery:
• Declining performance
• Persistent fatigue
• Mood changes
• Poor sleep quality
• Elevated resting heart rate

Need a specific recovery plan for your training schedule?""",
            'data': {
                'sleep_hours': '7-9',
                'protein_per_kg': '1.6-2.2g',
                'hydration_per_kg': '35-40ml'
            }
        }
    
    def _handle_sleep_advice(self, profile: UserProfile, message: str) -> Dict:
        """Handle sleep optimization advice"""
        return {
            'response': """Sleep Optimization for Fitness:

😴 Sleep's Impact on Fitness:
• Muscle recovery and growth
• Hormone regulation (HGH, testosterone)
• Energy restoration
• Mental focus and motivation
• Appetite regulation

🕐 Optimal Sleep Schedule:
• Duration: 7-9 hours minimum
• Consistency: Same bedtime/wake time
• Best hours: 10 PM - 6 AM (circadian alignment)

🛏️ Sleep Hygiene Tips:
• Temperature: 18-20°C (65-68°F)
• Darkness: Blackout curtains/eye mask
• Quiet: Earplugs or white noise
• Comfort: Quality mattress/pillows
• No devices: 1 hour before bed

📱 Evening Routine (9 PM onwards):
1. Dim lights throughout house
2. Light stretching or meditation
3. Warm shower or bath
4. Read or journal
5. Deep breathing exercises

🍽️ Nutrition for Better Sleep:
• Last meal: 3 hours before bed
• Avoid: Caffeine after 2 PM
• Avoid: Alcohol (disrupts REM sleep)
• Try: Magnesium supplement
• Try: Chamomile tea

💪 Exercise Timing:
• Morning: Boosts energy all day
• Afternoon: Peak performance time
• Evening: Finish 3+ hours before bed

Having trouble with sleep quality?""",
            'data': {
                'optimal_hours': '7-9',
                'room_temp': '18-20°C',
                'meal_cutoff': '3 hours before bed'
            }
        }
    
    def _handle_hydration(self, profile: UserProfile, message: str) -> Dict:
        """Handle hydration advice"""
        daily_water = round(profile.weight * 0.035, 1)
        exercise_water = round(profile.weight * 0.005, 1)
        
        return {
            'response': f"""Hydration Guidelines:

💧 Daily Water Intake:
• Baseline: {daily_water}L per day
• Exercise days: +{exercise_water}L per hour
• Hot weather: +20-30% more
• Total: {daily_water + exercise_water}L on training days

⏰ Hydration Schedule:
• Wake up: 500ml immediately
• Morning: 750ml before lunch
• Afternoon: 750ml before 3 PM
• Evening: 500ml before 7 PM
• Pre-workout: 500ml (30 min before)
• During workout: 200ml every 20 min
• Post-workout: 150% of fluid lost

📊 Hydration Status Check:
• Urine color: Pale yellow is ideal
• Thirst: Don't wait until thirsty
• Energy: Dehydration causes fatigue
• Performance: 2% loss = 10% performance drop

🥤 Electrolyte Balance:
• Sodium: 1.5-2g on heavy training days
• Potassium: From fruits/vegetables
• Magnesium: 400mg daily
• Add pinch of salt to water if sweating heavily

⚠️ Signs of Dehydration:
• Dark urine
• Headaches
• Muscle cramps
• Dizziness
• Dry mouth

Need help creating a hydration schedule?""",
            'data': {
                'daily_intake': f'{daily_water}L',
                'exercise_addition': f'{exercise_water}L per hour',
                'total_training_day': f'{daily_water + exercise_water}L'
            }
        }
    
    def _handle_general(self, profile: UserProfile, message: str) -> Dict:
        """Handle general queries"""
        return {
            'response': f"""I can help you with various fitness topics:

🏃 Fitness Services:
• Personalized diet plans
• Custom workout routines
• Health risk assessment
• Progress tracking strategies
• Supplement recommendations
• Injury prevention tips
• Recovery optimization
• Sleep improvement
• Hydration guidance

📊 Your Current Status:
• BMI: {profile.bmi} ({profile.bmi_category.value})
• Fitness Level: {profile.fitness_level.value}
• Activity: {profile.activity_level}
• Goals: {', '.join([g.value for g in profile.goals])}

What specific area would you like help with today?""",
            'data': {
                'services': [
                    'Diet Planning', 'Workout Routines', 'Health Assessment',
                    'Progress Tracking', 'Supplements', 'Injury Prevention',
                    'Recovery', 'Sleep', 'Hydration'
                ],
                'user_status': {
                    'bmi': profile.bmi,
                    'fitness_level': profile.fitness_level.value,
                    'goals': [g.value for g in profile.goals]
                }
            }
        }

# ============================================================================
# TRAINING DATA GENERATOR
# ============================================================================

def generate_training_data() -> List[Dict]:
    """Generate training data for the intent classifier"""
    training_data = [
        # Greetings
        {'text': 'hi', 'intent': 'greeting'},
        {'text': 'hello', 'intent': 'greeting'},
        {'text': 'good morning', 'intent': 'greeting'},
        {'text': 'hey there', 'intent': 'greeting'},
        
        # BMI queries
        {'text': 'what is my bmi', 'intent': 'bmi_query'},
        {'text': 'calculate my body mass index', 'intent': 'bmi_query'},
        {'text': 'am i overweight', 'intent': 'bmi_query'},
        {'text': 'what is a healthy weight for me', 'intent': 'bmi_query'},
        
        # Diet plans
        {'text': 'i need a diet plan', 'intent': 'diet_plan'},
        {'text': 'what should i eat', 'intent': 'diet_plan'},
        {'text': 'create meal plan', 'intent': 'diet_plan'},
        {'text': 'how many calories should i eat', 'intent': 'diet_plan'},
        
        # Workout plans
        {'text': 'create workout plan', 'intent': 'workout_plan'},
        {'text': 'exercise routine', 'intent': 'workout_plan'},
        {'text': 'gym schedule', 'intent': 'workout_plan'},
        {'text': 'training program', 'intent': 'workout_plan'},
        
        # Health risks
        {'text': 'what are my health risks', 'intent': 'health_risk'},
        {'text': 'diabetes risk', 'intent': 'health_risk'},
        {'text': 'heart disease concerns', 'intent': 'health_risk'},
        {'text': 'health problems from weight', 'intent': 'health_risk'},
        
        # Add more training data as needed...
    ]
    
    return training_data

# ============================================================================
# API INTEGRATION
# ============================================================================

class FitnessChatbotAPI:
    """API wrapper for integration with your Node.js backend"""
    
    def __init__(self):
        self.chatbot = FitnessChatbot()
        
    def handle_request(self, request_data: Dict) -> Dict:
        """Handle API request from Node.js backend"""
        action = request_data.get('action')
        
        if action == 'create_profile':
            profile = self.chatbot.create_user_profile(request_data['user_data'])
            assessment = self.chatbot.generate_initial_assessment(profile)
            return {
                'success': True,
                'profile': {
                    'bmi': profile.bmi,
                    'category': profile.bmi_category.value,
                    'fitness_level': profile.fitness_level.value
                },
                'assessment': assessment
            }
        
        elif action == 'process_message':
            user_id = request_data.get('user_id')
            message = request_data.get('message')
            response = self.chatbot.process_message(user_id, message)
            return {
                'success': True,
                'response': response
            }
        
        elif action == 'get_assessment':
            user_id = request_data.get('user_id')
            if user_id in self.chatbot.user_profiles:
                profile = self.chatbot.user_profiles[user_id]
                assessment = self.chatbot.generate_initial_assessment(profile)
                return {
                    'success': True,
                    'assessment': assessment
                }
            return {
                'success': False,
                'error': 'User profile not found'
            }
        
        return {
            'success': False,
            'error': 'Unknown action'
        }

# ============================================================================
# MAIN EXECUTION (for testing)
# ============================================================================

if __name__ == "__main__":
    # Initialize chatbot
    chatbot = FitnessChatbot()
    
    # Train intent classifier with sample data
    training_data = generate_training_data()
    chatbot.intent_classifier.train(training_data)
    
    # Create sample user profile
    sample_user = {
        'user_id': 'test_user_1',
        'age': 30,
        'weight': 85,  # kg
        'height': 175,  # cm
        'gender': 'male',
        'activity_level': 'moderate',
        'fitness_level': 'intermediate',
        'goals': ['weight_loss', 'muscle_gain'],
        'health_conditions': [],
        'dietary_restrictions': []
    }
    
    # Create profile and generate assessment
    profile = chatbot.create_user_profile(sample_user)
    assessment = chatbot.generate_initial_assessment(profile)
    
    print(f"Profile created for user: {profile.user_id}")
    print(f"BMI: {profile.bmi} ({profile.bmi_category.value})")
    print("\nInitial Assessment Generated!")
    
    # Test message processing
    test_messages = [
        "Hi, I need help with my fitness",
        "What's my BMI and what does it mean?",
        "Create a diet plan for me",
        "I need a workout routine",
        "What are my health risks?"
    ]
    
    print("\n" + "="*50)
    print("Testing Chatbot Responses:")
    print("="*50)
    
    for msg in test_messages:
        print(f"\nUser: {msg}")
        response = chatbot.process_message('test_user_1', msg)
        print(f"Bot: {response['response'][:200]}...")  # Print first 200 chars


        #imfiit-backend\src\ml\fitness_chatbot.py