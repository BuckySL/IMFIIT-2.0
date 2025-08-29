// ============================================================================
// COMPLETE CLEAN OCR SYSTEM FOR ENHANCEDOCRSYSTEM.TSX
// Uses EXISTING import names - NO CHANGES to App.tsx needed!
// ============================================================================

import React, { useState, useRef, useCallback } from 'react';
import dataService from '../services/DataService';

// ============================================================================
// TYPES (matching your existing code)
// ============================================================================

interface WorkoutProcessorProps {
  userProfile: any;
  onStatsUpdate: (gains: { strength: number; endurance: number; experience: number }) => void;
  onWorkoutSaved: (workout: any) => void;
}

interface WorkoutContentData {
  id: string;
  uploadTimestamp: string;
  extractedDate: string;
  parsedDate: Date | null;
  appName: string;
  coreMetrics: {
    steps?: number;
    activeTime?: number;
    activityCalories?: number;
    totalCalories?: number;
    distance?: number; 
  };
  rawText: string;
  filename: string;
}

// ============================================================================
// CONTENT VALIDATOR - PROPERLY REJECTS CUTE ANIMALS
// ============================================================================

class ContentValidator {
  static FORBIDDEN_KEYWORDS = [
    'cute', 'adorable', 'fluffy', 'pet', 'animal', 'cat', 'dog', 'fox', 'puppy', 'kitten',
    'gantt', 'chart', 'timeline', 'project', 'task', 'schedule', 'planning'
  ];

  static REQUIRED_FITNESS_KEYWORDS = [
    'samsung health', 'apple health', 'health', 'workout', 'exercise', 
    'steps', 'calories', 'kcal', 'distance', 'km', 'active', 'time', 'minutes',
    'strava', 'garmin', 'fitbit', 'myfitnesspal'
  ];

  static validateContent(text: string, filename: string): {
    isValid: boolean;
    reason: string;
    confidence: number;
  } {
    const combinedText = (text + ' ' + filename).toLowerCase();
    
    // 1. CHECK FOR FORBIDDEN CONTENT (INSTANT REJECT)
    for (const forbidden of this.FORBIDDEN_KEYWORDS) {
      if (combinedText.includes(forbidden)) {
        console.log(`❌ FORBIDDEN CONTENT DETECTED: "${forbidden}"`);
        return {
          isValid: false,
          reason: `❌ REJECTED: Contains forbidden content "${forbidden}". Only fitness screenshots allowed.`,
          confidence: 0
        };
      }
    }

    // 2. CHECK FOR REQUIRED FITNESS CONTENT
    let fitnessKeywordCount = 0;
    const foundKeywords: string[] = [];
    
    for (const keyword of this.REQUIRED_FITNESS_KEYWORDS) {
      if (combinedText.includes(keyword)) {
        fitnessKeywordCount++;
        foundKeywords.push(keyword);
      }
    }

    // 3. REQUIRE AT LEAST 2 FITNESS KEYWORDS
    if (fitnessKeywordCount < 2) {
      return {
        isValid: false,
        reason: `❌ REJECTED: Not a fitness screenshot. Found only ${fitnessKeywordCount} fitness keywords.`,
        confidence: fitnessKeywordCount * 0.3
      };
    }

    // 4. PASSED ALL CHECKS
    const confidence = Math.min(fitnessKeywordCount * 0.25, 1.0);
    return {
      isValid: true,
      reason: `✅ Valid fitness content: ${foundKeywords.slice(0, 3).join(', ')}`,
      confidence
    };
  }
}

// ============================================================================
// SMART CONTENT PARSER
// ============================================================================

class SmartContentParser {
  static extractWorkoutContent(text: string, filename: string): WorkoutContentData {
    const content: WorkoutContentData = {
      id: `workout_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      uploadTimestamp: new Date().toISOString(),
      extractedDate: '',
      parsedDate: null,
      appName: 'unknown',
      coreMetrics: {},
      rawText: text,
      filename
    };

    // Detect app name
    const lowerText = text.toLowerCase();
    if (lowerText.includes('samsung health')) content.appName = 'Samsung Health';
    else if (lowerText.includes('apple health')) content.appName = 'Apple Health';
    else if (lowerText.includes('strava')) content.appName = 'Strava';
    else content.appName = 'Fitness App';

    // Extract date
    const dateMatch = text.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);
    if (dateMatch) {
      content.extractedDate = dateMatch[0];
      try {
        content.parsedDate = new Date(dateMatch[0] + ' 2024');
      } catch (e) {
        content.parsedDate = new Date();
      }
    } else {
      content.extractedDate = new Date().toLocaleDateString();
      content.parsedDate = new Date();
    }

    // Extract Samsung Health metrics
    if (content.appName === 'Samsung Health') {
      const stepsMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:\/\d+)?.*steps?/i);
      if (stepsMatch) {
        content.coreMetrics.steps = parseInt(stepsMatch[1].replace(/,/g, ''));
      }

      const activeTimeMatch = text.match(/(\d+)\s*(?:\/\d+\s*mins?|active.*time)/i);
      if (activeTimeMatch) {
        content.coreMetrics.activeTime = parseInt(activeTimeMatch[1]);
      }

      const activityCalMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*(?:\/\d+(?:,\d{3})*\s*kcal|activity.*calories?)/i);
      if (activityCalMatch) {
        content.coreMetrics.activityCalories = parseInt(activityCalMatch[1].replace(/,/g, ''));
      }

      const totalCalMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*kcal.*(?:total|burnt)/i);
      if (totalCalMatch) {
        content.coreMetrics.totalCalories = parseInt(totalCalMatch[1].replace(/,/g, ''));
      }

      const distanceMatch = text.match(/([\d.]+)\s*km/i);
      if (distanceMatch) {
        content.coreMetrics.distance = parseFloat(distanceMatch[1]);
      }
    }

    return content;
  }
}

// ============================================================================
// SMART DUPLICATE DETECTOR
// ============================================================================

class SmartDuplicateDetector {
  static WORKOUT_HISTORY_KEY = 'imfiit_workout_content_history';

  static checkDuplicate(newContent: WorkoutContentData): {
    isDuplicate: boolean;
    reason: string;
    matchingMetrics: string[];
  } {
    const history = this.getWorkoutHistory();
    
    for (const existing of history) {
      // Check if same date
      if (this.isSameDate(newContent.extractedDate, existing.extractedDate)) {
        // Compare metrics
        const matchingMetrics = this.compareMetrics(newContent.coreMetrics, existing.coreMetrics);
        
        // If 2+ metrics match on same date = duplicate
        if (matchingMetrics.length >= 2) {
          return {
            isDuplicate: true,
            reason: `Same date (${newContent.extractedDate}) with ${matchingMetrics.length} matching metrics`,
            matchingMetrics
          };
        }
      }
    }

    return {
      isDuplicate: false,
      reason: 'Unique workout',
      matchingMetrics: []
    };
  }

  static isSameDate(date1: string, date2: string): boolean {
    return date1.toLowerCase().trim() === date2.toLowerCase().trim();
  }

  static compareMetrics(metrics1: any, metrics2: any): string[] {
    const matching: string[] = [];
    const tolerance = 0.05; // 5% tolerance

    for (const key of ['steps', 'activeTime', 'activityCalories', 'distance']) {
      const val1 = metrics1[key];
      const val2 = metrics2[key];
      
      if (val1 !== undefined && val2 !== undefined) {
        const diff = Math.abs(val1 - val2);
        const avg = (val1 + val2) / 2;
        if (avg > 0 && diff / avg <= tolerance) {
          matching.push(key);
        }
      }
    }

    return matching;
  }

  static storeWorkout(content: WorkoutContentData): void {
    const history = this.getWorkoutHistory();
    history.unshift(content);
    
    if (history.length > 30) {
      history.splice(30);
    }
    
    localStorage.setItem(this.WORKOUT_HISTORY_KEY, JSON.stringify(history));
  }

  static getWorkoutHistory(): WorkoutContentData[] {
    try {
      const stored = localStorage.getItem(this.WORKOUT_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  static clearHistory(): void {
    localStorage.removeItem(this.WORKOUT_HISTORY_KEY);
  }
}

// ============================================================================
// MAIN WORKOUT PROCESSOR - SAME NAME AS YOUR EXISTING IMPORT!
// ============================================================================

const SmartWorkoutProcessor: React.FC<WorkoutProcessorProps> = ({
  userProfile,
  onStatsUpdate,
  onWorkoutSaved
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError('');
    setResult(null);
    
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    try {
      setCurrentStage('Reading image...');
      setProgress(5);
      
      // Basic file validation
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Please upload a valid image file (JPG, PNG, or WebP)');
      }

      setCurrentStage('Extracting text with OCR...');
      setProgress(15);
      
      // OCR Processing
      const Tesseract = await import('tesseract.js');
      const ocrResult = await Tesseract.recognize(file, 'eng', {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            const ocrProgress = Math.round(m.progress * 100);
            setProgress(15 + (ocrProgress * 0.4));
          }
        }
      });

      // >>> POST-OCR VALIDATION (dataService) — YOUR REQUESTED SNIPPET
      setCurrentStage('Running fraud checks...');
      setProgress(55);
      const extractedText = ocrResult.data.text;

      const serviceValidation = dataService.validateOCRResult(extractedText);
      if (!serviceValidation.isValid) {
        alert(`Suspicious workout detected: ${serviceValidation.flags.join(', ')}`);
        throw new Error('Suspicious workout detected by validator.');
      }
      // <<< END INSERT

      setCurrentStage('Validating fitness content...');
      setProgress(60);

      // CONTENT VALIDATION - This will reject your fox!
      const validation = ContentValidator.validateContent(
        ocrResult.data.text, 
        file.name
      );
      
      if (!validation.isValid) {
        throw new Error(validation.reason);
      }

      setCurrentStage('Checking for duplicates...');
      setProgress(75);

      // Extract workout content
      const workoutContent = SmartContentParser.extractWorkoutContent(
        ocrResult.data.text,
        file.name
      );

      // Duplicate detection
      const duplicateCheck = SmartDuplicateDetector.checkDuplicate(workoutContent);
      
      if (duplicateCheck.isDuplicate) {
        throw new Error(`Duplicate workout: ${duplicateCheck.reason}`);
      }

      setCurrentStage('Processing workout data...');
      setProgress(85);

      // Calculate stats
      let statGains = { strength: 15, endurance: 25, experience: 40 };
      
      if (workoutContent.appName === 'Samsung Health' && workoutContent.coreMetrics) {
        const metrics = workoutContent.coreMetrics;
        
        if (metrics.steps && metrics.steps > 10000) {
          statGains.endurance += Math.floor((metrics.steps - 10000) / 1000) * 3;
          statGains.experience += 20;
        }
        
        if (metrics.activeTime && metrics.activeTime > 120) {
          statGains.strength += 10;
          statGains.endurance += 15;
          statGains.experience += 25;
        }
        
        if (metrics.distance && metrics.distance > 5) {
          statGains.endurance += 10;
          statGains.experience += 15;
        }
      }

      setCurrentStage('Complete!');
      setProgress(100);

      // Store workout
      SmartDuplicateDetector.storeWorkout(workoutContent);

      setResult({
        workoutContent,
        statGains,
        validation,
        serviceValidation, // include for debugging/visibility
      });

      // Update user stats
      onStatsUpdate(statGains);

      // Save workout
      onWorkoutSaved({
        id: workoutContent.id,
        date: new Date(),
        workoutContent,
        statGains,
        verified: true
      });

      // Success message
      setTimeout(() => {
        alert(`🎉 Workout processed!\n\nApp: ${workoutContent.appName}\nDate: ${workoutContent.extractedDate}\n\n💪 +${statGains.strength} STR\n🏃 +${statGains.endurance} END\n⭐ +${statGains.experience} XP`);
      }, 500);

    } catch (error: any) {
      console.error('❌ Processing failed:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
      URL.revokeObjectURL(previewUrl);
    }
  }, [onStatsUpdate, onWorkoutSaved]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const clearHistory = useCallback(() => {
    SmartDuplicateDetector.clearHistory();
    alert('Workout history cleared!');
  }, []);

  return (
    <div className="smart-workout-processor">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div className="processor-header">
        <h3>🧠 Smart Workout Scanner</h3>
        <p>Content validation - Rejects cute animals, accepts fitness screenshots!</p>
        <button 
          onClick={clearHistory}
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#f87171',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          🗑️ Clear History (For Testing)
        </button>
      </div>

      {!isProcessing && !result && !error ? (
        <div 
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="upload-placeholder">
            <div className="upload-icon">🧠</div>
            <h4>Upload Fitness Screenshot</h4>
            <p>Smart validation will reject cute animals!</p>
            <div className="detection-rules">
              <div className="rule-item">✅ Samsung Health, Strava, Apple Health</div>
              <div className="rule-item">❌ Cute foxes, random photos, charts</div>
            </div>
          </div>
        </div>
      ) : isProcessing ? (
        <div className="processing-container">
          {preview && (
            <div className="processing-preview">
              <img src={preview} alt="Processing" className="processing-image" />
            </div>
          )}
          
          <div className="processing-status">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="status-text">{currentStage}</p>
            <p className="progress-text">{progress}%</p>
          </div>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">🚫</div>
          <h4>Upload Rejected</h4>
          <p className="error-message">{error}</p>
          <div className="help-text">
            <p><strong>✅ We accept:</strong> Samsung Health, Apple Health, Strava screenshots</p>
            <p><strong>❌ We reject:</strong> Cute animals, random photos, non-fitness content</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="retry-button"
          >
            Try Fitness Screenshot
          </button>
        </div>
      ) : result ? (
        <div className="success-container">
          <div className="success-icon">🎉</div>
          <h4>Workout Processed!</h4>
          <div className="workout-summary">
            <div className="summary-item">
              <span className="label">App:</span>
              <span className="value">{result.workoutContent.appName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Date:</span>
              <span className="value">{result.workoutContent.extractedDate}</span>
            </div>
          </div>
          <div className="gains-summary">
            <span>💪 +{result.statGains.strength}</span>
            <span>🏃 +{result.statGains.endurance}</span>
            <span>⭐ +{result.statGains.experience}</span>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="upload-another-button"
          >
            Upload Another
          </button>
        </div>
      ) : null}
    </div>
  );
};

// ============================================================================
// STYLES - SAME NAME AS YOUR EXISTING IMPORT!
// ============================================================================

const smartWorkoutStyles = `
.smart-workout-processor {
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.processor-header {
  text-align: center;
  margin-bottom: 24px;
}

.processor-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #10b981;
}

.processor-header p {
  margin: 0;
  color: #9ca3af;
  font-size: 14px;
}

.upload-zone {
  border: 2px dashed #06b6d4;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(6, 182, 212, 0.1);
}

.upload-zone:hover {
  border-color: #0891b2;
  background: rgba(6, 182, 212, 0.2);
}

.upload-icon {
  font-size: 3em;
  margin-bottom: 16px;
}

.upload-placeholder h4 {
  margin: 0 0 8px 0;
  color: white;
}

.upload-placeholder p {
  margin: 0 0 16px 0;
  color: #d1d5db;
}

.detection-rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-item {
  background: rgba(16, 185, 129, 0.2);
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.processing-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}

.processing-preview {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.processing-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.processing-status {
  text-align: center;
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #06b6d4, #10b981);
  transition: width 0.3s ease;
}

.status-text {
  margin: 0 0 8px 0;
  color: white;
  font-weight: 600;
}

.progress-text {
  margin: 0;
  color: #9ca3af;
  font-size: 14px;
}

.error-container, .success-container {
  text-align: center;
  padding: 24px;
}

.error-icon, .success-icon {
  font-size: 3em;
  margin-bottom: 16px;
}

.error-container h4, .success-container h4 {
  margin: 0 0 16px 0;
  color: white;
}

.error-message {
  color: #f87171;
  margin-bottom: 16px;
  line-height: 1.5;
}

.help-text {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  font-size: 14px;
}

.help-text p {
  margin: 4px 0;
  color: #d1d5db;
}

.workout-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
}

.summary-item .label {
  color: #9ca3af;
}

.summary-item .value {
  color: #10b981;
  font-weight: 600;
}

.gains-summary {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 16px 0;
  font-weight: 600;
}

.gains-summary span {
  color: #10b981;
}

.retry-button, .upload-another-button {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-button:hover, .upload-another-button:hover {
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .smart-workout-processor {
    margin: 16px;
    padding: 16px;
  }
  
  .upload-zone {
    padding: 24px 16px;
  }
  
  .processing-preview {
    width: 150px;
    height: 150px;
  }
}
`;

// ============================================================================
// EXPORTS - SAME NAMES AS YOUR EXISTING IMPORTS!
// ============================================================================

export { SmartWorkoutProcessor, SmartDuplicateDetector, SmartContentParser, smartWorkoutStyles };

// You don't need to change ANYTHING in App.tsx - your existing imports will work!
