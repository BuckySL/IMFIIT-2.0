// ============================================================================
// COMPLETE AI TRAINER FRONTEND WITH ML CHATBOT INTEGRATION (Finished)
// File: src/components/ai/AITrainerSystem.tsx
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';

// ----------------------------- Types ----------------------------------------
interface AITrainer {
  id: string;
  name: string;
  specialty: string;
  personality: string;
  experience: number; // 0-100 score
  avatar: string; // emoji or URL
  description: string;
  stats: {
    strength: number;
    endurance: number;
    intelligence: number;
  };
}

interface UserProfile {
  userId: string;
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: string; // "male" | "female" | "other"
  activityLevel: string; // sedentary | light | moderate | active | very_active
  fitnessLevel: string; // beginner | intermediate | advanced
  goals: string[]; // e.g. ["fat_loss","muscle_gain"]
  bmi?: number;
  bmiCategory?: string;
}

interface MLAssessment {
  bmi_analysis: {
    value: number;
    category: string;
    interpretation: string;
    ideal_weight_range: {
      min_kg: number;
      max_kg: number;
    };
  };
  health_assessment: {
    potential_risks: string[];
    recommendations: string[];
    priority_actions: string[];
  };
  nutrition_plan: {
    bmr: number;
    tdee: number;
    daily_targets: {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    };
    meal_timing: Record<string, string> & { notes?: string };
    food_suggestions: Record<string, string[]>;
  };
  workout_plan: any; // backend-defined structure
  timeline: any; // milestones/progression
}

interface ChatMessage {
  id: string;
  type: 'user' | 'trainer' | 'system';
  message: string;
  timestamp: Date;
  trainerName?: string;
  trainerAvatar?: string;
  data?: any;
}

interface AITrainerSystemProps {
  userId: string;
  userAge?: number;
  userWeight?: number;
  userHeight?: number;
  userGender?: string;
  userActivityLevel?: string;
  userGoals?: string[];
  socket?: any; // optional Socket.IO client
  onWorkoutRecommendation?: (recommendation: any) => void;
}

// ----------------------------- Component ------------------------------------
const AITrainerSystem: React.FC<AITrainerSystemProps> = ({
  userId,
  userAge = 25,
  userWeight = 70,
  userHeight = 175,
  userGender = 'male',
  userActivityLevel = 'moderate',
  userGoals = ['general_fitness'],
  socket,
  onWorkoutRecommendation
}) => {
  const [trainers, setTrainers] = useState<AITrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<AITrainer | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [assessment, setAssessment] = useState<MLAssessment | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profile' | 'trainers' | 'assessment' | 'chat'>('profile');
  const [profileCreated, setProfileCreated] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Backend URL
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

  // Auto-select first trainer when trainers load
  useEffect(() => {
    if (!selectedTrainer && trainers.length > 0) {
      setSelectedTrainer(trainers[0]);
    }
  }, [trainers, selectedTrainer]);

  // Initialize trainers
  useEffect(() => {
    loadTrainers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create user profile on mount if data available
  useEffect(() => {
    if (userAge && userWeight && userHeight && userGender && !profileCreated) {
      createUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAge, userWeight, userHeight, userGender]);

  // Optional socket listeners for real-time bot replies
  useEffect(() => {
    if (!socket) return;

    const onBotReply = (payload: { userId: string; text: string; data?: any }) => {
      if (payload.userId !== userId) return;
      const botMessage: ChatMessage = {
        id: `msg_${Date.now()}_rt`,
        type: 'trainer',
        message: payload.text,
        timestamp: new Date(),
        trainerName: selectedTrainer?.name || 'AI Coach',
        trainerAvatar: selectedTrainer?.avatar || '🤖',
        data: payload.data
      };
      setChatMessages(prev => [...prev, botMessage]);
      if (payload.data?.workout_plan && onWorkoutRecommendation) {
        onWorkoutRecommendation(payload.data.workout_plan);
      }
    };

    socket.on('chatbot_reply', onBotReply);
    return () => {
      socket.off('chatbot_reply', onBotReply);
    };
  }, [socket, selectedTrainer, userId, onWorkoutRecommendation]);

  // Always scroll to bottom when messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  // ----------------------------- Data Loaders --------------------------------
  const loadTrainers = async () => {
    try {
      setError('');
      const response = await fetch(`${BACKEND_URL}/api/ai-trainers`);
      const data = await response.json();

      if (data.success && data.trainers) {
        setTrainers(data.trainers);
      } else {
        throw new Error('Failed to load trainers');
      }
    } catch (err) {
      console.warn('Using fallback trainers');
      // Fallback trainers
      setTrainers([
        {
          id: '1',
          name: 'Coach Mike',
          specialty: 'strength',
          personality: 'motivational',
          experience: 95,
          avatar: '💪',
          description: 'The ultimate strength coach who pushes you beyond your limits',
          stats: { strength: 95, endurance: 75, intelligence: 80 }
        },
        {
          id: '2',
          name: 'Dr. Sarah',
          specialty: 'endurance',
          personality: 'analytical',
          experience: 92,
          avatar: '🏃‍♀️',
          description: 'Scientific approach to endurance and cardiovascular fitness',
          stats: { strength: 70, endurance: 95, intelligence: 92 }
        },
        {
          id: '3',
          name: 'Zen Master Liu',
          specialty: 'flexibility',
          personality: 'calm',
          experience: 88,
          avatar: '🧘‍♂️',
          description: 'Mindful movement and flexibility expert',
          stats: { strength: 75, endurance: 85, intelligence: 88 }
        }
      ]);
    }
  };

  const computeBMILocal = (heightCm: number, weightKg: number) => {
    const hM = heightCm / 100;
    const bmi = Math.round((weightKg / (hM * hM)) * 10) / 10;
    let category = 'normal';
    if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'normal';
    else if (bmi < 30) category = 'overweight';
    else category = 'obese';
    return { bmi, category };
  };

  const createUserProfile = async () => {
    setLoading(true);
    try {
      const userData = {
        userId,
        age: userAge,
        weight: userWeight,
        height: userHeight,
        gender: userGender,
        activityLevel: userActivityLevel,
        fitnessLevel: 'beginner',
        goals: userGoals,
        healthConditions: [],
        dietaryRestrictions: []
      };

      const response = await fetch(`${BACKEND_URL}/api/chatbot/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        setUserProfile({
          ...userData,
          bmi: data.profile.bmi,
          bmiCategory: data.profile.category
        });

        if (data.assessment) {
          setAssessment(data.assessment);
        }

        setProfileCreated(true);

        const welcomeMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          type: 'system',
          message: `Welcome! Your BMI is ${data.profile.bmi} (${data.profile.category}). I've created a personalized fitness plan for you.`,
          timestamp: new Date()
        };
        setChatMessages([welcomeMsg]);
      } else {
        throw new Error('Profile API returned success=false');
      }
    } catch (err) {
      console.error('Failed to create profile:', err);
      setError('Failed to create profile. Using local mode.');

      const { bmi, category } = computeBMILocal(userHeight, userWeight);
      setUserProfile({
        userId,
        age: userAge,
        weight: userWeight,
        height: userHeight,
        gender: userGender,
        activityLevel: userActivityLevel,
        fitnessLevel: 'beginner',
        goals: userGoals,
        bmi,
        bmiCategory: category
      });
      setProfileCreated(true);
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_${Date.now()}_sys`,
          type: 'system',
          message: `Local mode active. BMI is ${bmi} (${category}).`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------- Chat Flow -----------------------------------
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      message: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: userMessage.message,
          trainer: selectedTrainer?.id,
          context: {
            profile: userProfile,
            lastAssessment: assessment
          }
        })
      });

      const data = await response.json();

      if (data.response) {
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          type: 'trainer',
          message: data.response,
          timestamp: new Date(),
          trainerName: selectedTrainer?.name || 'AI Coach',
          trainerAvatar: selectedTrainer?.avatar || '🤖',
          data: data.data
        };

        setChatMessages(prev => [...prev, botMessage]);

        // Update assessment/profile if backend sends refresh
        if (data.data?.assessment) {
          setAssessment(data.data.assessment);
        }
        if (data.data?.bmi) {
          setUserProfile(prev => prev ? { ...prev, bmi: data.data.bmi, bmiCategory: data.data.category } : prev);
        }
        if (data.data?.workout_plan && onWorkoutRecommendation) {
          onWorkoutRecommendation(data.data.workout_plan);
        }
      } else {
        throw new Error('No response text');
      }
    } catch (err) {
      console.error('Chat error:', err);

      const fallbackMessage: ChatMessage = {
        id: `msg_${Date.now()}_fallback`,
        type: 'trainer',
        message: "I'm here to help you with your fitness journey! Ask about BMI, macros, diet, or workouts.",
        timestamp: new Date(),
        trainerName: selectedTrainer?.name || 'AI Coach',
        trainerAvatar: selectedTrainer?.avatar || '🤖'
      };

      setChatMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getQuickResponse = async (topic: string) => {
    setChatInput(topic);

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      message: topic,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: topic, trainer: selectedTrainer?.id })
      });

      const data = await response.json();

      if (data.response) {
        const botMessage: ChatMessage = {
          id: `msg_${Date.now()}_bot`,
          type: 'trainer',
          message: data.response,
          timestamp: new Date(),
          trainerName: selectedTrainer?.name || 'AI Coach',
          trainerAvatar: selectedTrainer?.avatar || '🤖',
          data: data.data
        };

        setChatMessages(prev => [...prev, botMessage]);
      }
    } catch (err) {
      console.error('Quick response error:', err);
    } finally {
      setLoading(false);
      setChatInput('');
    }
  };

  // ----------------------------- Formatting ----------------------------------
  const formatNutritionPlan = (nutrition: MLAssessment['nutrition_plan'] | any) => {
    if (!nutrition) return 'No nutrition data available';

    return `\n🔥 Daily Targets:\n• Calories: ${nutrition.daily_targets?.calories ?? 'N/A'} kcal\n• Protein: ${nutrition.daily_targets?.protein ?? 'N/A'}g\n• Carbs: ${nutrition.daily_targets?.carbs ?? 'N/A'}g\n• Fats: ${nutrition.daily_targets?.fats ?? 'N/A'}g\n\n⚡ Energy Balance:\n• BMR: ${nutrition.bmr ?? 'N/A'} kcal\n• TDEE: ${nutrition.tdee ?? 'N/A'} kcal\n\n🍽️ Meal Timing:\n${Object.entries(nutrition.meal_timing || {})
      .filter(([key]) => key !== 'notes')
      .map(([meal, time]) => `• ${meal}: ${time}`)
      .join('\n')}`.trim();
  };

  const formatHealthRisks = (health: MLAssessment['health_assessment'] | any) => {
    if (!health) return 'No health data available';

    return `\n⚠️ Potential Risks:\n${(health.potential_risks || []).map((risk: string) => `• ${risk}`).join('\n')}\n\n✅ Recommendations:\n${(health.recommendations || []).map((rec: string) => `• ${rec}`).join('\n')}\n\n🎯 Priority Actions:\n${(health.priority_actions || []).map((action: string, i: number) => `${i + 1}. ${action}`).join('\n')}`.trim();
  };

  const formatWorkoutPlan = (plan: any) => {
    if (!plan) return 'No workout data available';
    if (Array.isArray(plan)) {
      return plan
        .map((day, idx) => {
          const header = day?.name || `Day ${idx + 1}`;
          const lines = (day?.exercises || [])
            .map((ex: any) => `• ${ex.name} — ${ex.sets || 3}x${ex.reps || '10'}${ex.rpe ? ` (RPE ${ex.rpe})` : ''}`)
            .join('\n');
          return `${header}\n${lines}`;
        })
        .join('\n\n');
    }
    // fallback stringify
    try { return JSON.stringify(plan, null, 2); } catch { return String(plan); }
  };

  // ----------------------------- Derived UI ----------------------------------
  const riskBadgeColor = useMemo(() => {
    const cat = userProfile?.bmiCategory || '';
    if (cat === 'underweight') return '#3b82f6';
    if (cat === 'normal') return '#10b981';
    if (cat === 'overweight') return '#f59e0b';
    if (cat === 'obese') return '#ef4444';
    return '#9ca3af';
  }, [userProfile?.bmiCategory]);

  // ----------------------------- Render --------------------------------------
  return (
    <div className="ai-trainer-system">
      {/* Header */}
      <div className="system-header">
        <h2>🤖 AI Fitness Coach</h2>
        {userProfile && (
          <div className="user-stats">
            <span className="stat-badge">BMI: {userProfile.bmi}</span>
            <span className="stat-badge" style={{ background: riskBadgeColor }}>{userProfile.bmiCategory}</span>
            <span className="stat-badge">{userProfile.fitnessLevel}</span>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="error-notice">
          <span>⚠️</span>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="trainer-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
        <button
          className={`tab-button ${activeTab === 'trainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('trainers')}
        >
          🏋️ Trainers
        </button>
        <button
          className={`tab-button ${activeTab === 'assessment' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessment')}
          disabled={!profileCreated}
        >
          📊 Assessment
        </button>
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          disabled={!profileCreated}
        >
          💬 Chat
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="profile-section">
          <h3>Your Fitness Profile</h3>

          {userProfile ? (
            <div className="profile-info">
              <div className="profile-grid">
                <div className="profile-card">
                  <h4>Basic Info</h4>
                  <p>Age: {userProfile.age} years</p>
                  <p>Weight: {userProfile.weight} kg</p>
                  <p>Height: {userProfile.height} cm</p>
                  <p>Gender: {userProfile.gender}</p>
                </div>

                <div className="profile-card">
                  <h4>BMI Analysis</h4>
                  <div className="bmi-display">
                    <span className="bmi-value">{userProfile.bmi}</span>
                    <span className={`bmi-category ${userProfile.bmiCategory}`}>
                      {userProfile.bmiCategory?.toUpperCase()}
                    </span>
                  </div>
                  <p>Activity: {userProfile.activityLevel}</p>
                  <p>Level: {userProfile.fitnessLevel}</p>
                </div>

                <div className="profile-card">
                  <h4>Goals</h4>
                  <div className="goals-list">
                    {userProfile.goals.map((goal, i) => (
                      <span key={i} className="goal-tag">
                        {goal.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {!profileCreated && (
                <button
                  onClick={createUserProfile}
                  className="create-profile-btn"
                  disabled={loading}
                >
                  {loading ? 'Creating Profile...' : 'Create ML Profile'}
                </button>
              )}
            </div>
          ) : (
            <div className="no-profile">
              <p>No profile data available. Please provide your fitness information.</p>
              <button onClick={createUserProfile} disabled={loading}>
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trainers Tab */}
      {activeTab === 'trainers' && (
        <div className="trainers-section">
          <h3>Choose Your AI Coach</h3>
          <div className="trainers-grid">
            {trainers.map(trainer => (
              <div
                key={trainer.id}
                className={`trainer-card ${selectedTrainer?.id === trainer.id ? 'selected' : ''}`}
                onClick={() => setSelectedTrainer(trainer)}
              >
                <div className="trainer-avatar">{trainer.avatar}</div>
                <h4>{trainer.name}</h4>
                <p className="trainer-specialty">{trainer.specialty}</p>
                <p className="trainer-desc">{trainer.description}</p>
                <div className="trainer-stats-mini">
                  <div className="stat-mini">STR: {trainer.stats.strength}</div>
                  <div className="stat-mini">END: {trainer.stats.endurance}</div>
                  <div className="stat-mini">INT: {trainer.stats.intelligence}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Tab */}
      {activeTab === 'assessment' && profileCreated && (
        <div className="assessment-section">
          <h3>Your Fitness Assessment</h3>

          {assessment ? (
            <div className="assessment-content">
              {/* BMI Analysis */}
              <div className="assessment-card">
                <h4>📊 BMI Analysis</h4>
                <div className="bmi-details">
                  <p>Current BMI: <strong>{assessment.bmi_analysis.value}</strong></p>
                  <p>Category: <strong>{assessment.bmi_analysis.category}</strong></p>
                  <p>{assessment.bmi_analysis.interpretation}</p>
                  <p>
                    Ideal Weight Range: {assessment.bmi_analysis.ideal_weight_range.min_kg} - {assessment.bmi_analysis.ideal_weight_range.max_kg} kg
                  </p>
                </div>
              </div>

              {/* Health Assessment */}
              <div className="assessment-card">
                <h4>⚕️ Health Assessment</h4>
                <pre className="assessment-text">{formatHealthRisks(assessment.health_assessment)}</pre>
              </div>

              {/* Nutrition Plan */}
              <div className="assessment-card">
                <h4>🥗 Nutrition Plan</h4>
                <pre className="assessment-text">{formatNutritionPlan(assessment.nutrition_plan)}</pre>
              </div>

              {/* Workout Plan (if provided by backend) */}
              {assessment.workout_plan && (
                <div className="assessment-card">
                  <h4>💪 Workout Plan</h4>
                  <pre className="assessment-text">{formatWorkoutPlan(assessment.workout_plan)}</pre>
                </div>
              )}

              {/* Quick Actions */}
              <div className="quick-actions">
                <button onClick={() => { setActiveTab('chat'); getQuickResponse('Show me my detailed diet plan'); }}>Get Diet Plan</button>
                <button onClick={() => { setActiveTab('chat'); getQuickResponse('Create a workout routine for me'); }}>Get Workout Plan</button>
                <button onClick={() => { setActiveTab('chat'); getQuickResponse('What supplements should I take?'); }}>Supplement Guide</button>
              </div>
            </div>
          ) : (
            <div className="no-assessment">
              <p>Complete your profile to get a personalized assessment.</p>
              <button onClick={() => setActiveTab('profile')}>Go to Profile</button>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && profileCreated && (
        <div className="chat-section">
          <div className="chat-header">
            <div className="chat-trainer-info">
              <span className="trainer-avatar">{selectedTrainer?.avatar || '🤖'}</span>
              <div>
                <h4>{selectedTrainer?.name || 'AI Fitness Coach'}</h4>
                <p>ML-Powered Personal Trainer</p>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {chatMessages.map(message => (
              <div key={message.id} className={`message ${message.type}`}>
                {message.type === 'trainer' && (
                  <div className="message-avatar">{message.trainerAvatar || '🤖'}</div>
                )}
                <div className="message-content">
                  {message.type === 'trainer' && (
                    <div className="message-name">{message.trainerName || 'AI Coach'}</div>
                  )}
                  <div className="message-text">{message.message}</div>
                  <div className="message-time">{
                    message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message trainer">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator"><span></span><span></span><span></span></div>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          <div className="chat-controls">
            <div className="quick-messages">
              <button onClick={() => getQuickResponse("What's my BMI and what does it mean?")}>📊 BMI Info</button>
              <button onClick={() => getQuickResponse('Create a diet plan for me')}>🥗 Diet Plan</button>
              <button onClick={() => getQuickResponse('I need a workout routine')}>💪 Workout</button>
              <button onClick={() => getQuickResponse('What are my health risks?')}>⚕️ Health</button>
              <button onClick={() => getQuickResponse('How can I track my progress?')}>📈 Progress</button>
              <button onClick={() => getQuickResponse('I need motivation')}>🔥 Motivation</button>
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about fitness, nutrition, or health..."
                onKeyDown={(e) => e.key === 'Enter' && !loading && sendChatMessage()}
                disabled={loading}
              />
              <button onClick={sendChatMessage} disabled={!chatInput.trim() || loading} className="send-button">
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .ai-trainer-system {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          border-radius: 16px;
          color: white;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .system-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .system-header h2 {
          margin: 0;
          font-size: 28px;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .user-stats { display: flex; gap: 12px; }
        .stat-badge {
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .error-notice {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #fca5a5;
        }

        .trainer-tabs { display: flex; gap: 8px; margin-bottom: 24px; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 4px; }
        .tab-button {
          flex: 1; padding: 12px 20px; background: none; border: none; color: #9ca3af; border-radius: 8px; cursor: pointer; transition: all .3s ease; font-weight: 500;
        }
        .tab-button:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: white; }
        .tab-button.active { background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; }
        .tab-button:disabled { opacity: .5; cursor: not-allowed; }

        /* Profile Section */
        .profile-section { animation: fadeIn .5s ease; }
        .profile-section h3 { margin-bottom: 24px; font-size: 24px; }
        .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px; }
        .profile-card { background: rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }
        .profile-card h4 { margin: 0 0 16px 0; color: #06b6d4; font-size: 16px; }
        .profile-card p { margin: 8px 0; color: #d1d5db; }
        .bmi-display { display: flex; align-items: center; gap: 12px; margin: 16px 0; }
        .bmi-value { font-size: 36px; font-weight: bold; color: #06b6d4; }
        .bmi-category { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .bmi-category.underweight { background: #3b82f6; }
        .bmi-category.normal { background: #10b981; }
        .bmi-category.overweight { background: #f59e0b; }
        .bmi-category.obese { background: #ef4444; }
        .goals-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .goal-tag { background: rgba(139,92,246,0.2); color: #a78bfa; padding: 4px 12px; border-radius: 12px; font-size: 12px; text-transform: capitalize; }
        .create-profile-btn { background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all .3s ease; }
        .create-profile-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(6,182,212,0.3); }
        .create-profile-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* Trainers Section */
        .trainers-section h3 { margin-bottom: 24px; font-size: 24px; text-align: center; }
        .trainers-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .trainer-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 16px; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
        .trainer-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(0,0,0,0.25); border-color: rgba(6,182,212,0.45); }
        .trainer-card.selected { outline: 2px solid #06b6d4; background: rgba(6,182,212,0.08); }
        .trainer-avatar { font-size: 36px; }
        .trainer-specialty { color: #93c5fd; text-transform: capitalize; margin: 4px 0; }
        .trainer-desc { color: #d1d5db; font-size: 14px; min-height: 40px; }
        .trainer-stats-mini { display: flex; gap: 8px; margin-top: 10px; }
        .stat-mini { background: rgba(255,255,255,0.12); padding: 6px 10px; border-radius: 10px; font-size: 12px; }

        /* Assessment */
        .assessment-section h3 { margin-bottom: 16px; font-size: 24px; }
        .assessment-content { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .assessment-card { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px; }
        .assessment-text { white-space: pre-wrap; color: #e5e7eb; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 13px; }
        .quick-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
        .quick-actions button { background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.35); color: #e0f2fe; border-radius: 8px; padding: 8px 12px; cursor: pointer; }

        /* Chat */
        .chat-section { display: flex; flex-direction: column; gap: 12px; }
        .chat-header { display: flex; justify-content: space-between; align-items: center; }
        .chat-trainer-info { display: flex; align-items: center; gap: 10px; }
        .chat-messages { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px; max-height: 420px; overflow-y: auto; }
        .message { display: flex; gap: 10px; margin-bottom: 10px; }
        .message.user { justify-content: flex-end; }
        .message.system .message-content { background: rgba(147,197,253,0.12); border-color: rgba(147,197,253,0.35); }
        .message-avatar { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 50%; }
        .message-content { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); padding: 10px 12px; border-radius: 12px; max-width: 80%; }
        .message-name { font-size: 12px; color: #93c5fd; margin-bottom: 4px; }
        .message-text { white-space: pre-wrap; line-height: 1.45; }
        .message-time { font-size: 10px; color: #9ca3af; margin-top: 6px; text-align: right; }
        .typing-indicator { display: inline-flex; gap: 4px; }
        .typing-indicator span { width: 6px; height: 6px; background: #e5e7eb; border-radius: 50%; display: inline-block; animation: blink 1.4s infinite both; }
        .typing-indicator span:nth-child(2) { animation-delay: .2s; }
        .typing-indicator span:nth-child(3) { animation-delay: .4s; }

        .chat-controls { display: flex; flex-direction: column; gap: 10px; }
        .quick-messages { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
        .quick-messages button { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #e5e7eb; border-radius: 8px; padding: 8px; cursor: pointer; }
        .quick-messages button:hover { background: rgba(6,182,212,0.1); border-color: rgba(6,182,212,0.35); }

        .chat-input { display: flex; gap: 8px; }
        .chat-input input { flex: 1; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #e5e7eb; border-radius: 10px; padding: 10px 12px; }
        .send-button { background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; border: none; padding: 10px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; }

        .no-profile, .no-assessment { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 80%, 100% { opacity: .2; } 40% { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default AITrainerSystem;
