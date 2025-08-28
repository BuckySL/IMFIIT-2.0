import React, { useState, useRef, useCallback } from 'react';

interface WorkoutUploadProps {
  onImageCapture: (file: File) => void;
  onImageUrl: (url: string) => void;
  isProcessing?: boolean;
}

const WorkoutUpload: React.FC<WorkoutUploadProps> = ({ 
  onImageCapture, 
  onImageUrl, 
  isProcessing = false 
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCamera, setIsCamera] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreview(url);
      onImageUrl(url);
    };
    reader.readAsDataURL(file);
    onImageCapture(file);
  }, [onImageCapture, onImageUrl]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCamera(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required to capture workout photos');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'workout-photo.jpg', { type: 'image/jpeg' });
          handleFile(file);
        }
      }, 'image/jpeg', 0.8);
    }
    
    // Stop camera
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCamera(false);
  };

  return (
    <div className="workout-upload">
      <div className="upload-header">
        <h3>📸 Upload Workout Screenshot</h3>
        <p>Capture or upload a photo of your workout data (app screenshots, gym displays, etc.)</p>
      </div>

      {!isCamera ? (
        <div
          className={`upload-zone ${dragActive ? 'drag-active' : ''} ${isProcessing ? 'processing' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <div className="preview-container">
              <img src={preview} alt="Workout preview" className="preview-image" />
              <div className="preview-overlay">
                {isProcessing ? (
                  <div className="processing-spinner">
                    <div className="spinner"></div>
                    <p>Processing workout data...</p>
                  </div>
                ) : (
                  <p>✅ Ready to process</p>
                )}
              </div>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📱</div>
              <p><strong>Drop workout screenshot here</strong></p>
              <p>or click to browse files</p>
              <div className="upload-buttons">
                <button type="button" onClick={startCamera} className="camera-btn">
                  📷 Use Camera
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="file-btn">
                  📁 Choose File
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline className="camera-video" />
          <div className="camera-controls">
            <button onClick={capturePhoto} className="capture-btn">📸 Capture</button>
            <button onClick={() => setIsCamera(false)} className="cancel-btn">❌ Cancel</button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        style={{ display: 'none' }}
      />

      <div className="upload-tips">
        <h4>💡 Tips for Better Results:</h4>
        <ul>
          <li>📱 Screenshot fitness apps (Strava, MyFitnessPal, Apple Health)</li>
          <li>🏋️ Photo gym equipment displays showing reps/weight</li>
          <li>⌚ Smartwatch workout summaries</li>
          <li>📊 Ensure text is clear and readable</li>
          <li>💡 Good lighting improves OCR accuracy</li>
        </ul>
      </div>
    </div>
  );
};

// ============================================================================
// OCR PROCESSOR - Tesseract.js Integration for Text Recognition
// ============================================================================

interface OCRResult {
  text: string;
  confidence: number;
  exercises: ParsedExercise[];
}

interface ParsedExercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  calories?: number;
  distance?: number;
  intensity: 'low' | 'medium' | 'high';
}

const OCRProcessor = {
  // Initialize Tesseract worker (you'll need to install: npm install tesseract.js)
  async processImage(imageUrl: string): Promise<OCRResult> {
    try {
      // Note: In a real implementation, you'd import Tesseract like this:
      // import { createWorker } from 'tesseract.js';
      
      console.log('🔍 Starting OCR processing for:', imageUrl);
      
      // Simulated OCR result for development
      // Replace this with actual Tesseract.js implementation:
      /*
      const worker = await createWorker('eng');
      const { data: { text, confidence } } = await worker.recognize(imageUrl);
      await worker.terminate();
      */
      
      // Mock OCR result for demo purposes
      const mockText = `
        Workout Summary
        Push-ups: 3 sets x 15 reps
        Squats: 4 sets x 20 reps  
        Plank: 3 sets x 45 seconds
        Running: 5.2 km in 28 minutes
        Calories burned: 320
        Duration: 45 minutes
      `;
      
      const exercises = this.parseWorkoutText(mockText);
      
      return {
        text: mockText,
        confidence: 0.85,
        exercises
      };
      
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to process workout image');
    }
  },

  parseWorkoutText(text: string): ParsedExercise[] {
    const exercises: ParsedExercise[] = [];
    const lines = text.toLowerCase().split('\n');
    
    for (const line of lines) {
      const exercise = this.parseLine(line);
      if (exercise) exercises.push(exercise);
    }
    
    return exercises;
  },

  parseLine(line: string): ParsedExercise | null {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.length < 3) return null;
    
    // Pattern matching for different exercise formats
    const patterns = [
      // "Push-ups: 3 sets x 15 reps"
      {
        regex: /(.+?):\s*(\d+)\s*sets?\s*x\s*(\d+)\s*reps?/i,
        parse: (match: RegExpMatchArray) => ({
          name: match[1].trim(),
          sets: parseInt(match[2]),
          reps: parseInt(match[3]),
          intensity: this.calculateIntensity({ sets: parseInt(match[2]), reps: parseInt(match[3]) })
        })
      },
      // "Running: 5.2 km in 28 minutes"
      {
        regex: /(.+?):\s*([\d.]+)\s*km\s*in\s*(\d+)\s*minutes?/i,
        parse: (match: RegExpMatchArray) => ({
          name: match[1].trim(),
          distance: parseFloat(match[2]),
          duration: parseInt(match[3]),
          intensity: this.calculateCardioIntensity(parseFloat(match[2]), parseInt(match[3]))
        })
      },
      // "Plank: 3 sets x 45 seconds"
      {
        regex: /(.+?):\s*(\d+)\s*sets?\s*x\s*(\d+)\s*seconds?/i,
        parse: (match: RegExpMatchArray) => ({
          name: match[1].trim(),
          sets: parseInt(match[2]),
          duration: parseInt(match[3]),
          intensity: this.calculateHoldIntensity(parseInt(match[2]), parseInt(match[3]))
        })
      },
      // "Calories burned: 320"
      {
        regex: /calories?\s*(?:burned)?:\s*(\d+)/i,
        parse: (match: RegExpMatchArray) => ({
          name: 'Calories Burned',
          calories: parseInt(match[1]),
          intensity: 'medium' as const
        })
      }
    ];
    
    for (const pattern of patterns) {
      const match = cleanLine.match(pattern.regex);
      if (match) {
        return pattern.parse(match);
      }
    }
    
    return null;
  },

  calculateIntensity(data: { sets?: number; reps?: number; weight?: number }): 'low' | 'medium' | 'high' {
    const { sets = 0, reps = 0, weight = 0 } = data;
    const volume = sets * reps * (weight || 1);
    
    if (volume > 100 || (sets > 4 && reps > 15)) return 'high';
    if (volume > 30 || (sets > 2 && reps > 8)) return 'medium';
    return 'low';
  },

  calculateCardioIntensity(distance: number, duration: number): 'low' | 'medium' | 'high' {
    const pace = duration / distance; // minutes per km
    
    if (pace < 5) return 'high';   // Under 5 min/km
    if (pace < 7) return 'medium'; // 5-7 min/km  
    return 'low';                  // Over 7 min/km
  },

  calculateHoldIntensity(sets: number, duration: number): 'low' | 'medium' | 'high' {
    const totalTime = sets * duration;
    
    if (totalTime > 180) return 'high';   // Over 3 minutes total
    if (totalTime > 60) return 'medium';  // 1-3 minutes
    return 'low';                         // Under 1 minute
  }
};

// ============================================================================
// STATS CALCULATOR - Convert Workouts to Game Stats
// ============================================================================

interface StatGains {
  strength: number;
  endurance: number;
  experience: number;
  reason: string;
}

interface WorkoutSession {
  id: string;
  date: Date;
  exercises: ParsedExercise[];
  totalDuration?: number;
  totalCalories?: number;
  verified: boolean;
}

const StatsCalculator = {
  calculateWorkoutGains(exercises: ParsedExercise[]): StatGains {
    let strengthGain = 0;
    let enduranceGain = 0;
    let experienceGain = 0;
    const reasons: string[] = [];
    
    for (const exercise of exercises) {
      const gains = this.getExerciseGains(exercise);
      strengthGain += gains.strength;
      enduranceGain += gains.endurance;
      experienceGain += gains.experience;
      
      if (gains.reason) reasons.push(gains.reason);
    }
    
    // Workout completion bonus
    const completionBonus = Math.floor(exercises.length / 3); // Bonus for variety
    experienceGain += completionBonus;
    
    if (completionBonus > 0) {
      reasons.push(`+${completionBonus} XP for workout variety`);
    }
    
    return {
      strength: Math.round(strengthGain * 10) / 10,
      endurance: Math.round(enduranceGain * 10) / 10,
      experience: Math.round(experienceGain),
      reason: reasons.join(', ')
    };
  },

  getExerciseGains(exercise: ParsedExercise): StatGains {
    const exerciseName = exercise.name.toLowerCase();
    let strengthGain = 0;
    let enduranceGain = 0;
    let experienceGain = 0;
    
    // Base gains by exercise type
    if (this.isStrengthExercise(exerciseName)) {
      strengthGain = this.calculateStrengthGain(exercise);
      experienceGain = strengthGain * 2;
    } else if (this.isCardioExercise(exerciseName)) {
      enduranceGain = this.calculateEnduranceGain(exercise);
      experienceGain = enduranceGain * 2;
    } else if (this.isCoreExercise(exerciseName)) {
      // Core exercises boost both but less
      strengthGain = this.calculateStrengthGain(exercise) * 0.7;
      enduranceGain = this.calculateEnduranceGain(exercise) * 0.7;
      experienceGain = (strengthGain + enduranceGain) * 2;
    } else {
      // Unknown exercise - minimal gains
      strengthGain = 0.5;
      enduranceGain = 0.5;
      experienceGain = 1;
    }
    
    // Intensity multiplier
    const intensityMultiplier = this.getIntensityMultiplier(exercise.intensity);
    strengthGain *= intensityMultiplier;
    enduranceGain *= intensityMultiplier;
    experienceGain *= intensityMultiplier;
    
    return {
      strength: strengthGain,
      endurance: enduranceGain,
      experience: experienceGain,
      reason: `${exercise.name}: +${strengthGain.toFixed(1)} STR, +${enduranceGain.toFixed(1)} END`
    };
  },

  calculateStrengthGain(exercise: ParsedExercise): number {
    const { sets = 1, reps = 1, weight = 1 } = exercise;
    
    // Volume-based calculation
    const volume = sets * reps;
    const weightMultiplier = weight > 1 ? Math.log10(weight) : 1;
    
    return Math.min(volume * 0.1 * weightMultiplier, 5); // Cap at 5 points per exercise
  },

  calculateEnduranceGain(exercise: ParsedExercise): number {
    const { duration = 0, distance = 0, calories = 0 } = exercise;
    
    let gain = 0;
    
    if (duration > 0) {
      gain = Math.min(duration * 0.05, 4); // 0.05 points per minute, cap at 4
    }
    
    if (distance > 0) {
      gain = Math.max(gain, Math.min(distance * 0.3, 5)); // 0.3 points per km, cap at 5
    }
    
    if (calories > 0) {
      gain = Math.max(gain, Math.min(calories * 0.01, 3)); // 0.01 points per calorie, cap at 3
    }
    
    return gain || 1; // Minimum 1 point
  },

  getIntensityMultiplier(intensity: 'low' | 'medium' | 'high'): number {
    switch (intensity) {
      case 'low': return 0.8;
      case 'medium': return 1.0;
      case 'high': return 1.3;
      default: return 1.0;
    }
  },

  isStrengthExercise(name: string): boolean {
    const strengthKeywords = [
      'push-up', 'pull-up', 'squat', 'deadlift', 'bench', 'curl', 
      'press', 'row', 'lift', 'weight', 'dumbbell', 'barbell'
    ];
    return strengthKeywords.some(keyword => name.includes(keyword));
  },

  isCardioExercise(name: string): boolean {
    const cardioKeywords = [
      'run', 'jog', 'walk', 'cycle', 'bike', 'swim', 'cardio',
      'treadmill', 'elliptical', 'rowing', 'hiit', 'dance'
    ];
    return cardioKeywords.some(keyword => name.includes(keyword));
  },

  isCoreExercise(name: string): boolean {
    const coreKeywords = [
      'plank', 'crunch', 'sit-up', 'ab', 'core', 'russian twist',
      'mountain climber', 'leg raise', 'dead bug'
    ];
    return coreKeywords.some(keyword => name.includes(keyword));
  },

  // Anti-cheat: Validate workout realism
  validateWorkout(exercises: ParsedExercise[]): { valid: boolean; reason?: string } {
    const totalVolume = exercises.reduce((sum, ex) => {
      const volume = (ex.sets || 1) * (ex.reps || 1) * (ex.weight || 1);
      return sum + volume;
    }, 0);
    
    // Flag unrealistic workouts
    if (totalVolume > 10000) {
      return { valid: false, reason: 'Workout volume seems unrealistic' };
    }
    
    const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
    if (totalDuration > 300) { // 5+ hours
      return { valid: false, reason: 'Workout duration seems excessive' };
    }
    
    return { valid: true };
  },

  // Level up system
  calculateLevel(experience: number): number {
    // Level formula: level = sqrt(XP / 100)
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  },

  getExperienceToNextLevel(currentExp: number): number {
    const currentLevel = this.calculateLevel(currentExp);
    const nextLevelExp = Math.pow(currentLevel, 2) * 100;
    return nextLevelExp - currentExp;
  }
};

// ============================================================================
// USER PROFILE - Workout History and Progress Display
// ============================================================================

interface UserProfileProps {
  user: {
    id: string;
    name: string;
    stats: {
      strength: number;
      endurance: number;
      experience: number;
      level: number;
    };
    bodyType: string;
    totalWorkouts: number;
    currentStreak: number;
    longestStreak: number;
  };
  workoutHistory: WorkoutSession[];
  onUploadWorkout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  user,
  workoutHistory,
  onUploadWorkout
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  
  const recentWorkouts = workoutHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  
  const getStreakEmoji = (streak: number): string => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '💪';
    if (streak >= 3) return '✨';
    return '🌱';
  };
  
  const calculateWeeklyProgress = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyWorkouts = workoutHistory.filter(
      workout => new Date(workout.date) >= oneWeekAgo
    );
    
    const totalGains = weeklyWorkouts.reduce(
      (total, workout) => {
        const gains = StatsCalculator.calculateWorkoutGains(workout.exercises);
        return {
          strength: total.strength + gains.strength,
          endurance: total.endurance + gains.endurance,
          experience: total.experience + gains.experience
        };
      },
      { strength: 0, endurance: 0, experience: 0 }
    );
    
    return { weeklyWorkouts: weeklyWorkouts.length, ...totalGains };
  };
  
  const weeklyProgress = calculateWeeklyProgress();
  const nextLevelExp = StatsCalculator.getExperienceToNextLevel(user.stats.experience);
  const progressPercent = (user.stats.experience % 100);
  
  return (
    <div className="user-profile">
      {/* Header with Avatar and Basic Stats */}
      <div className="profile-header">
        <div className="avatar-section">
          <div className="character-avatar">
            <span className="body-type-emoji">
              {user.bodyType.includes('fit') ? '💪' : 
               user.bodyType.includes('skinny') ? '🏃' : 
               user.bodyType.includes('overweight') ? '🏋️' : '👤'}
            </span>
          </div>
          <div className="user-info">
            <h2>{user.name}</h2>
            <p className="body-type">{user.bodyType.replace(/_/g, ' ').toUpperCase()}</p>
            <p className="level">Level {user.stats.level}</p>
          </div>
        </div>
        
        <div className="quick-stats">
          <div className="stat-card strength">
            <span className="stat-icon">💪</span>
            <span className="stat-value">{user.stats.strength}</span>
            <span className="stat-label">Strength</span>
          </div>
          <div className="stat-card endurance">
            <span className="stat-icon">🏃</span>
            <span className="stat-value">{user.stats.endurance}</span>
            <span className="stat-label">Endurance</span>
          </div>
          <div className="stat-card experience">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{user.stats.experience}</span>
            <span className="stat-label">XP</span>
          </div>
        </div>
      </div>
      
      {/* Level Progress Bar */}
      <div className="level-progress">
        <div className="progress-info">
          <span>Level {user.stats.level}</span>
          <span>{nextLevelExp} XP to next level</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          📝 History
        </button>
        <button 
          className={activeTab === 'achievements' ? 'active' : ''}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Achievements
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Streak Counter */}
            <div className="streak-section">
              <div className="streak-card">
                <span className="streak-emoji">{getStreakEmoji(user.currentStreak)}</span>
                <div className="streak-info">
                  <h3>{user.currentStreak} Day Streak</h3>
                  <p>Keep it going! Longest: {user.longestStreak} days</p>
                </div>
              </div>
            </div>
            
            {/* Weekly Summary */}
            <div className="weekly-summary">
              <h3>This Week</h3>
              <div className="summary-grid">
                <div className="summary-card">
                  <span className="summary-number">{weeklyProgress.weeklyWorkouts}</span>
                  <span className="summary-label">Workouts</span>
                </div>
                <div className="summary-card">
                  <span className="summary-number">+{weeklyProgress.strength.toFixed(1)}</span>
                  <span className="summary-label">Strength</span>
                </div>
                <div className="summary-card">
                  <span className="summary-number">+{weeklyProgress.endurance.toFixed(1)}</span>
                  <span className="summary-label">Endurance</span>
                </div>
                <div className="summary-card">
                  <span className="summary-number">+{weeklyProgress.experience}</span>
                  <span className="summary-label">Experience</span>
                </div>
              </div>
            </div>
            
            {/* Quick Upload */}
            <div className="quick-upload">
              <button onClick={onUploadWorkout} className="upload-workout-btn">
                📸 Upload New Workout
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="history-tab">
            <div className="history-controls">
              <div className="period-selector">
                <button 
                  className={selectedPeriod === 'week' ? 'active' : ''}
                  onClick={() => setSelectedPeriod('week')}
                >
                  Week
                </button>
                <button 
                  className={selectedPeriod === 'month' ? 'active' : ''}
                  onClick={() => setSelectedPeriod('month')}
                >
                  Month
                </button>
                <button 
                  className={selectedPeriod === 'year' ? 'active' : ''}
                  onClick={() => setSelectedPeriod('year')}
                >
                  Year
                </button>
              </div>
            </div>
            
            <div className="workout-list">
              {recentWorkouts.map((workout, index) => {
                const gains = StatsCalculator.calculateWorkoutGains(workout.exercises);
                return (
                  <div key={workout.id} className="workout-item">
                    <div className="workout-date">
                      <span className="date">{new Date(workout.date).toLocaleDateString()}</span>
                      <span className="time">{new Date(workout.date).toLocaleTimeString()}</span>
                    </div>
                    <div className="workout-details">
                      <div className="exercise-count">
                        {workout.exercises.length} exercises
                      </div>
                      <div className="workout-gains">
                        <span className="gain strength">+{gains.strength} STR</span>
                        <span className="gain endurance">+{gains.endurance} END</span>
                        <span className="gain experience">+{gains.experience} XP</span>
                      </div>
                    </div>
                    <div className="verification-status">
                      {workout.verified ? '✅' : '⏳'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {recentWorkouts.length === 0 && (
              <div className="empty-history">
                <p>No workouts yet! Upload your first workout to start tracking.</p>
                <button onClick={onUploadWorkout}>📸 Upload Workout</button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-grid">
              <div className={`achievement ${user.totalWorkouts >= 1 ? 'unlocked' : 'locked'}`}>
                <span className="achievement-icon">🌟</span>
                <div className="achievement-info">
                  <h4>First Steps</h4>
                  <p>Complete your first workout</p>
                </div>
              </div>
              
              <div className={`achievement ${user.currentStreak >= 7 ? 'unlocked' : 'locked'}`}>
                <span className="achievement-icon">🔥</span>
                <div className="achievement-info">
                  <h4>Week Warrior</h4>
                  <p>7-day workout streak</p>
                </div>
              </div>
              
              <div className={`achievement ${user.stats.level >= 5 ? 'unlocked' : 'locked'}`}>
                <span className="achievement-icon">⚡</span>
                <div className="achievement-info">
                  <h4>Level Up</h4>
                  <p>Reach Level 5</p>
                </div>
              </div>
              
              <div className={`achievement ${user.stats.strength >= 50 ? 'unlocked' : 'locked'}`}>
                <span className="achievement-icon">💪</span>
                <div className="achievement-info">
                  <h4>Strength Master</h4>
                  <p>50+ Strength points</p>
                </div>
              </div>
              
              <div className={`achievement ${user.stats.endurance >= 50 ? 'unlocked' : 'locked'}`}>
                <span className="achievement-icon">🏃</span>
                <div className="achievement-info">
                  <h4>Endurance Hero</h4>
                  <p>50+ Endurance points</p>
                </div>
              </div>
              
              <div className={`achievement ${user.totalWorkouts >= 100 ? 'unlocked' : 'locked'}`}>
                <span className="achievement-icon">🏆</span>
                <div className="achievement-info">
                  <h4>Century Club</h4>
                  <p>100 workouts completed</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FITNESS TRACKER MAIN COMPONENT - Orchestrates All Fitness Features
// ============================================================================

interface FitnessTrackerProps {
  user: any;
  onStatsUpdate: (newStats: { strength: number; endurance: number; experience: number }) => void;
}

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ user, onStatsUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<OCRResult | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Load workout history from localStorage on mount
  React.useEffect(() => {
    const saved = localStorage.getItem(`workouts_${user.id}`);
    if (saved) {
      setWorkoutHistory(JSON.parse(saved));
    }
  }, [user.id]);

  // Save workout history to localStorage
  const saveWorkoutHistory = (history: WorkoutSession[]) => {
    setWorkoutHistory(history);
    localStorage.setItem(`workouts_${user.id}`, JSON.stringify(history));
  };

  const handleImageCapture = async (file: File) => {
    setIsProcessing(true);
    try {
      console.log('📸 Processing workout image:', file.name);
      
      // Convert file to URL for OCR processing
      const imageUrl = URL.createObjectURL(file);
      setCurrentImage(imageUrl);
      
      // Process with OCR
      const result = await OCRProcessor.processImage(imageUrl);
      setProcessingResult(result);
      
      console.log('🔍 OCR Result:', result);
      
      // Validate workout
      const validation = StatsCalculator.validateWorkout(result.exercises);
      if (!validation.valid) {
        alert(`Workout validation failed: ${validation.reason}`);
        return;
      }
      
      // Calculate stat gains
      const gains = StatsCalculator.calculateWorkoutGains(result.exercises);
      console.log('📈 Stat Gains:', gains);
      
      // Create workout session
      const workoutSession: WorkoutSession = {
        id: `workout_${Date.now()}`,
        date: new Date(),
        exercises: result.exercises,
        totalCalories: result.exercises.reduce((sum, ex) => sum + (ex.calories || 0), 0),
        totalDuration: result.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0),
        verified: result.confidence > 0.7
      };
      
      // Save workout and update stats
      const newHistory = [workoutSession, ...workoutHistory];
      saveWorkoutHistory(newHistory);
      
      // Update user stats
      const newStats = {
        strength: user.stats.strength + gains.strength,
        endurance: user.stats.endurance + gains.endurance,
        experience: user.stats.experience + gains.experience
      };
      onStatsUpdate(newStats);
      
      // Show success message
      alert(`🎉 Workout processed!\n${gains.reason}\n\nTotal gains: +${gains.strength} STR, +${gains.endurance} END, +${gains.experience} XP`);
      
      setShowUpload(false);
      
    } catch (error) {
      console.error('❌ Workout processing failed:', error);
      alert('Failed to process workout image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUrl = (url: string) => {
    setCurrentImage(url);
  };

  const calculateUserStats = () => {
    const currentLevel = StatsCalculator.calculateLevel(user.stats.experience);
    const totalWorkouts = workoutHistory.length;
    
    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const sortedWorkouts = [...workoutHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    let lastDate: Date | null = null;
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      
      if (!lastDate) {
        // First workout
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (workoutDate.getTime() === today.getTime() || workoutDate.getTime() === yesterday.getTime()) {
          currentStreak = 1;
          tempStreak = 1;
        }
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          if (currentStreak === 0) currentStreak = tempStreak;
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
          if (currentStreak === 0) break;
        }
      }
      
      lastDate = workoutDate;
    }
    
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    
    return {
      ...user,
      stats: { ...user.stats, level: currentLevel },
      totalWorkouts,
      currentStreak,
      longestStreak
    };
  };

  const enhancedUser = calculateUserStats();

  return (
    <div className="fitness-tracker">
      {showUpload ? (
        <div className="upload-modal">
          <div className="upload-content">
            <div className="upload-header">
              <h2>📸 Upload Workout</h2>
              <button 
                className="close-btn"
                onClick={() => setShowUpload(false)}
              >
                ❌
              </button>
            </div>
            
            <WorkoutUpload
              onImageCapture={handleImageCapture}
              onImageUrl={handleImageUrl}
              isProcessing={isProcessing}
            />
            
            {processingResult && (
              <div className="processing-results">
                <h3>🔍 Detected Exercises:</h3>
                <div className="detected-exercises">
                  {processingResult.exercises.map((exercise, index) => (
                    <div key={index} className="exercise-item">
                      <span className="exercise-name">{exercise.name}</span>
                      <div className="exercise-details">
                        {exercise.sets && exercise.reps && (
                          <span>{exercise.sets} × {exercise.reps}</span>
                        )}
                        {exercise.duration && (
                          <span>{exercise.duration}s</span>
                        )}
                        {exercise.distance && (
                          <span>{exercise.distance}km</span>
                        )}
                        {exercise.calories && (
                          <span>{exercise.calories} cal</span>
                        )}
                        <span className={`intensity ${exercise.intensity}`}>
                          {exercise.intensity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {processingResult.confidence < 0.7 && (
                  <div className="confidence-warning">
                    ⚠️ Low OCR confidence ({Math.round(processingResult.confidence * 100)}%). 
                    Results may need manual verification.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <UserProfile
          user={enhancedUser}
          workoutHistory={workoutHistory}
          onUploadWorkout={() => setShowUpload(true)}
        />
      )}
    </div>
  );
};

// ============================================================================
// CSS STYLES - Complete styling for all fitness components
// ============================================================================

const fitnessStyles = `
/* Workout Upload Styles */
.workout-upload {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.upload-header h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.upload-header p {
  color: #7f8c8d;
  margin-bottom: 20px;
}

.upload-zone {
  border: 2px dashed #3498db;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone.drag-active {
  border-color: #2ecc71;
  background: #e8f5e8;
}

.upload-zone.processing {
  border-color: #f39c12;
  background: #fff3cd;
}

.upload-placeholder .upload-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.upload-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
}

.camera-btn, .file-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.camera-btn {
  background: #3498db;
  color: white;
}

.camera-btn:hover {
  background: #2980b9;
}

.file-btn {
  background: #95a5a6;
  color: white;
}

.file-btn:hover {
  background: #7f8c8d;
}

.preview-container {
  position: relative;
  width: 100%;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.preview-overlay {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
}

.processing-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.camera-container {
  position: relative;
}

.camera-video {
  width: 100%;
  max-height: 400px;
  border-radius: 12px;
  object-fit: cover;
}

.camera-controls {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.capture-btn, .cancel-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.capture-btn {
  background: #2ecc71;
  color: white;
}

.capture-btn:hover {
  background: #27ae60;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
}

.cancel-btn:hover {
  background: #c0392b;
}

.upload-tips {
  margin-top: 30px;
  padding: 20px;
  background: #ecf0f1;
  border-radius: 8px;
}

.upload-tips h4 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.upload-tips ul {
  list-style: none;
  padding: 0;
}

.upload-tips li {
  margin: 8px 0;
  color: #34495e;
}

/* User Profile Styles */
.user-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.character-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  border: 3px solid rgba(255,255,255,0.3);
}

.user-info h2 {
  margin: 0 0 5px 0;
  font-size: 28px;
  font-weight: bold;
}

.body-type {
  opacity: 0.9;
  font-size: 14px;
  font-weight: 500;
}

.level {
  opacity: 0.8;
  font-size: 16px;
  margin-top: 5px;
}

.quick-stats {
  display: flex;
  gap: 20px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  min-width: 80px;
}

.stat-icon {
  display: block;
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
}

.level-progress {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 500;
  color: #2c3e50;
}

.progress-bar {
  height: 12px;
  background: #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.profile-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 20px;
  background: #ecf0f1;
  border-radius: 12px;
  padding: 5px;
}

.profile-tabs button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #7f8c8d;
}

.profile-tabs button.active {
  background: white;
  color: #2c3e50;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-content {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.streak-section {
  margin-bottom: 30px;
}

.streak-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #ff6b6b, #ffa500);
  border-radius: 12px;
  color: white;
}

.streak-emoji {
  font-size: 48px;
}

.streak-info h3 {
  margin: 0 0 5px 0;
  font-size: 24px;
}

.streak-info p {
  margin: 0;
  opacity: 0.9;
}

.weekly-summary {
  margin-bottom: 30px;
}

.weekly-summary h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.summary-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #3498db;
}

.summary-number {
  display: block;
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.summary-label {
  font-size: 14px;
  color: #7f8c8d;
  text-transform: uppercase;
  font-weight: 500;
}

.quick-upload {
  text-align: center;
}

.upload-workout-btn {
  padding: 15px 30px;
  font-size: 18px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.upload-workout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.history-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.period-selector {
  display: flex;
  gap: 5px;
  background: #ecf0f1;
  border-radius: 8px;
  padding: 5px;
}

.period-selector button {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #7f8c8d;
}

.period-selector button.active {
  background: white;
  color: #2c3e50;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.workout-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.workout-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #3498db;
}

.workout-date {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.workout-date .date {
  font-weight: 600;
  color: #2c3e50;
}

.workout-date .time {
  font-size: 12px;
  color: #7f8c8d;
}

.workout-details {
  flex: 1;
}

.exercise-count {
  color: #2c3e50;
  font-weight: 500;
  margin-bottom: 5px;
}

.workout-gains {
  display: flex;
  gap: 15px;
}

.gain {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.gain.strength {
  background: #ffe5e5;
  color: #e74c3c;
}

.gain.endurance {
  background: #e5f3ff;
  color: #3498db;
}

.gain.experience {
  background: #fff3e0;
  color: #f39c12;
}

.verification-status {
  font-size: 20px;
}

.empty-history {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.empty-history button {
  margin-top: 20px;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.empty-history button:hover {
  background: #2980b9;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.achievement {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.achievement.unlocked {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.achievement.locked {
  background: #ecf0f1;
  color: #7f8c8d;
}

.achievement-icon {
  font-size: 32px;
}

.achievement-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
}

.achievement-info p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

/* Fitness Tracker Modal */
.upload-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.upload-content {
  background: white;
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.upload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #ecf0f1;
}

.upload-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: #ecf0f1;
}

.processing-results {
  padding: 20px 25px;
  border-top: 1px solid #ecf0f1;
}

.processing-results h3 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.detected-exercises {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exercise-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.exercise-name {
  font-weight: 600;
  color: #2c3e50;
}

.exercise-details {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 14px;
  color: #7f8c8d;
}

.intensity {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.intensity.low {
  background: #d5f4e6;
  color: #27ae60;
}

.intensity.medium {
  background: #fff3e0;
  color: #f39c12;
}

.intensity.high {
  background: #ffe5e5;
  color: #e74c3c;
}

.confidence-warning {
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border-left: 4px solid #f39c12;
  border-radius: 5px;
  color: #856404;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .quick-stats {
    justify-content: center;
  }
  
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .workout-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .upload-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
  }
  
  .upload-modal {
    padding: 10px;
  }
  
  .upload-content {
    max-height: 95vh;
  }
}
`;

// Export all components and utilities
export {
  WorkoutUpload,
  OCRProcessor,
  StatsCalculator,
  UserProfile,
  FitnessTracker,
  fitnessStyles
};

