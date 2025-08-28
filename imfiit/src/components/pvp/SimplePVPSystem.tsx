
import React, { useState, useEffect } from 'react';
import { Swords, Users, Zap, Trophy, Clock, Target, RefreshCw, UserPlus, Play } from 'lucide-react';

// Simple Types
interface Player {
  id: string;
  name: string;
  avatar: string;
  level: number;
  stats: {
    strength: number;
    endurance: number;
    battleWins: number;
    battleLosses: number;
  };
  isOnline: boolean;
  lastSeen: Date;
}

interface BattleInvite {
  id: string;
  from: Player;
  to: Player;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

interface ActiveBattle {
  id: string;
  player1: Player;
  player2: Player;
  status: 'waiting' | 'active' | 'finished';
  winner?: Player;
  createdAt: Date;
}

interface SimplePVPSystemProps {
  userProfile: any;
  onStartBattle: (battleId: string, opponent: Player) => void;
  onBack: () => void;
}

const SimplePVPSystem: React.FC<SimplePVPSystemProps> = ({
  userProfile,
  onStartBattle,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'quick-match' | 'challenge' | 'invites' | 'history'>('quick-match');
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>([]);
  const [battleInvites, setBattleInvites] = useState<BattleInvite[]>([]);
  const [recentBattles, setRecentBattles] = useState<ActiveBattle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingMatch, setSearchingMatch] = useState(false);
  const [matchTimer, setMatchTimer] = useState(0);

  // Mock data - replace with real Socket.IO calls
  useEffect(() => {
    const loadPVPData = async () => {
      setLoading(true);
      
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock online players
      const mockPlayers: Player[] = [
        {
          id: 'player_1',
          name: 'FitWarrior92',
          avatar: '🏋️‍♂️',
          level: 12,
          stats: { strength: 78, endurance: 65, battleWins: 15, battleLosses: 8 },
          isOnline: true,
          lastSeen: new Date()
        },
        {
          id: 'player_2', 
          name: 'CardioQueen',
          avatar: '🏃‍♀️',
          level: 9,
          stats: { strength: 55, endurance: 85, battleWins: 12, battleLosses: 6 },
          isOnline: true,
          lastSeen: new Date()
        },
        {
          id: 'player_3',
          name: 'IronMike',
          avatar: '💪',
          level: 15,
          stats: { strength: 92, endurance: 70, battleWins: 25, battleLosses: 5 },
          isOnline: true,
          lastSeen: new Date()
        },
        {
          id: 'player_4',
          name: 'FlexMaster',
          avatar: '🤸‍♂️',
          level: 8,
          stats: { strength: 60, endurance: 75, battleWins: 8, battleLosses: 12 },
          isOnline: false,
          lastSeen: new Date(Date.now() - 300000) // 5 min ago
        }
      ];

      // Mock battle invites
      const mockInvites: BattleInvite[] = [
        {
          id: 'invite_1',
          from: mockPlayers[0],
          to: { ...userProfile, id: userProfile?.id || 'user' } as Player,
          status: 'pending',
          createdAt: new Date(Date.now() - 60000), // 1 min ago
          expiresAt: new Date(Date.now() + 240000) // 4 min from now
        }
      ];

      // Mock recent battles
      const mockBattles: ActiveBattle[] = [
        {
          id: 'battle_1',
          player1: { ...userProfile, id: userProfile?.id || 'user' } as Player,
          player2: mockPlayers[1],
          status: 'finished',
          winner: { ...userProfile, id: userProfile?.id || 'user' } as Player,
          createdAt: new Date(Date.now() - 1800000) // 30 min ago
        },
        {
          id: 'battle_2', 
          player1: mockPlayers[2],
          player2: { ...userProfile, id: userProfile?.id || 'user' } as Player,
          status: 'finished',
          winner: mockPlayers[2],
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        }
      ];

      setOnlinePlayers(mockPlayers);
      setBattleInvites(mockInvites);
      setRecentBattles(mockBattles);
      setLoading(false);
    };

    loadPVPData();
  }, [userProfile]);

  // Quick match timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (searchingMatch) {
      interval = setInterval(() => {
        setMatchTimer(prev => prev + 1);
        
        // Auto-find match after 5-10 seconds
        if (matchTimer > 5 && Math.random() > 0.7) {
          const randomOpponent = onlinePlayers[Math.floor(Math.random() * onlinePlayers.length)];
          if (randomOpponent) {
            setSearchingMatch(false);
            setMatchTimer(0);
            onStartBattle(`battle_${Date.now()}`, randomOpponent);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [searchingMatch, matchTimer, onlinePlayers, onStartBattle]);

  const startQuickMatch = () => {
    setSearchingMatch(true);
    setMatchTimer(0);
  };

  const cancelQuickMatch = () => {
    setSearchingMatch(false);
    setMatchTimer(0);
  };

  const challengePlayer = (player: Player) => {
    // In real app, send Socket.IO event to invite player
    console.log(`Challenging ${player.name}...`);
    
    // Mock: Add to invites as "sent"
    const newInvite: BattleInvite = {
      id: `invite_${Date.now()}`,
      from: { ...userProfile, id: userProfile?.id || 'user' } as Player,
      to: player,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000) // 5 min
    };
    
    setBattleInvites(prev => [newInvite, ...prev]);
    alert(`Challenge sent to ${player.name}!`);
  };

  const respondToInvite = (inviteId: string, accept: boolean) => {
    setBattleInvites(prev => prev.map(invite => 
      invite.id === inviteId 
        ? { ...invite, status: accept ? 'accepted' : 'declined' }
        : invite
    ));

    if (accept) {
      const invite = battleInvites.find(i => i.id === inviteId);
      if (invite) {
        onStartBattle(`battle_${Date.now()}`, invite.from);
      }
    }
  };

  const getWinRate = (player: Player) => {
    const total = player.stats.battleWins + player.stats.battleLosses;
    return total > 0 ? Math.round((player.stats.battleWins / total) * 100) : 0;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="pvp-system">
      <style>{`
        .pvp-system {
          min-height: 100vh;
          background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .pvp-header {
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

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title h1 {
          font-size: 2em;
          margin: 0;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .user-record {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .record-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0 24px;
          overflow-x: auto;
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
          white-space: nowrap;
        }

        .tab-button:hover {
          color: white;
        }

        .tab-button.active {
          color: #ef4444;
          border-bottom-color: #ef4444;
        }

        .tab-content {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .quick-match-section {
          text-align: center;
          padding: 40px 20px;
        }

        .match-button {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 20px 40px;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 auto 24px;
        }

        .match-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(239, 68, 68, 0.3);
        }

        .match-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .searching-status {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin: 20px auto;
          max-width: 300px;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid #ef4444;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .cancel-button {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 16px;
        }

        .cancel-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .players-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .player-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .player-card:hover {
          transform: translateY(-2px);
          border-color: #ef4444;
        }

        .player-card.offline {
          opacity: 0.6;
        }

        .player-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .player-avatar {
          font-size: 2.5em;
          line-height: 1;
          position: relative;
        }

        .online-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          background: #10b981;
          border: 2px solid #1f2937;
          border-radius: 50%;
        }

        .offline-dot {
          background: #6b7280;
        }

        .player-info {
          flex: 1;
        }

        .player-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 6px 0;
        }

        .player-level {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1f2937;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 8px;
        }

        .player-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-item {
          text-align: center;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: #06b6d4;
        }

        .stat-label {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .player-record {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 14px;
          color: #d1d5db;
        }

        .win-rate {
          color: #10b981;
          font-weight: 600;
        }

        .challenge-button {
          width: 100%;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .challenge-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);
        }

        .challenge-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .invites-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .invite-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
        }

        .invite-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .invite-info {
          flex: 1;
        }

        .invite-from {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .invite-time {
          font-size: 14px;
          color: #9ca3af;
        }

        .invite-actions {
          display: flex;
          gap: 12px;
        }

        .accept-button {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.3s ease;
        }

        .accept-button:hover {
          transform: translateY(-1px);
        }

        .decline-button {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .decline-button:hover {
          background: rgba(239, 68, 68, 0.3);
        }

        .battles-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .battle-card {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .battle-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .battle-players {
          font-size: 16px;
          font-weight: 600;
        }

        .vs-text {
          color: #9ca3af;
          margin: 0 8px;
        }

        .winner {
          color: #10b981;
        }

        .loser {
          color: #ef4444;
        }

        .battle-time {
          font-size: 14px;
          color: #9ca3af;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .empty-icon {
          font-size: 4em;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .players-grid {
            grid-template-columns: 1fr;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .player-stats {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .invite-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .invite-actions {
            width: 100%;
          }

          .accept-button, .decline-button {
            flex: 1;
          }
        }
      `}</style>

      <div className="pvp-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Dashboard
        </button>
        
        <div className="header-content">
          <div className="header-title">
            <Swords size={32} />
            <h1>PVP Battles</h1>
          </div>
          
          <div className="user-record">
            <div className="record-badge">
              <Trophy size={16} />
              {userProfile?.stats.battleWins || 0}W - {userProfile?.stats.battleLosses || 0}L
            </div>
            <div className="record-badge">
              <Target size={16} />
              {getWinRate({ stats: { battleWins: userProfile?.stats.battleWins || 0, battleLosses: userProfile?.stats.battleLosses || 0 } } as Player)}% Win Rate
            </div>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'quick-match' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick-match')}
        >
          <Zap size={20} />
          Quick Match
        </button>
        <button 
          className={`tab-button ${activeTab === 'challenge' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenge')}
        >
          <Users size={20} />
          Challenge Players
        </button>
        <button 
          className={`tab-button ${activeTab === 'invites' ? 'active' : ''}`}
          onClick={() => setActiveTab('invites')}
        >
          <UserPlus size={20} />
          Invites ({battleInvites.filter(i => i.status === 'pending').length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={20} />
          Recent Battles
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'quick-match' && (
          <div className="quick-match-section">
            <h2>Quick Match</h2>
            <p style={{ color: '#9ca3af', marginBottom: 32 }}>
              Find a random opponent and start battling immediately!
            </p>

            {searchingMatch ? (
              <div className="searching-status">
                <div className="spinner"></div>
                <h3>Finding Opponent...</h3>
                <p>Searching for {matchTimer}s</p>
                <button className="cancel-button" onClick={cancelQuickMatch}>
                  Cancel Search
                </button>
              </div>
            ) : (
              <button className="match-button" onClick={startQuickMatch}>
                <Play size={24} />
                Start Quick Match
              </button>
            )}

            <div style={{ marginTop: 32, color: '#9ca3af', fontSize: 14 }}>
              <p>💪 Your stats will be used in battle</p>
              <p>⚔️ Winner gets +25 FIIT tokens</p>
              <p>🏆 Build your win streak!</p>
            </div>
          </div>
        )}

        {activeTab === 'challenge' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2>Challenge Players</h2>
              <button 
                className="cancel-button"
                onClick={() => window.location.reload()}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                <p>Loading players...</p>
              </div>
            ) : (
              <div className="players-grid">
                {onlinePlayers.filter(p => p.id !== userProfile?.id).map((player) => (
                  <div key={player.id} className={`player-card ${!player.isOnline ? 'offline' : ''}`}>
                    <div className="player-header">
                      <div className="player-avatar">
                        {player.avatar}
                        <div className={`online-dot ${!player.isOnline ? 'offline-dot' : ''}`}></div>
                      </div>
                      <div className="player-info">
                        <h3 className="player-name">{player.name}</h3>
                        <div className="player-level">Level {player.level}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>
                          {player.isOnline ? 'Online' : formatTimeAgo(player.lastSeen)}
                        </div>
                      </div>
                    </div>

                    <div className="player-stats">
                      <div className="stat-item">
                        <div className="stat-value">{player.stats.strength}</div>
                        <div className="stat-label">STR</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value">{player.stats.endurance}</div>
                        <div className="stat-label">END</div>
                      </div>
                    </div>

                    <div className="player-record">
                      <span>{player.stats.battleWins}W - {player.stats.battleLosses}L</span>
                      <span className="win-rate">{getWinRate(player)}% Win Rate</span>
                    </div>

                    <button 
                      className="challenge-button"
                      onClick={() => challengePlayer(player)}
                      disabled={!player.isOnline}
                    >
                      <Swords size={16} />
                      {player.isOnline ? 'Challenge' : 'Offline'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'invites' && (
          <div>
            <h2>Battle Invites</h2>
            
            {battleInvites.length > 0 ? (
              <div className="invites-list">
                {battleInvites.filter(invite => invite.status === 'pending').map((invite) => (
                  <div key={invite.id} className="invite-card">
                    <div className="invite-header">
                      <div style={{ fontSize: '2em' }}>{invite.from.avatar}</div>
                      <div className="invite-info">
                        <div className="invite-from">
                          <strong>{invite.from.name}</strong> challenges you to battle!
                        </div>
                        <div className="invite-time">
                          {formatTimeAgo(invite.createdAt)} • Expires in {Math.max(0, Math.floor((invite.expiresAt.getTime() - Date.now()) / 60000))} min
                        </div>
                      </div>
                      <div className="invite-actions">
                        <button 
                          className="accept-button"
                          onClick={() => respondToInvite(invite.id, true)}
                        >
                          Accept
                        </button>
                        <button 
                          className="decline-button"
                          onClick={() => respondToInvite(invite.id, false)}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📬</div>
                <h3>No Battle Invites</h3>
                <p>Challenge other players to receive battle invites!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2>Recent Battles</h2>
            
            {recentBattles.length > 0 ? (
              <div className="battles-list">
                {recentBattles.map((battle) => (
                  <div key={battle.id} className="battle-card">
                    <div className="battle-info">
                      <div className="battle-players">
                        <span className={battle.winner?.id === userProfile?.id ? 'winner' : 'loser'}>
                          You
                        </span>
                        <span className="vs-text">vs</span>
                        <span className={battle.winner?.id !== userProfile?.id ? 'winner' : 'loser'}>
                          {battle.player1.id === userProfile?.id ? battle.player2.name : battle.player1.name}
                        </span>
                      </div>
                    </div>
                    <div className="battle-time">
                      {formatTimeAgo(battle.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⚔️</div>
                <h3>No Recent Battles</h3>
                <p>Start battling to see your match history here!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimplePVPSystem;