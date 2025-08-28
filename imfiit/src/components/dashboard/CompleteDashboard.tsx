import React, { useState } from 'react';
import { 
  User, Dumbbell, Swords, Wallet, Settings, 
  Trophy, TrendingUp, Zap, Users, Target 
} from 'lucide-react';

// Import your completed components
// import ProfileManagement from '../profile/ProfileManagement';
// import LeaderboardSystem from '../social/LeaderboardSystem';
// import WalletSystem from '../web3/WalletSystem';
// import SimplePVPSystem from '../pvp/SimplePVPSystem';
// import AITrainerSystem from '../ai/AITrainerSystem';

interface CompleteDashboardProps {
  userProfile: any;
  onUpdateProfile: (updates: any) => void;
  onWorkoutUpload: () => void;
}

const CompleteDashboard: React.FC<CompleteDashboardProps> = ({
  userProfile,
  onUpdateProfile,
  onWorkoutUpload
}) => {
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Navigation functions
  const handleNavigation = (view: string) => {
    setCurrentView(view);
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  // Mock functions - replace with real implementations
  const handleStartBattle = (battleId: string, opponent?: any) => {
    console.log('Starting battle:', battleId);
    // Navigate to battle screen or show battle component
  };

  const handleChallenge = (userId: string) => {
    console.log('Challenging user:', userId);
    // Send challenge invite
  };

  const handleMessage = (userId: string) => {
    console.log('Messaging user:', userId);
    // Open message dialog
  };

  const handleJoinTournament = (tournamentId: string) => {
    console.log('Joining tournament:', tournamentId);
    // Join tournament logic
  };

  // Calculate user stats for display
  const userStats = {
    level: userProfile?.stats.level || 1,
    experience: userProfile?.stats.experience || 0,
    strength: userProfile?.stats.strength || 50,
    endurance: userProfile?.stats.endurance || 50,
    battleWins: userProfile?.stats.battleWins || 0,
    battleLosses: userProfile?.stats.battleLosses || 0,
    totalWorkouts: userProfile?.stats.totalWorkouts || 0,
    streakDays: userProfile?.stats.streakDays || 0
  };

  const getWinRate = () => {
    const total = userStats.battleWins + userStats.battleLosses;
    return total > 0 ? Math.round((userStats.battleWins / total) * 100) : 0;
  };

  const getNextLevelXP = () => {
    return Math.pow(userStats.level, 2) * 100;
  };

  const getLevelProgress = () => {
    const currentLevelXP = Math.pow(userStats.level - 1, 2) * 100;
    const nextLevelXP = getNextLevelXP();
    const progress = ((userStats.experience - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  // Render different views
  if (currentView === 'profile') {
    return (
      <div>
        {/* Replace with actual ProfileManagement component */}
        <div style={{ padding: 20, color: 'white', background: '#1f2937', minHeight: '100vh' }}>
          <button onClick={handleBack} style={{ marginBottom: 20, background: 'none', border: 'none', color: '#06b6d4' }}>
            ← Back to Dashboard
          </button>
          <h1>Profile Management</h1>
          <p>Profile component will be rendered here</p>
        </div>
      </div>
    );
  }

  if (currentView === 'leaderboard') {
    return (
      <div>
        {/* Replace with actual LeaderboardSystem component */}
        <div style={{ padding: 20, color: 'white', background: '#1f2937', minHeight: '100vh' }}>
          <button onClick={handleBack} style={{ marginBottom: 20, background: 'none', border: 'none', color: '#06b6d4' }}>
            ← Back to Dashboard
          </button>
          <h1>Leaderboard</h1>
          <p>Simple leaderboard component will be rendered here</p>
        </div>
      </div>
    );
  }

  if (currentView === 'pvp') {
    return (
      <div>
        {/* Replace with actual SimplePVPSystem component */}
        <div style={{ padding: 20, color: 'white', background: '#1f2937', minHeight: '100vh' }}>
          <button onClick={handleBack} style={{ marginBottom: 20, background: 'none', border: 'none', color: '#06b6d4' }}>
            ← Back to Dashboard
          </button>
          <h1>PVP Battles</h1>
          <p>Simple PVP system component will be rendered here</p>
        </div>
      </div>
    );
  }

  if (currentView === 'wallet') {
    return (
      <div>
        {/* Replace with actual WalletSystem component */}
        <div style={{ padding: 20, color: 'white', background: '#1f2937', minHeight: '100vh' }}>
          <button onClick={handleBack} style={{ marginBottom: 20, background: 'none', border: 'none', color: '#06b6d4' }}>
            ← Back to Dashboard
          </button>
          <h1>Web3 Wallet</h1>
          <p>Wallet system component will be rendered here</p>
        </div>
      </div>
    );
  }

  if (currentView === 'trainers') {
    return (
      <div>
        {/* Replace with actual AITrainerSystem component */}
        <div style={{ padding: 20, color: 'white', background: '#1f2937', minHeight: '100vh' }}>
          <button onClick={handleBack} style={{ marginBottom: 20, background: 'none', border: 'none', color: '#06b6d4' }}>
            ← Back to Dashboard
          </button>
          <h1>AI Trainers</h1>
          <p>AI Trainer system component will be rendered here</p>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="complete-dashboard">
      <style>{`
        .complete-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 24px;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .dashboard-title {
          font-size: 2.5em;
          font-weight: bold;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .dashboard-subtitle {
          color: #9ca3af;
          font-size: 16px;
        }

        .user-overview {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        .user-avatar {
          font-size: 4em;
          line-height: 1;
        }

        .user-info h2 {
          font-size: 24px;
          margin: 0 0 8px 0;
        }

        .level-badge {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1f2937;
          padding: 4px 12px;
          border-radius: 16px;
          font-weight: 600;
          font-size: 14px;
          display: inline-block;
          margin-bottom: 12px;
        }

        .xp-progress {
          margin-bottom: 8px;
        }

        .xp-text {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
          color: #9ca3af;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #06b6d4, #8b5cf6);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-value {
          font-size: 2em;
          font-weight: bold;
          color: #06b6d4;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: #06b6d4;
          box-shadow: 0 12px 40px rgba(6, 182, 212, 0.2);
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .feature-info h3 {
          font-size: 18px;
          margin: 0 0 4px 0;
        }

        .feature-status {
          font-size: 14px;
          color: #9ca3af;
        }

        .feature-description {
          color: #d1d5db;
          line-height: 1.5;
          margin-bottom: 16px;
        }

        .feature-action {
          background: linear-gradient(135deg, #06b6d4, #0891b2);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .feature-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(6, 182, 212, 0.3);
        }

        .feature-action.secondary {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .feature-action.secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 32px;
        }

        .quick-action {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .quick-action:hover {
          transform: translateY(-2px);
          border-color: #06b6d4;
        }

        .quick-action-icon {
          font-size: 2em;
          margin-bottom: 12px;
        }

        .quick-action h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .quick-action p {
          margin: 0;
          font-size: 14px;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .complete-dashboard {
            padding: 16px;
          }

          .user-header {
            flex-direction: column;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="dashboard-header">
        <h1 className="dashboard-title">IM FIIT Dashboard</h1>
        <p className="dashboard-subtitle">Your complete fitness gaming platform</p>
      </div>

      <div className="user-overview">
        <div className="user-header">
          <div className="user-avatar">
            {userProfile?.bodyType?.includes('female') ? '🏋️‍♀️' : '🏋️‍♂️'}
          </div>
          <div className="user-info">
            <h2>Welcome back, {userProfile?.name || 'Fitness Fighter'}!</h2>
            <div className="level-badge">Level {userStats.level}</div>
            <div className="xp-progress">
              <div className="xp-text">
                <span>{userStats.experience} XP</span>
                <span>{getNextLevelXP()} XP to next level</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getLevelProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{userStats.strength}</div>
            <div className="stat-label">Strength</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{userStats.endurance}</div>
            <div className="stat-label">Endurance</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{userStats.totalWorkouts}</div>
            <div className="stat-label">Workouts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{getWinRate()}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card" onClick={() => handleNavigation('profile')}>
          <div className="feature-header">
            <div className="feature-icon">
              <User size={24} />
            </div>
            <div className="feature-info">
              <h3>Profile & Stats</h3>
              <div className="feature-status">Manage your fighter</div>
            </div>
          </div>
          <p className="feature-description">
            View detailed stats, achievements, and customize your fighter profile. Track your fitness journey progress.
          </p>
          <button className="feature-action">View Profile</button>
        </div>

        <div className="feature-card" onClick={onWorkoutUpload}>
          <div className="feature-header">
            <div className="feature-icon">
              <Dumbbell size={24} />
            </div>
            <div className="feature-info">
              <h3>Upload Workout</h3>
              <div className="feature-status">Gain XP & stats</div>
            </div>
          </div>
          <p className="feature-description">
            Upload screenshots from fitness apps to gain experience, increase your stats, and level up your fighter.
          </p>
          <button className="feature-action">Upload Workout</button>
        </div>

        <div className="feature-card" onClick={() => handleNavigation('pvp')}>
          <div className="feature-header">
            <div className="feature-icon">
              <Swords size={24} />
            </div>
            <div className="feature-info">
              <h3>PVP Battles</h3>
              <div className="feature-status">Fight other players</div>
            </div>
          </div>
          <p className="feature-description">
            Challenge other players to battles using your real fitness stats. Win battles to earn tokens and glory.
          </p>
          <button className="feature-action">Start Battle</button>
        </div>

        <div className="feature-card" onClick={() => handleNavigation('trainers')}>
          <div className="feature-header">
            <div className="feature-icon">
              <Target size={24} />
            </div>
            <div className="feature-info">
              <h3>AI Trainers</h3>
              <div className="feature-status">Get personalized advice</div>
            </div>
          </div>
          <p className="feature-description">
            Chat with AI fitness coaches who analyze your workouts and provide personalized training recommendations.
          </p>
          <button className="feature-action">Meet Trainers</button>
        </div>

        <div className="feature-card" onClick={() => handleNavigation('leaderboard')}>
          <div className="feature-header">
            <div className="feature-icon">
              <Trophy size={24} />
            </div>
            <div className="feature-info">
              <h3>Leaderboards</h3>
              <div className="feature-status">Compete globally</div>
            </div>
          </div>
          <p className="feature-description">
            See how you rank against other fitness fighters worldwide. Climb the leaderboards and earn recognition.
          </p>
          <button className="feature-action">View Rankings</button>
        </div>

        <div className="feature-card" onClick={() => handleNavigation('wallet')}>
          <div className="feature-header">
            <div className="feature-icon">
              <Wallet size={24} />
            </div>
            <div className="feature-info">
              <h3>Web3 Wallet</h3>
              <div className="feature-status">Earn crypto rewards</div>
            </div>
          </div>
          <p className="feature-description">
            Connect your wallet to earn FIIT tokens for workouts and battles. Collect NFTs and participate in the Web3 economy.
          </p>
          <button className="feature-action secondary">Connect Wallet</button>
        </div>
      </div>

      <div className="quick-actions">
        <div className="quick-action" onClick={() => handleNavigation('pvp')}>
          <div className="quick-action-icon">⚡</div>
          <h4>Quick Battle</h4>
          <p>Find opponent now</p>
        </div>
        
        <div className="quick-action" onClick={onWorkoutUpload}>
          <div className="quick-action-icon">📸</div>
          <h4>Upload Workout</h4>
          <p>Gain XP instantly</p>
        </div>

        <div className="quick-action" onClick={() => handleNavigation('trainers')}>
          <div className="quick-action-icon">🤖</div>
          <h4>Ask Trainer</h4>
          <p>Get fitness advice</p>
        </div>

        <div className="quick-action" onClick={() => handleNavigation('leaderboard')}>
          <div className="quick-action-icon">🏆</div>
          <h4>View Rankings</h4>
          <p>See your position</p>
        </div>
      </div>
    </div>
  );
};

export default CompleteDashboard;