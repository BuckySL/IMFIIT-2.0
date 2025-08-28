// ============================================================================
// COMPLETE PROFILE MANAGEMENT SYSTEM
// File: src/components/profile/ProfileManagement.tsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Trophy, User, Target, Calendar, Star, Settings, Share2 } from 'lucide-react';

// Types
interface UserStats {
  strength: number;
  endurance: number;
  experience: number;
  level: number;
  totalWorkouts: number;
  streakDays: number;
  totalCalories: number;
  totalDistance: number;
  battleWins: number;
  battleLosses: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  reward: string;
}

interface ProfileManagementProps {
  userProfile: any;
  onUpdateProfile: (updates: any) => void;
  onBack: () => void;
}

const ProfileManagement: React.FC<ProfileManagementProps> = ({
  userProfile,
  onUpdateProfile,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'achievements' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: userProfile?.name || '',
    bio: userProfile?.bio || '',
    favoriteWorkout: userProfile?.favoriteWorkout || 'strength',
    fitnessGoal: userProfile?.fitnessGoal || 'general'
  });

  // Mock achievements data - replace with real data
  const achievements: Achievement[] = [
    {
      id: 'first_workout',
      name: 'First Steps',
      description: 'Complete your first workout',
      icon: '🎯',
      progress: userProfile?.stats.totalWorkouts > 0 ? 1 : 0,
      maxProgress: 1,
      unlocked: userProfile?.stats.totalWorkouts > 0,
      reward: '+10 XP'
    },
    {
      id: 'workout_streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day workout streak',
      icon: '🔥',
      progress: Math.min(userProfile?.stats.streakDays || 0, 7),
      maxProgress: 7,
      unlocked: (userProfile?.stats.streakDays || 0) >= 7,
      reward: '+50 XP'
    },
    {
      id: 'battle_winner',
      name: 'Champion',
      description: 'Win your first battle',
      icon: '👑',
      progress: userProfile?.stats.battleWins > 0 ? 1 : 0,
      maxProgress: 1,
      unlocked: userProfile?.stats.battleWins > 0,
      reward: '+25 XP'
    },
    {
      id: 'level_10',
      name: 'Rising Star',
      description: 'Reach level 10',
      icon: '⭐',
      progress: Math.min(userProfile?.stats.level || 1, 10),
      maxProgress: 10,
      unlocked: (userProfile?.stats.level || 1) >= 10,
      reward: '+100 XP'
    },
    {
      id: 'calories_1000',
      name: 'Calorie Crusher',
      description: 'Burn 1000 total calories',
      icon: '🔥',
      progress: Math.min(userProfile?.stats.totalCalories || 0, 1000),
      maxProgress: 1000,
      unlocked: (userProfile?.stats.totalCalories || 0) >= 1000,
      reward: '+75 XP'
    }
  ];

  const handleSaveProfile = () => {
    onUpdateProfile({
      ...userProfile,
      name: editForm.displayName,
      bio: editForm.bio,
      favoriteWorkout: editForm.favoriteWorkout,
      fitnessGoal: editForm.fitnessGoal,
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const handleShareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out my IM FIIT profile!`,
          text: `Level ${userProfile?.stats.level || 1} Fighter with ${userProfile?.stats.totalWorkouts || 0} workouts completed!`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`Check out my IM FIIT profile! Level ${userProfile?.stats.level || 1} Fighter 🏋️ Join me: ${window.location.href}`);
      alert('Profile link copied to clipboard!');
    }
  };

  const calculateLevelProgress = () => {
    const currentLevel = userProfile?.stats.level || 1;
    const currentExp = userProfile?.stats.experience || 0;
    const expForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
    const expForNextLevel = Math.pow(currentLevel, 2) * 100;
    const progressExp = currentExp - expForCurrentLevel;
    const neededExp = expForNextLevel - expForCurrentLevel;
    return Math.min((progressExp / neededExp) * 100, 100);
  };

  const getBattleWinRate = () => {
    const wins = userProfile?.stats.battleWins || 0;
    const losses = userProfile?.stats.battleLosses || 0;
    const total = wins + losses;
    return total > 0 ? Math.round((wins / total) * 100) : 0;
  };

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  return (
    <div className="profile-management">
      <style>{`
        .profile-management {
          min-height: 100vh;
          background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .profile-header {
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-button {
          background: none;
          border: none;
          color: #06b6d4;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          transition: color 0.3s ease;
        }

        .back-button:hover {
          color: #0891b2;
        }

        .profile-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .profile-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .profile-avatar {
          font-size: 4em;
          line-height: 1;
        }

        .profile-details h1 {
          font-size: 2em;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .profile-meta {
          color: #9ca3af;
          margin-bottom: 12px;
        }

        .level-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1f2937;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }

        .profile-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .action-btn.primary {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          border-color: #06b6d4;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 24px;
        }

        .tab-button {
          background: none;
          border: none;
          color: #9ca3af;
          padding: 16px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          border-bottom: 2px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
        }

        .tab-button:hover {
          color: white;
        }

        .tab-button.active {
          color: #06b6d4;
          border-bottom-color: #06b6d4;
        }

        .tab-content {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: #06b6d4;
          transform: translateY(-4px);
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .stat-title {
          font-size: 16px;
          color: #9ca3af;
          margin: 0;
        }

        .stat-icon {
          font-size: 24px;
        }

        .stat-value {
          font-size: 2.5em;
          font-weight: bold;
          margin: 0;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-subtitle {
          color: #9ca3af;
          font-size: 14px;
          margin: 8px 0 0 0;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #8b5cf6);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .achievement {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .achievement.unlocked {
          border-color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
        }

        .achievement.locked {
          opacity: 0.6;
        }

        .achievement-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .achievement-icon {
          font-size: 2em;
          filter: grayscale(1);
          transition: filter 0.3s ease;
        }

        .achievement.unlocked .achievement-icon {
          filter: none;
        }

        .achievement-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .achievement-description {
          color: #9ca3af;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .achievement-progress {
          margin-bottom: 12px;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .achievement-reward {
          background: rgba(6, 182, 212, 0.2);
          color: #06b6d4;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .edit-form {
          max-width: 500px;
          margin: 0 auto;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          color: #d1d5db;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s ease;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #06b6d4;
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 32px;
        }

        .btn-save {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.3s ease;
        }

        .btn-save:hover {
          transform: translateY(-2px);
        }

        .btn-cancel {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 12px 32px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 768px) {
          .profile-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .profile-info {
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 100%;
          }

          .profile-actions {
            justify-content: center;
            width: 100%;
          }

          .tabs {
            padding: 0 16px;
          }

          .tab-content {
            padding: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .achievements-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="profile-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="profile-hero">
          <div className="profile-info">
            <div className="profile-avatar">
              {userProfile?.bodyType === 'fit-male' ? '🏋️‍♂️' : 
               userProfile?.bodyType === 'fit-female' ? '🏋️‍♀️' :
               userProfile?.bodyType?.includes('female') ? '🚴‍♀️' : '🚴‍♂️'}
            </div>
            <div className="profile-details">
              <h1>{userProfile?.name || 'Fitness Fighter'}</h1>
              <div className="profile-meta">
                <div className="level-badge">
                  <Star size={16} />
                  Level {userProfile?.stats.level || 1}
                </div>
              </div>
              {userProfile?.bio && (
                <p style={{ color: '#d1d5db', margin: '8px 0 0 0' }}>
                  {userProfile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="profile-actions">
            <button className="action-btn primary" onClick={() => setIsEditing(!isEditing)}>
              <Settings size={16} />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
            <button className="action-btn" onClick={handleShareProfile}>
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={20} />
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <Target size={20} />
          Stats
        </button>
        <button 
          className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          <Trophy size={20} />
          Achievements
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            {isEditing ? (
              <div className="edit-form">
                <h2 style={{ textAlign: 'center', marginBottom: 32 }}>Edit Profile</h2>
                
                <div className="form-group">
                  <label className="form-label">Display Name</label>
                  <input 
                    className="form-input"
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                    placeholder="Your display name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea 
                    className="form-textarea"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="Tell others about your fitness journey..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Favorite Workout Type</label>
                  <select 
                    className="form-select"
                    value={editForm.favoriteWorkout}
                    onChange={(e) => setEditForm({...editForm, favoriteWorkout: e.target.value})}
                  >
                    <option value="strength">Strength Training</option>
                    <option value="cardio">Cardio</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="mixed">Mixed Training</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fitness Goal</label>
                  <select 
                    className="form-select"
                    value={editForm.fitnessGoal}
                    onChange={(e) => setEditForm({...editForm, fitnessGoal: e.target.value})}
                  >
                    <option value="weight_loss">Weight Loss</option>
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="endurance">Endurance</option>
                    <option value="strength">Strength</option>
                    <option value="general">General Fitness</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button className="btn-save" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                  <button className="btn-cancel" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Experience Progress</h3>
                    <div className="stat-icon">📈</div>
                  </div>
                  <div className="stat-value">{userProfile?.stats.experience || 0}</div>
                  <p className="stat-subtitle">Total XP earned</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateLevelProgress()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Workout Streak</h3>
                    <div className="stat-icon">🔥</div>
                  </div>
                  <div className="stat-value">{userProfile?.stats.streakDays || 0}</div>
                  <p className="stat-subtitle">Days in a row</p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Battle Record</h3>
                    <div className="stat-icon">⚔️</div>
                  </div>
                  <div className="stat-value">{getBattleWinRate()}%</div>
                  <p className="stat-subtitle">
                    {userProfile?.stats.battleWins || 0}W - {userProfile?.stats.battleLosses || 0}L
                  </p>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <h3 className="stat-title">Total Workouts</h3>
                    <div className="stat-icon">💪</div>
                  </div>
                  <div className="stat-value">{userProfile?.stats.totalWorkouts || 0}</div>
                  <p className="stat-subtitle">Workouts completed</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Strength</h3>
                <div className="stat-icon">💪</div>
              </div>
              <div className="stat-value">{userProfile?.stats.strength || 50}</div>
              <p className="stat-subtitle">Power level</p>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Endurance</h3>
                <div className="stat-icon">🏃</div>
              </div>
              <div className="stat-value">{userProfile?.stats.endurance || 50}</div>
              <p className="stat-subtitle">Stamina level</p>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Calories Burned</h3>
                <div className="stat-icon">🔥</div>
              </div>
              <div className="stat-value">{userProfile?.stats.totalCalories || 0}</div>
              <p className="stat-subtitle">Total calories</p>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Distance</h3>
                <div className="stat-icon">📏</div>
              </div>
              <div className="stat-value">{(userProfile?.stats.totalDistance || 0).toFixed(1)}</div>
              <p className="stat-subtitle">km traveled</p>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Battle Wins</h3>
                <div className="stat-icon">🏆</div>
              </div>
              <div className="stat-value">{userProfile?.stats.battleWins || 0}</div>
              <p className="stat-subtitle">Victories earned</p>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">Current Level</h3>
                <div className="stat-icon">⭐</div>
              </div>
              <div className="stat-value">{userProfile?.stats.level || 1}</div>
              <p className="stat-subtitle">Fighter rank</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${calculateLevelProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div>
            {unlockedAchievements.length > 0 && (
              <>
                <h2 style={{ marginBottom: 24, color: '#fbbf24' }}>🏆 Unlocked Achievements</h2>
                <div className="achievements-grid">
                  {unlockedAchievements.map(achievement => (
                    <div key={achievement.id} className="achievement unlocked">
                      <div className="achievement-header">
                        <div className="achievement-icon">{achievement.icon}</div>
                        <div>
                          <h3 className="achievement-title">{achievement.name}</h3>
                          <span className="achievement-reward">{achievement.reward}</span>
                        </div>
                      </div>
                      <p className="achievement-description">{achievement.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {lockedAchievements.length > 0 && (
              <>
                <h2 style={{ marginBottom: 24, marginTop: 40, color: '#9ca3af' }}>🔒 Locked Achievements</h2>
                <div className="achievements-grid">
                  {lockedAchievements.map(achievement => (
                    <div key={achievement.id} className="achievement locked">
                      <div className="achievement-header">
                        <div className="achievement-icon">{achievement.icon}</div>
                        <div>
                          <h3 className="achievement-title">{achievement.name}</h3>
                          <span className="achievement-reward">{achievement.reward}</span>
                        </div>
                      </div>
                      <p className="achievement-description">{achievement.description}</p>
                      <div className="achievement-progress">
                        <div className="progress-text">
                          <span>Progress</span>
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {achievements.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: '4em', marginBottom: 16 }}>🏆</div>
                <h3>No Achievements Yet</h3>
                <p style={{ color: '#9ca3af' }}>Complete workouts and battles to unlock achievements!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileManagement;