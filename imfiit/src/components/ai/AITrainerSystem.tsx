// ============================================================================
// COMPLETE AI TRAINER FRONTEND COMPONENT
// Create this file: src/components/ai/AITrainerSystem.tsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import dataService from '../services/DataService';

// Types
interface AITrainer {
  id: string;
  name: string;
  specialty: string;
  personality: string;
  experience: number;
  avatar: string;
  description: string;
  stats: {
    strength: number;
    endurance: number;
    intelligence: number;
  };
}

interface WorkoutAnalysis {
  totalWorkouts: number;
  avgDuration: number;
  preferredType: string;
  weeklyFrequency: number;
  consistencyScore: number;
  fitnessLevel: string;
  suggestions: string[];
  recommendedTrainer: string;
  weeklyGoal: string;
  nextWorkout: string;
  motivationalMessage: string;
  trainerName?: string;
  trainerMessage?: string;
  trainerAvatar?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'trainer';
  message: string;
  timestamp: Date;
  trainerName?: string;
  trainerAvatar?: string;
}

interface AITrainerSystemProps {
  userId: string;
  socket?: any; // Optional socket connection
  onWorkoutRecommendation?: (recommendation: any) => void;
}

const AITrainerSystem: React.FC<AITrainerSystemProps> = ({ 
  userId, 
  socket,
  onWorkoutRecommendation 
}) => {
  const [trainers, setTrainers] = useState<AITrainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<AITrainer | null>(null);
  const [analysis, setAnalysis] = useState<WorkoutAnalysis | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'trainers' | 'analysis' | 'chat'>('trainers');

  // Backend URL - update this to match your setup
  const BACKEND_URL = 'http://localhost:3001';

  // Load trainers on component mount
  useEffect(() => {
    loadTrainers();
  }, []);

  // Load recommended trainer after trainers are loaded
  useEffect(() => {
    if (trainers.length > 0) {
      loadRecommendedTrainer();
    }
  }, [trainers, userId]);

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
      console.warn('Backend not available, using fallback trainers');
      setError('⚠️ Using offline trainers (backend not connected)');
      
      // Fallback trainers when backend is not available
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
        },
        {
          id: '4',
          name: 'Coach Thunder',
          specialty: 'high-intensity',
          personality: 'energetic',
          experience: 90,
          avatar: '⚡',
          description: 'High-energy HIIT and explosive training specialist',
          stats: { strength: 88, endurance: 90, intelligence: 78 }
        },
        {
          id: '5',
          name: 'Mentor Grace',
          specialty: 'wellness',
          personality: 'supportive',
          experience: 85,
          avatar: '🌟',
          description: 'Holistic wellness and recovery focused mentor',
          stats: { strength: 70, endurance: 80, intelligence: 85 }
        }
      ]);
    }
  };

  const loadRecommendedTrainer = async () => {
    if (!trainers.length) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-trainers/recommended/${userId}`);
      const data = await response.json();
      
      if (data.success && data.trainer) {
        const trainer = trainers.find(t => t.id === data.trainer.id);
        if (trainer) {
          setSelectedTrainer(trainer);
          setActiveTab('analysis');
          return;
        }
      }
    } catch (err) {
      console.log('Using fallback trainer selection');
    }
    
    // Fallback: select first trainer
    setSelectedTrainer(trainers[0]);
  };

  const getWorkoutAnalysis = async () => {
    if (!selectedTrainer) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-trainers/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          trainerId: selectedTrainer.id
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err) {
      console.warn('Using fallback analysis');
      // Fallback analysis
      setAnalysis({
        totalWorkouts: Math.floor(Math.random() * 50) + 10,
        avgDuration: Math.floor(Math.random() * 30) + 30,
        preferredType: ['strength', 'cardio', 'flexibility', 'sports'][Math.floor(Math.random() * 4)],
        weeklyFrequency: Math.floor(Math.random() * 5) + 2,
        consistencyScore: Math.floor(Math.random() * 40) + 60,
        fitnessLevel: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)],
        suggestions: [
          'Increase workout frequency by 1 session per week',
          'Focus more on compound movements',
          'Add 10 minutes of stretching after each workout',
          'Try progressive overload in your strength training'
        ],
        recommendedTrainer: selectedTrainer.name,
        weeklyGoal: 'Complete 4 balanced workouts this week',
        nextWorkout: 'Upper body strength training with 3 sets of 8-10 reps',
        motivationalMessage: `You're making great progress! ${selectedTrainer.name} believes in your potential!`,
        trainerName: selectedTrainer.name,
        trainerMessage: `Hey there! I've analyzed your workout pattern and I'm impressed with your dedication. Let's focus on consistency and progressive improvement this week!`,
        trainerAvatar: selectedTrainer.avatar
      });
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedTrainer) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      message: chatInput.trim(),
      timestamp: new Date()
    };

    // Add the user's message immediately
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setLoading(true);

    // >>> WHEN USER SENDS MESSAGE — local DataService chatbot response (your requested insertion)
    try {
      const fitnessLevel = analysis?.fitnessLevel ?? 'intermediate';
      const response = dataService.getChatbotResponse(
        userMessage.message,
        {
          userName: (typeof userId === 'string' && userId) || 'Athlete',
          fitnessLevel
        }
      );

      if (response?.response) {
        const trainerMessage: ChatMessage = {
          id: `msg_${Date.now()}_trainer_local`,
          type: 'trainer',
          message: response.response,
          timestamp: new Date(),
          trainerName: selectedTrainer?.name,
          trainerAvatar: selectedTrainer?.avatar
        };
        setChatMessages(prev => [...prev, trainerMessage]);
        // If you want to stop after local reply, uncomment the next line:
        // setLoading(false); return;
      }
    } catch (e) {
      console.warn('Local DataService chatbot failed:', e);
    }
    // <<< END INSERT

    // Continue with backend chat (kept as-is)
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai-trainers/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          trainerId: selectedTrainer.id,
          message: userMessage.message
        })
      });

      const data = await response.json();
      
      if (data.success && data.response) {
        const trainerMessage: ChatMessage = {
          id: `msg_${Date.now()}_trainer`,
          type: 'trainer',
          message: data.response,
          timestamp: new Date(),
          trainerName: selectedTrainer.name,
          trainerAvatar: selectedTrainer.avatar
        };
        
        setChatMessages(prev => [...prev, trainerMessage]);
      } else {
        throw new Error('Chat failed');
      }
    } catch (err) {
      // Fallback responses
      const fallbackResponses = [
        "That's a great question! Keep pushing forward with your fitness journey!",
        "I'm here to support you every step of the way. What specific area would you like to focus on?",
        "Your dedication is impressive! Let's work together to reach your goals.",
        "Remember, consistency is key. Every workout counts towards your progress!",
        "I believe in your potential! What's your biggest fitness challenge right now?"
      ];
      
      const trainerMessage: ChatMessage = {
        id: `msg_${Date.now()}_trainer_fallback`,
        type: 'trainer',
        message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        timestamp: new Date(),
        trainerName: selectedTrainer.name,
        trainerAvatar: selectedTrainer.avatar
      };
      
      setChatMessages(prev => [...prev, trainerMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getWorkoutRecommendation = () => {
    if (onWorkoutRecommendation && analysis) {
      const recommendation = {
        trainer: selectedTrainer,
        workout: analysis.nextWorkout,
        goal: analysis.weeklyGoal,
        type: analysis.preferredType
      };
      onWorkoutRecommendation(recommendation);
    }
  };

  const getPersonalityColor = (personality: string) => {
    const colors: { [key: string]: string } = {
      motivational: '#ff6b6b',
      analytical: '#4ecdc4',
      calm: '#45b7d1',
      energetic: '#f9ca24',
      supportive: '#6c5ce7'
    };
    return colors[personality] || '#06b6d4';
  };

  return (
    <div className="ai-trainer-system">
      {error && (
        <div className="error-notice">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="trainer-tabs">
        <button 
          className={`tab-button ${activeTab === 'trainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('trainers')}
        >
          🤖 Choose Trainer
        </button>
        <button 
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
          disabled={!selectedTrainer}
        >
          📊 Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          disabled={!selectedTrainer}
        >
          💬 Chat
        </button>
      </div>

      {/* Trainers Selection Tab */}
      {activeTab === 'trainers' && (
        <div className="trainers-grid">
          <h3>Select Your AI Fitness Coach</h3>
          <div className="trainers-list">
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                className={`trainer-card ${selectedTrainer?.id === trainer.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTrainer(trainer);
                  setActiveTab('analysis');
                  setChatMessages([]); // Reset chat when switching trainers
                }}
              >
                <div className="trainer-header">
                  <div className="trainer-avatar">{trainer.avatar}</div>
                  <div className="trainer-info">
                    <h4 className="trainer-name">{trainer.name}</h4>
                    <div className="trainer-specialty">{trainer.specialty.toUpperCase()}</div>
                  </div>
                  <div className="trainer-experience">
                    Level {Math.floor(trainer.experience / 10)}
                  </div>
                </div>
                
                <p className="trainer-description">{trainer.description}</p>
                
                <div className="trainer-stats">
                  <div className="stat-item">
                    <span>Strength</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{ 
                          width: `${trainer.stats.strength}%`,
                          backgroundColor: '#ef4444'
                        }}
                      />
                    </div>
                  </div>
                  <div className="stat-item">
                    <span>Endurance</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{ 
                          width: `${trainer.stats.endurance}%`,
                          backgroundColor: '#10b981'
                        }}
                      />
                    </div>
                  </div>
                  <div className="stat-item">
                    <span>Intelligence</span>
                    <div className="stat-bar">
                      <div 
                        className="stat-fill" 
                        style={{ 
                          width: `${trainer.stats.intelligence}%`,
                          backgroundColor: '#3b82f6'
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="trainer-personality" style={{ color: getPersonalityColor(trainer.personality) }}>
                  {trainer.personality.toUpperCase()} STYLE
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && selectedTrainer && (
        <div className="analysis-section">
          <div className="analysis-header">
            <h3>
              {selectedTrainer.avatar} Workout Analysis by {selectedTrainer.name}
            </h3>
            <button 
              onClick={getWorkoutAnalysis}
              disabled={loading}
              className="analyze-button"
            >
              {loading ? 'Analyzing...' : 'Get Fresh Analysis'}
            </button>
          </div>

          {analysis ? (
            <div className="analysis-results">
              {/* Trainer's Personal Message */}
              {analysis.trainerMessage && (
                <div className="trainer-message">
                  <div className="message-header">
                    <span className="trainer-avatar">{analysis.trainerAvatar}</span>
                    <span className="trainer-name">{analysis.trainerName}</span>
                  </div>
                  <div className="message-content">
                    "{analysis.trainerMessage}"
                  </div>
                </div>
              )}

              {/* Fitness Overview */}
              <div className="fitness-overview">
                <div className="overview-card">
                  <h4>Fitness Level</h4>
                  <div className="level-badge">{analysis.fitnessLevel.toUpperCase()}</div>
                </div>
                <div className="overview-card">
                  <h4>Weekly Frequency</h4>
                  <div className="frequency">{analysis.weeklyFrequency} workouts/week</div>
                </div>
                <div className="overview-card">
                  <h4>Consistency Score</h4>
                  <div className="consistency">
                    <div className="consistency-bar">
                      <div 
                        className="consistency-fill" 
                        style={{ width: `${analysis.consistencyScore}%` }}
                      />
                    </div>
                    <span>{analysis.consistencyScore}%</span>
                  </div>
                </div>
                <div className="overview-card">
                  <h4>Preferred Type</h4>
                  <div className="preferred-type">{analysis.preferredType}</div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="suggestions-section">
                <h4>Personalized Recommendations</h4>
                <div className="suggestions-list">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item">
                      <span className="suggestion-icon">💡</span>
                      <span className="suggestion-text">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Goals and Next Steps */}
              <div className="goals-section">
                <div className="goal-card">
                  <h4>Weekly Goal</h4>
                  <p>{analysis.weeklyGoal}</p>
                </div>
                <div className="goal-card">
                  <h4>Next Workout Suggestion</h4>
                  <p>{analysis.nextWorkout}</p>
                  <button 
                    onClick={getWorkoutRecommendation}
                    disabled={loading}
                    className="recommendation-button"
                  >
                    Get Detailed Plan
                  </button>
                </div>
              </div>

              {/* Motivational Message */}
              {analysis.motivationalMessage && (
                <div className="motivational-section">
                  <h4>Motivation</h4>
                  <div className="motivational-message">
                    {analysis.motivationalMessage}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-analysis">
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h4>Ready for Analysis</h4>
                <p>Click "Get Fresh Analysis" to have {selectedTrainer.name} analyze your workout patterns and provide personalized recommendations.</p>
                <button onClick={getWorkoutAnalysis} className="get-analysis-btn">
                  Start Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && selectedTrainer && (
        <div className="chat-section">
          <div className="chat-header">
            <div className="chat-trainer-info">
              <span className="trainer-avatar">{selectedTrainer.avatar}</span>
              <div>
                <h4>{selectedTrainer.name}</h4>
                <p>Your {selectedTrainer.specialty} coach</p>
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {chatMessages.length === 0 && (
              <div className="welcome-message">
                <div className="welcome-avatar">{selectedTrainer.avatar}</div>
                <div className="welcome-text">
                  <strong>{selectedTrainer.name}:</strong> Hey there! I'm here to help with your fitness journey. Ask me anything about workouts, nutrition, or motivation!
                </div>
              </div>
            )}
            
            {chatMessages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                {message.type === 'trainer' && (
                  <div className="message-avatar">{message.trainerAvatar}</div>
                )}
                <div className="message-content">
                  {message.type === 'trainer' && (
                    <div className="message-name">{message.trainerName}</div>
                  )}
                  <div className="message-text">{message.message}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message trainer">
                <div className="message-avatar">{selectedTrainer.avatar}</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-controls">
            <div className="quick-messages">
              <button onClick={() => setChatInput("How can I improve my workouts?")}>
                💪 Improve Workouts
              </button>
              <button onClick={() => setChatInput("What should I focus on next?")}>
                🎯 What's Next?
              </button>
              <button onClick={() => setChatInput("I need motivation!")}>
                🔥 Motivate Me
              </button>
              <button onClick={() => setChatInput("Can you analyze my progress?")}>
                📊 Check Progress
              </button>
            </div>
            
            <div className="chat-input">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Ask ${selectedTrainer.name} anything...`}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
              />
              <button 
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || loading}
                className="send-button"
              >
                {loading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// CSS Styles for the AI Trainer System
const aiTrainerStyles = `
.ai-trainer-system {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  border-radius: 16px;
  color: white;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.error-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  color: #fca5a5;
  font-size: 14px;
}

.trainer-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
}

.tab-button {
  flex: 1;
  padding: 12px 20px;
  background: none;
  border: none;
  color: #9ca3af;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.tab-button.active {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  transform: translateY(-1px);
}

.tab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.trainers-grid h3 {
  text-align: center;
  margin-bottom: 24px;
  font-size: 24px;
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.trainers-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.trainer-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeIn 0.5s ease;
}

.trainer-card:hover {
  border-color: #06b6d4;
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(6, 182, 212, 0.2);
}

.trainer-card.selected {
  border-color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
}

.trainer-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.trainer-avatar {
  font-size: 2.5em;
  line-height: 1;
}

.trainer-info h4 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.trainer-specialty {
  font-size: 12px;
  color: #06b6d4;
  font-weight: 600;
  letter-spacing: 1px;
}

.trainer-experience {
  margin-left: auto;
  background: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.trainer-description {
  margin: 16px 0;
  color: #d1d5db;
  font-size: 14px;
  line-height: 1.5;
}

.trainer-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.stat-bar {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.trainer-personality {
  text-align: center;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 1px;
  margin-top: 12px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.analysis-section {
  animation: fadeIn 0.5s ease;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.analysis-header h3 {
  font-size: 24px;
  margin: 0;
}

.analyze-button {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.analyze-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3);
}

.analyze-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.trainer-message {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.message-header .trainer-avatar {
  font-size: 2em;
}

.trainer-name {
  font-weight: 600;
  font-size: 18px;
  color: #ffeaa7;
}

.message-content {
  font-size: 16px;
  line-height: 1.6;
  font-style: italic;
}

.fitness-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.overview-card h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.level-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.frequency {
  font-size: 24px;
  font-weight: bold;
  color: #06b6d4;
}

.consistency {
  display: flex;
  align-items: center;
  gap: 12px;
}

.consistency-bar {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.consistency-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.consistency span {
  font-weight: 600;
  color: #10b981;
}

.preferred-type {
  font-size: 16px;
  font-weight: 600;
  color: #8b5cf6;
  text-transform: capitalize;
}

.suggestions-section {
  margin-bottom: 24px;
}

.suggestions-section h4 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #06b6d4;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.suggestion-item:hover {
  transform: translateX(4px);
}

.suggestion-icon {
  font-size: 18px;
}

.suggestion-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.goals-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.goal-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
}

.goal-card h4 {
  margin: 0 0 12px 0;
  color: #06b6d4;
  font-size: 16px;
}

.goal-card p {
  margin: 0 0 16px 0;
  color: #d1d5db;
  line-height: 1.5;
}

.recommendation-button {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.recommendation-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
}

.recommendation-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.motivational-section {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
}

.motivational-section h4 {
  margin: 0 0 12px 0;
  color: #ffeaa7;
  font-size: 18px;
}

.motivational-message {
  font-size: 16px;
  line-height: 1.6;
  font-style: italic;
  color: white;
}

.no-analysis {
  text-align: center;
  padding: 40px;
}

.empty-state {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 40px;
  max-width: 400px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #06b6d4;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #9ca3af;
  line-height: 1.5;
}

.get-analysis-btn {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.get-analysis-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3);
}

.chat-section {
  height: 600px;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
}

.chat-header {
  background: rgba(255, 255, 255, 0.1);
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-trainer-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-trainer-info .trainer-avatar {
  font-size: 2em;
}

.chat-trainer-info h4 {
  margin: 0;
  font-size: 18px;
}

.chat-trainer-info p {
  margin: 0;
  font-size: 14px;
  color: #9ca3af;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 400px;
}

.welcome-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 16px;
  padding: 16px;
}

.welcome-avatar {
  font-size: 2em;
  line-height: 1;
}

.welcome-text {
  flex: 1;
  line-height: 1.5;
  font-size: 14px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  animation: fadeIn 0.3s ease;
}

.message.user {
  flex-direction: row-reverse;
}

.message.user .message-content {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  margin-left: auto;
}

.message.trainer .message-content {
  background: rgba(255, 255, 255, 0.1);
}

.message-avatar {
  font-size: 1.5em;
  line-height: 1;
  margin-top: 4px;
}

.message-content {
  max-width: 70%;
  border-radius: 16px;
  padding: 12px 16px;
  position: relative;
}

.message-name {
  font-size: 12px;
  font-weight: 600;
  color: #06b6d4;
  margin-bottom: 4px;
}

.message-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
}

.message.user .message-time {
  text-align: left;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #06b6d4;
  animation: pulse 1.4s ease-in-out infinite both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

.chat-controls {
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-messages {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.quick-messages button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.quick-messages button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.chat-input {
  display: flex;
  gap: 12px;
}

.chat-input input {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 12px 20px;
  color: white;
  font-size: 14px;
}

.chat-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.chat-input input:focus {
  outline: none;
  border-color: #06b6d4;
  background: rgba(255, 255, 255, 0.15);
}

.send-button {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  border: none;
  border-radius: 24px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.send-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@media (max-width: 768px) {
  .ai-trainer-system {
    padding: 16px;
  }
  
  .trainer-tabs {
    flex-direction: column;
  }
  
  .trainers-list {
    grid-template-columns: 1fr;
  }
  
  .fitness-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .goals-section {
    grid-template-columns: 1fr;
  }
  
  .quick-messages {
    flex-direction: column;
  }
  
  .chat-input {
    flex-direction: column;
    gap: 8px;
  }
  
  .analysis-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chat-section {
    height: 500px;
  }
  
  .chat-messages {
    max-height: 300px;
  }
}
`;

export { AITrainerSystem, aiTrainerStyles };
