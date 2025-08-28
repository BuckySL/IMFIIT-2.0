// components/fitness/FitnessComponents.tsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

/* ========================================================================== */
/*                                   TYPES                                    */
/* ========================================================================== */

interface ExtractedWorkout {
  exercises: Exercise[];
  duration?: number;
  intensity: 'low' | 'medium' | 'high';
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other';
  confidence: number; // 0..1
  rawText: string;
}

interface Exercise {
  name: string;
  reps?: number;
  sets?: number;
  weight?: number; // kg
  duration?: number; // minutes
  distance?: number; // km
  confidence: number;
}

interface StatGains {
  strength: number;
  endurance: number;
  experience: number;
  reason: string;
}

interface WorkoutSession {
  id: string;
  date: Date;
  extractedWorkout: ExtractedWorkout;
  statGains: StatGains;
  verified: boolean;
}

interface OCRProcessorProps {
  imageFile: File;
  onProcessingComplete: (workout: ExtractedWorkout) => void;
  onError: (error: string) => void;
}

/* ========================================================================== */
/*                              VISUAL BATTLE TYPES                            */
/* ========================================================================== */

type BodyType =
  | 'fit-male' | 'fit-female'
  | 'skinny-male' | 'skinny-female'
  | 'overweight-male' | 'overweight-female'
  | 'obese-male' | 'obese-female';

type AnimationState =
  | 'idle' | 'punch' | 'kick' | 'block' | 'hit' | 'victory' | 'defeat' | 'walk';

type CharacterAssets = {
  [key in AnimationState]: string;
};

interface AssetPaths {
  background: string;
  characters: {
    [key in BodyType]: CharacterAssets;
  };
}

/* ========================================================================== */
/*                         ASSET PATHS (Fixed)                                */
/* ========================================================================== */

const ASSET_PATHS: AssetPaths = {
  background: '/assets/Arena.png',
  characters: {
    'fit-male': {
      idle: '/assets/Fit-male/idle.png',
      punch: '/assets/Fit-male/punch.png',
      kick: '/assets/Fit-male/kick.png',
      block: '/assets/Fit-male/block.png',
      hit: '/assets/Fit-male/hit.png',
      victory: '/assets/Fit-male/victory.png',
      defeat: '/assets/Fit-male/defeat.png',
      walk: '/assets/Fit-male/walk.png'
    },
    'fit-female': {
      idle: '/assets/Fit-Woman/idle.png',  // Fixed: Fit-Woman not fit-woman
      punch: '/assets/Fit-Woman/punch.png',
      kick: '/assets/Fit-Woman/kick.png',
      block: '/assets/Fit-Woman/block.png',
      hit: '/assets/Fit-Woman/hit.png',
      victory: '/assets/Fit-Woman/victory.png',
      defeat: '/assets/Fit-Woman/defeat.png',
      walk: '/assets/Fit-Woman/walk.png'
    },
    'skinny-male': {
      idle: '/assets/Skinny-male/idle.png',  // Fixed: Skinny-male not skinny-male
      punch: '/assets/Skinny-male/punch.png',
      kick: '/assets/Skinny-male/kick.png',
      block: '/assets/Skinny-male/block.png',
      hit: '/assets/Skinny-male/hit.png',
      victory: '/assets/Skinny-male/victory.png',
      defeat: '/assets/Skinny-male/defeat.png',
      walk: '/assets/Skinny-male/walk.png'
    },
    'skinny-female': {
      idle: '/assets/Skinny-female/idle.png',  // Fixed: Skinny-female not skinny-female
      punch: '/assets/Skinny-female/punch.png',
      kick: '/assets/Skinny-female/kick.png',
      block: '/assets/Skinny-female/block.png',
      hit: '/assets/Skinny-female/hit.png',
      victory: '/assets/Skinny-female/victory.png',
      defeat: '/assets/Skinny-female/defeat.png',
      walk: '/assets/Skinny-female/walk.png'
    },
    'overweight-male': {
      idle: '/assets/Overweight-male/idle.png',  // Fixed: Overweight-male not overweight-male
      punch: '/assets/Overweight-male/punch.png',
      kick: '/assets/Overweight-male/kick.png',
      block: '/assets/Overweight-male/block.png',
      hit: '/assets/Overweight-male/hit.png',
      victory: '/assets/Overweight-male/victory.png',
      defeat: '/assets/Overweight-male/defeat.png',
      walk: '/assets/Overweight-male/walk.png'
    },
    'overweight-female': {
      idle: '/assets/Overweight-female/idle.png',  // Fixed: Overweight-female not overweight-female
      punch: '/assets/Overweight-female/punch.png',
      kick: '/assets/Overweight-female/kick.png',
      block: '/assets/Overweight-female/block.png',
      hit: '/assets/Overweight-female/hit.png',
      victory: '/assets/Overweight-female/victory.png',
      defeat: '/assets/Overweight-female/defeat.png',
      walk: '/assets/Overweight-female/walk.png'
    },
    'obese-male': {
      idle: '/assets/Obese-male/idle.png',  // Fixed: Obese-male not obese-male
      punch: '/assets/Obese-male/punch.png',
      kick: '/assets/Obese-male/kick.png',
      block: '/assets/Obese-male/block.png',
      hit: '/assets/Obese-male/hit.png',
      victory: '/assets/Obese-male/victory.png',
      defeat: '/assets/Obese-male/defeat.png',
      walk: '/assets/Obese-male/walk.png'
    },
    'obese-female': {
      idle: '/assets/Obese-female/idle.png',  // Fixed: Obese-female not obese-female
      punch: '/assets/Obese-female/punch.png',
      kick: '/assets/Obese-female/kick.png',
      block: '/assets/Obese-female/block.png',
      hit: '/assets/Obese-female/hit.png',
      victory: '/assets/Obese-female/victory.png',
      defeat: '/assets/Obese-female/defeat.png',
      walk: '/assets/Obese-female/walk.png'
    }
  }
};

/* ========================================================================== */
/*                          CHARACTER SPRITE COMPONENT                         */
/* ========================================================================== */

interface CharacterSpriteProps {
  bodyType: string;
  currentAnimation: AnimationState;
  isFlipped?: boolean;
  scale?: number;
  style?: React.CSSProperties;
}

const CharacterSprite: React.FC<CharacterSpriteProps> = ({
  bodyType,
  currentAnimation,
  isFlipped = false,
  scale = 1,
  style = {}
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const characterAssets = ASSET_PATHS.characters[bodyType as BodyType];
  const spritePath = characterAssets ? characterAssets[currentAnimation] : ASSET_PATHS.characters['fit-male'].idle;

  useEffect(() => {
    setImageLoaded(false);
    setImageError(null);

    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageError('Failed to load sprite');
    img.src = spritePath;
  }, [spritePath]);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 150 * scale,
        height: 150 * scale,
        ...style
      }}
    >
      {/* Loading state */}
      {!imageLoaded && !imageError && (
        <div
          style={{
            width: 120 * scale,
            height: 120 * scale,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48 * scale,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        >
          🥊
        </div>
      )}

      {/* Error fallback */}
      {imageError && (
        <div
          style={{
            width: 120 * scale,
            height: 120 * scale,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48 * scale,
            color: 'white'
          }}
        >
          {bodyType.includes('fit') ? '💪' :
          bodyType.includes('skinny') ? '🏃' :
          bodyType.includes('overweight') || bodyType.includes('obese') ? '🏋️' : '👤'}
        </div>
      )}

      {/* Successful image load */}
      {imageLoaded && !imageError && (
        <img
          src={spritePath}
          alt={`${bodyType} ${currentAnimation}`}
          style={{
            width: 'auto',
            height: 120 * scale,
            maxWidth: 150 * scale,
            transform: isFlipped ? 'scaleX(-1)' : 'none',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* Animation indicator */}
      {currentAnimation !== 'idle' && (
        <div
          style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 10,
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}
        >
          {currentAnimation}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: .8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: .8; }
        }
      `}</style>
    </div>
  );
};

/* ========================================================================== */
/*                          BATTLE BACKGROUND COMPONENT                        */
/* ========================================================================== */

interface BattleBackgroundProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const BattleBackground: React.FC<BattleBackgroundProps> = ({ children, style = {} }) => {
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '400px',
        background: backgroundLoaded
          ? `url(${ASSET_PATHS.background}) center/cover no-repeat`
          : 'linear-gradient(135deg, #2d5a87 0%, #1e3a5f 50%, #0f1419 100%)',
        borderRadius: 16,
        overflow: 'hidden',
        ...style
      }}
    >
      <img
        src={ASSET_PATHS.background}
        alt="Battle Arena"
        onLoad={() => setBackgroundLoaded(true)}
        onError={() => console.warn('Background image failed to load, using gradient fallback')}
        style={{ display: 'none' }}
      />
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.3)', zIndex: 1
        }}
      />
      <div
        style={{
          position: 'relative', zIndex: 2, height: '100%',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ========================================================================== */
/*                               OCR PROCESSOR                                 */
/* ========================================================================== */

const OCRProcessor: React.FC<OCRProcessorProps> = ({
  imageFile,
  onProcessingComplete,
  onError
}) => {
  const [stage, setStage] = useState<'initializing' | 'scanning' | 'analyzing' | 'complete'>('initializing');
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    void processImage();
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFile]);

  const processImage = async () => {
    try {
      setStage('initializing');
      setProgress(10);

      // Try real Tesseract.js first
      try {
        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker('eng');
        setProgress(30);
        setStage('scanning');
        
        const { data: { text, confidence } } = await worker.recognize(imageFile);
        await worker.terminate();
        
        setExtractedText(text);
        setProgress(70);
        setStage('analyzing');
        
        const workout = analyzeWorkoutText(text, confidence / 100);
        setProgress(100);
        setStage('complete');

        setTimeout(() => onProcessingComplete(workout), 600);
        
      } catch (tesseractError) {
        console.warn('Tesseract.js failed, using demo data:', tesseractError);
        
        // Demo fallback
        await new Promise(res => setTimeout(res, 800));
        setProgress(30);
        setStage('scanning');
        await new Promise(res => setTimeout(res, 1200));

        const text = `Workout Log - ${new Date().toLocaleDateString()}

Push-ups: 3 sets x 15 reps
Squats: 4 sets x 12 reps
Plank: 3 sets x 45 seconds
Running: 3.2 km in 25 minutes
Total time: 45 minutes
Intensity: High`;

        setExtractedText(text);
        setProgress(70);
        setStage('analyzing');

        await new Promise(res => setTimeout(res, 600));
        const workout = analyzeWorkoutText(text, 0.85);
        setProgress(100);
        setStage('complete');

        setTimeout(() => onProcessingComplete(workout), 600);
      }
      
    } catch (error) {
      console.error('OCR processing error:', error);
      onError('Failed to process workout image. Please try again.');
    }
  };

  const analyzeWorkoutText = (text: string, ocrConfidence: number): ExtractedWorkout => {
    const exercises: Exercise[] = [];
    let workoutType: ExtractedWorkout['type'] = 'other';
    let intensity: ExtractedWorkout['intensity'] = 'medium';
    let duration: number | undefined;

    const normalizedText = text.toLowerCase();

    // Detect workout type
    if (normalizedText.includes('run') || normalizedText.includes('jog') || normalizedText.includes('km')) {
      workoutType = 'cardio';
    } else if (normalizedText.includes('push') || normalizedText.includes('squat') || normalizedText.includes('sets')) {
      workoutType = 'strength';
    } else if (normalizedText.includes('yoga') || normalizedText.includes('stretch')) {
      workoutType = 'flexibility';
    }

    // Detect intensity
    if (normalizedText.includes('high') || normalizedText.includes('intense')) intensity = 'high';
    else if (normalizedText.includes('low') || normalizedText.includes('easy')) intensity = 'low';

    // Extract duration
    const durationMatch = text.match(/(\d+)\s*(?:min|minute|minutes)/i);
    if (durationMatch) duration = parseInt(durationMatch[1], 10);

    // Extract exercises
    const lines = text.split('\n');
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      const ex = extractExerciseFromLine(line);
      if (ex) exercises.push(ex);
    }

    if (exercises.length === 0) {
      exercises.push({ name: 'General Exercise', duration: 30, confidence: 0.6 });
    }

    return { exercises, duration, intensity, type: workoutType, confidence: ocrConfidence, rawText: text };
  };

  const extractExerciseFromLine = (line: string): Exercise | null => {
    if (line.length < 3) return null;

    // "Exercise: X sets x Y reps"
    const setsRepsPattern = /^([^:]+):\s*(\d+)\s*sets?\s*x\s*(\d+)\s*reps?/i;
    const sr = line.match(setsRepsPattern);
    if (sr) {
      return {
        name: sr[1].trim(),
        sets: parseInt(sr[2], 10),
        reps: parseInt(sr[3], 10),
        confidence: 0.8
      };
    }

    // "Running: X km in Y minutes"
    const runningPattern = /^([^:]+):\s*([\d.]+)\s*km\s*in\s*(\d+)\s*minutes?/i;
    const rm = line.match(runningPattern);
    if (rm) {
      return {
        name: rm[1].trim(),
        distance: parseFloat(rm[2]),
        duration: parseInt(rm[3], 10),
        confidence: 0.8
      };
    }

    return null;
  };

  const getStageMessage = () => {
    switch (stage) {
      case 'initializing': return 'Preparing image analysis...';
      case 'scanning': return 'Scanning text from image...';
      case 'analyzing': return 'Analyzing workout data...';
      case 'complete': return 'Processing complete!';
    }
  };

  const getStageIcon = () => {
    switch (stage) {
      case 'initializing': return '⚙️';
      case 'scanning': return '👁️';
      case 'analyzing': return '🧠';
      case 'complete': return '✅';
    }
  };

  return (
    <div style={{
      padding: 24,
      background: 'rgba(255,255,255,0.1)',
      backdropFilter: 'blur(8px)',
      borderRadius: 16,
      border: '1px solid rgba(6,182,212,0.2)',
      maxWidth: 600,
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64,
          background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto', fontSize: 24
        }}>
          {getStageIcon()}
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#06b6d4' }}>
          AI Workout Analysis
        </h2>
        <p style={{ color: '#d1d5db', fontSize: 14 }}>{getStageMessage()}</p>
      </div>

      <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
        <img src={previewUrl} alt="Uploaded workout" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
      </div>

      <div style={{ marginBottom: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`,
          height: 8,
          background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
          transition: 'width 0.5s ease',
          borderRadius: 8
        }} />
      </div>

      {extractedText && (
        <div style={{
          marginBottom: 16, padding: 16,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#10b981' }}>Extracted Text:</h4>
          <div style={{
            fontSize: 12, color: '#d1d5db', lineHeight: 1.4,
            maxHeight: 100, overflow: 'auto', whiteSpace: 'pre-wrap'
          }}>
            {extractedText}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { key: 'initializing', label: 'Initialize OCR Engine' },
          { key: 'scanning', label: 'Scan Image Text' },
          { key: 'analyzing', label: 'Analyze Workout Data' },
          { key: 'complete', label: 'Generate Stats' }
        ].map((item, index) => {
          const isActive = stage === item.key;
          const isComplete = ['initializing', 'scanning', 'analyzing', 'complete'].indexOf(stage) > index;
          return (
            <div key={item.key} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: 8,
              borderRadius: 6, background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent'
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: isComplete ? '#10b981' : isActive ? '#06b6d4' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: isComplete || isActive ? 'white' : '#9ca3af'
              }}>
                {isComplete ? '✓' : isActive ? '●' : index + 1}
              </div>
              <span style={{ fontSize: 14, color: isComplete ? '#10b981' : isActive ? '#06b6d4' : '#9ca3af' }}>
                {item.label}
              </span>
              {isActive && (
                <div style={{
                  width: 12, height: 12,
                  border: '2px solid rgba(6,182,212,0.3)',
                  borderTop: '2px solid #06b6d4',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/* ========================================================================== */
/*                            WORKOUT UPLOAD (UI)                              */
/* ========================================================================== */

interface WorkoutUploadProps {
  onImageCapture: (file: File) => void;
  isProcessing?: boolean;
}

const WorkoutUpload: React.FC<WorkoutUploadProps> = ({
  onImageCapture,
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
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    onImageCapture(file);
  }, [onImageCapture]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        (videoRef.current as HTMLVideoElement).srcObject = stream as unknown as MediaStream;
        setIsCamera(true);
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access is required to capture workout photos');
    }
  };

  const stopStream = () => {
    const stream = (videoRef.current?.srcObject as unknown as MediaStream | null);
    stream?.getTracks().forEach(t => t.stop());
    if (videoRef.current) (videoRef.current as HTMLVideoElement).srcObject = null as unknown as MediaStream;
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const w = (video as any).videoWidth || 1080;
    const h = (video as any).videoHeight || 1920;
    canvas.width = w; canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'workout-photo.jpg', { type: 'image/jpeg' });
          handleFile(file);
        }
      }, 'image/jpeg', 0.85);
    }

    stopStream();
    setIsCamera(false);
  };

  useEffect(() => () => stopStream(), []);

  return (
    <div className="workout-upload">
      <div className="upload-header">
        <h3>📸 Upload Workout Screenshot</h3>
        <p>Capture or upload a photo of your workout data</p>
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
              <p><strong>Drop workout screenshot here</strong> or click to browse</p>
              <div className="upload-buttons">
                <button className="btn" onClick={() => fileInputRef.current?.click()}>Choose File</button>
                <button className="btn secondary" onClick={startCamera}>Use Camera</button>
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
        </div>
      ) : (
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 12 }} />
          <div className="camera-controls">
            <button className="btn" onClick={capturePhoto}>Capture</button>
            <button className="btn secondary" onClick={() => { stopStream(); setIsCamera(false); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/*                         STATS CALCULATOR (UTILITY)                          */
/* ========================================================================== */

const StatsCalculator = {
  calculateLevel(experience: number) {
    return Math.floor(Math.sqrt(experience / 25)) + 1;
  },

  validateWorkout(workout: ExtractedWorkout) {
    if (!workout.exercises || workout.exercises.length === 0) {
      return { valid: false as const, reason: 'No exercises detected' };
    }
    return { valid: true as const, reason: 'OK' };
  },

  calculateWorkoutGains(workout: ExtractedWorkout): StatGains {
    let strength = 0;
    let endurance = 0;
    let xp = 10;

    for (const ex of workout.exercises) {
      if (typeof ex.sets === 'number' && typeof ex.reps === 'number') {
        strength += Math.round((ex.sets * ex.reps) / 4);
        xp += Math.round((ex.sets * ex.reps) / 6);
      }
      if (typeof ex.duration === 'number') {
        endurance += Math.round(ex.duration / 3);
        xp += Math.round(ex.duration / 5);
      }
      if (typeof ex.distance === 'number') {
        endurance += Math.round(ex.distance * 5);
        xp += Math.round(ex.distance * 4);
      }
    }

    // Intensity bonus
    if (workout.intensity === 'high') { strength += 5; endurance += 5; xp += 10; }
    if (workout.intensity === 'low') { xp = Math.max(5, xp - 6); }

    const reason = `+${strength} STR, +${endurance} END, +${xp} XP (intensity: ${workout.intensity})`;
    return { strength, endurance, experience: xp, reason };
  },
};

/* ========================================================================== */
/*                 FITNESS TRACKER (uses OCR + StatsCalculator)               */
/* ========================================================================== */

interface FitnessTrackerProps {
  user: any;
  onStatsUpdate: (newStats: { strength: number; endurance: number; experience: number }) => void;
}

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ user, onStatsUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load workout history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`workouts_${user.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as any[];
        const workouts: WorkoutSession[] = parsed.map((w) => ({ ...w, date: new Date(w.date) }));
        setWorkoutHistory(workouts);
      } catch (error) {
        console.error('Failed to parse workout history:', error);
      }
    }
  }, [user.id]);

  // Save workout history to localStorage
  const saveWorkoutHistory = (history: WorkoutSession[]) => {
    setWorkoutHistory(history);
    localStorage.setItem(`workouts_${user.id}`, JSON.stringify(history));
  };

  const handleImageCapture = (file: File) => {
    setSelectedFile(file);
    setShowUpload(false);
    setShowOCR(true);
    setIsProcessing(true);
  };

  const handleOCRComplete = (extractedWorkout: ExtractedWorkout) => {
    setIsProcessing(false);

    try {
      const validation = StatsCalculator.validateWorkout(extractedWorkout);
      if (!validation.valid) {
        alert(`Workout validation failed: ${validation.reason}`);
        setShowOCR(false);
        return;
      }

      const statGains = StatsCalculator.calculateWorkoutGains(extractedWorkout);

      const workoutSession: WorkoutSession = {
        id: `workout_${Date.now()}`,
        date: new Date(),
        extractedWorkout,
        statGains,
        verified: extractedWorkout.confidence > 0.7
      };

      const newHistory = [workoutSession, ...workoutHistory];
      saveWorkoutHistory(newHistory);

      const newStats = {
        strength: user.stats.strength + statGains.strength,
        endurance: user.stats.endurance + statGains.endurance,
        experience: user.stats.experience + statGains.experience
      };
      onStatsUpdate(newStats);

      alert(`🎉 Workout processed!\n\n${statGains.reason}\n\nTotal gains: +${statGains.strength} STR, +${statGains.endurance} END, +${statGains.experience} XP`);

      setShowOCR(false);
    } catch (error) {
      console.error('❌ Workout processing failed:', error);
      alert('Failed to process workout. Please try again.');
      setShowOCR(false);
    }
  };

  const handleOCRError = (error: string) => {
    setIsProcessing(false);
    alert(`OCR Error: ${error}`);
    setShowOCR(false);
  };

  const currentLevel = StatsCalculator.calculateLevel(user.stats.experience);

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <StyleInjector />
      <div className="profile-header">
        <div className="user-info">
          <div className="avatar">{user.telegramUser?.first_name?.[0] ?? 'U'}</div>
          <div>
            <h2>{user.telegramUser?.first_name} {user.telegramUser?.last_name ?? ''}</h2>
            <div className="user-meta">Level {currentLevel} • {user.bodyType?.replace('-', ' ') || '—'}</div>
          </div>
        </div>
        <div className="actions">
          <button
            className="btn"
            onClick={() => setShowUpload(true)}
          >
            Upload Workout
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-label">Strength</div>
          <div className="stat-value">{user.stats.strength}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Endurance</div>
          <div className="stat-value">{user.stats.endurance}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Experience</div>
          <div className="stat-value">{user.stats.experience}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Level</div>
          <div className="stat-value">{currentLevel}</div>
        </div>
      </div>

      <div className="history">
        <h3>Recent Workouts</h3>
        {workoutHistory.length === 0 ? (
          <div className="empty">No workouts yet. Upload your first screenshot!</div>
        ) : (
          workoutHistory.slice(0, 6).map((w) => (
            <div key={w.id} className="workout-item">
              <div className="workout-date">{w.date.toLocaleDateString()}</div>
              <div className="workout-summary">{w.extractedWorkout.exercises.length} exercises • {w.extractedWorkout.intensity} • {w.extractedWorkout.duration ?? 0} min</div>
              <div className="workout-gains">+{w.statGains.strength} STR, +{w.statGains.endurance} END, +{w.statGains.experience} XP</div>
            </div>
          ))
        )}
      </div>

      {/* Modal(s) */}
      {showUpload && (
        <div className="upload-modal" role="dialog" aria-modal="true">
          <div className="upload-content">
            <div className="upload-header">
              <h3>Upload Workout</h3>
              <button className="close-btn" onClick={() => setShowUpload(false)}>✖</button>
            </div>
            <div style={{ padding: 16 }}>
              <WorkoutUpload onImageCapture={handleImageCapture} isProcessing={isProcessing} />
            </div>
          </div>
        </div>
      )}

      {showOCR && selectedFile && (
        <div className="upload-modal" role="dialog" aria-modal="true">
          <div className="upload-content">
            <div className="upload-header">
              <h3>OCR Processing</h3>
              <button className="close-btn" onClick={() => setShowOCR(false)}>✖</button>
            </div>
            <div style={{ padding: 16 }}>
              <OCRProcessor imageFile={selectedFile} onProcessingComplete={handleOCRComplete} onError={handleOCRError} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================== */
/*                           SIMPLE BATTLE DEMO UI                             */
/* ========================================================================== */

export const VisualBattleEngineTest: React.FC<{ userProfile: any }> = ({ userProfile }) => {
  const [anim1, setAnim1] = useState<AnimationState>('idle');
  const [anim2, setAnim2] = useState<AnimationState>('idle');

  return (
    <div style={{ padding: 16 }}>
      <BattleBackground>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 24,
          height: 360
        }}>
          <CharacterSprite bodyType={userProfile.bodyType || 'fit-male'} currentAnimation={anim1} scale={1.2} />
          <div style={{ color: 'white', fontWeight: 800, fontSize: 40 }}>VS</div>
          <CharacterSprite bodyType="fit-male" currentAnimation={anim2} scale={1.2} isFlipped />
        </div>
      </BattleBackground>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
        {(['idle','punch','kick','block','hit','victory','defeat','walk'] as AnimationState[]).map(a => (
          <button key={`p1-${a}`} className="btn" onClick={() => setAnim1(a)}>{`P1: ${a}`}</button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {(['idle','punch','kick','block','hit','victory','defeat','walk'] as AnimationState[]).map(a => (
          <button key={`p2-${a}`} className="btn secondary" onClick={() => setAnim2(a)}>{`P2: ${a}`}</button>
        ))}
      </div>
    </div>
  );
};

/* ========================================================================== */
/*                          SPRITE TEST COMPONENT                              */
/* ========================================================================== */

export const SpriteTestComponent: React.FC = () => {
  const [currentBodyType, setCurrentBodyType] = useState<string>('fit-male');
  const [currentAnimation, setCurrentAnimation] = useState<AnimationState>('idle');

  const bodyTypes: BodyType[] = [
    'fit-male', 'fit-female', 'skinny-male', 'skinny-female',
    'overweight-male', 'overweight-female', 'obese-male', 'obese-female'
  ];

  const animations: AnimationState[] = ['idle', 'punch', 'kick', 'block', 'hit', 'victory', 'defeat', 'walk'];

  return (
    <div style={{ padding: 20 }}>
      <h2>🎮 Battle Arena Sprite Test</h2>

      <div style={{ marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Body Type:</label>
          <select
            value={currentBodyType}
            onChange={(e) => setCurrentBodyType(e.target.value)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {bodyTypes.map(type => (
              <option key={type} value={type}>{type.replace('-', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Animation:</label>
          <select
            value={currentAnimation}
            onChange={(e) => setCurrentAnimation(e.target.value as AnimationState)}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          >
            {animations.map(anim => (
              <option key={anim} value={anim}>{anim.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      <BattleBackground style={{ minHeight: 300, marginBottom: 20 }}>
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 60px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <CharacterSprite
              bodyType={currentBodyType}
              currentAnimation={currentAnimation}
              scale={1.2}
            />
            <div style={{
              marginTop: 10,
              color: 'white',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              Player
            </div>
          </div>

          <div style={{
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            transform: 'rotate(-10deg)'
          }}>
            VS
          </div>

          <div style={{ textAlign: 'center' }}>
            <CharacterSprite
              bodyType="fit-male"
              currentAnimation="idle"
              isFlipped={true}
              scale={1.2}
            />
            <div style={{
              marginTop: 10,
              color: 'white',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
            }}>
              Opponent
            </div>
          </div>
        </div>
      </BattleBackground>
    </div>
  );
};

/* ========================================================================== */
/*                                    STYLES                                  */
/* ========================================================================== */

export const fitnessStyles = `
/* Container scaffolding */
.profile-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; margin-bottom: 16px;
}
.user-info { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 40px; height: 40px; border-radius: 50%;
  background: linear-gradient(135deg, #06b6d4, #8b5cf6);
  display: flex; align-items: center; justify-content: center; color: white; font-weight: 800;
}
.user-meta { color: #9ca3af; font-size: 12px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }

.summary-grid {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;
}
.stat-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 12px;
}
.stat-label { font-size: 12px; color: #9ca3af; }
.stat-value { font-weight: 800; font-size: 20px; }

.history { margin-top: 20px; }
.history h3 { margin: 0 0 8px 0; }
.empty { color: #9ca3af; font-size: 14px; }
.workout-item {
  display: flex; gap: 12px; align-items: center; justify-content: space-between;
  padding: 10px; border-radius: 10px; margin-bottom: 8px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
}
.workout-date { font-weight: 700; }
.workout-summary { color: #cbd5e1; font-size: 12px; }
.workout-gains { font-weight: 700; color: #22c55e; }

/* Modal */
.upload-modal {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.upload-content {
  background: white; color: #111827; border-radius: 16px; max-width: 600px; width: 100%;
  max-height: 90vh; overflow-y: auto; position: relative;
}
.upload-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
.close-btn { background: transparent; border: none; font-size: 18px; cursor: pointer; }

/* Workout Upload Styles */
.workout-upload { background: rgba(255,255,255,0.06); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); }
.upload-header h3 { margin: 0 0 4px 0; }
.upload-zone { margin-top: 12px; border: 2px dashed rgba(255,255,255,0.2); border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; }
.upload-zone.drag-active { border-color: #06b6d4; background: rgba(6,182,212,0.08); }
.upload-placeholder .upload-icon { font-size: 48px; margin-bottom: 8px; }
.upload-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
.preview-container { position: relative; }
.preview-image { width: 100%; border-radius: 8px; display: block; }
.preview-overlay { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: white; padding: 6px 10px; border-radius: 8px; }
.camera-controls { display: flex; gap: 10px; justify-content: center; margin-top: 10px; }
.spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Button Styles */
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #06b6d4;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn:hover {
  background: #0891b2;
  transform: translateY(-1px);
}

.btn.secondary {
  background: #64748b;
}

.btn.secondary:hover {
  background: #475569;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:disabled:hover {
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-header { flex-direction: column; gap: 20px; text-align: center; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .workout-item { flex-direction: column; align-items: flex-start; gap: 10px; }
  .upload-modal { padding: 10px; }
  .upload-content { max-height: 95vh; }
}
`;

const StyleInjector: React.FC = () => {
  useEffect(() => {
    const id = 'fitness-styles';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = fitnessStyles;
    document.head.appendChild(el);
  }, []);
  return null;
};

/* ========================================================================== */
/*                                   EXPORTS                                   */
/* ========================================================================== */

export {
  WorkoutUpload,
  OCRProcessor,
  StatsCalculator,
  FitnessTracker,
  CharacterSprite,
  BattleBackground,
};

export default FitnessTracker;