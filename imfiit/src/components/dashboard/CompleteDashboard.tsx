import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Trophy, Zap, Calendar, ExternalLink, Coins, Target, BarChart3, PieChart } from 'lucide-react';

interface BattleRecord {
  id: string;
  opponent: string;
  wager: number;
  result: 'win' | 'loss';
  profit: number;
  timestamp: Date;
  txHash: string;
  battleType: 'quick' | 'ranked' | 'tournament';
}

interface WinningsStats {
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;
  winStreak: number;
  lossStreak: number;
  bestWin: number;
  worstLoss: number;
  winRate: number;
  totalBattles: number;
  averageWager: number;
  profitToday: number;
  profitThisWeek: number;
  profitThisMonth: number;
}

interface WinningsDashboardProps {
  userProfile: any;
  onBack: () => void;
}

const WinningsDashboard: React.FC<WinningsDashboardProps> = ({
  userProfile,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'analytics'>('overview');
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [winningsStats, setWinningsStats] = useState<WinningsStats | null>(null);
  const [battleHistory, setBattleHistory] = useState<BattleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWinningsData();
  }, [timeFilter]);

  const loadWinningsData = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock comprehensive winnings data
    const mockStats: WinningsStats = {
      totalWinnings: 8.47,
      totalLosses: 3.25,
      netProfit: 5.22,
      winStreak: 7,
      lossStreak: 0,
      bestWin: 1.2,
      worstLoss: -0.8,
      winRate: 72.3,
      totalBattles: 47,
      averageWager: 0.15,
      profitToday: 0.65,
      profitThisWeek: 2.1,
      profitThisMonth: 5.22
    };

    const mockHistory: BattleRecord[] = [
      {
        id: '1',
        opponent: 'FitCrypto99',
        wager: 0.2,
        result: 'win',
        profit: 0.4,
        timestamp: new Date(Date.now() - 1800000), // 30 min ago
        txHash: '5KJdnML7ZQwKpBgKrVB2mHc8Nf9XtY6uR3pL4sD7vE1qA8',
        battleType: 'quick'
      },
      {
        id: '2',
        opponent: 'SolanaWarrior',
        wager: 0.15,
        result: 'win',
        profit: 0.3,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        txHash: '7NMkpLR9YTwJpCgLrVF5bHd9Ng8XrY4uQ2oK3sF6wG0pB9',
        battleType: 'ranked'
      },
      {
        id: '3',
        opponent: 'CryptoFit',
        wager: 0.25,
        result: 'loss',
        profit: -0.25,
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        txHash: '3HJmkLP9XSwJpCgLrVF2aGc7Me6WqX3tP1nJ2rE5vD8nC0',
        battleType: 'tournament'
      },
      {
        id: '4',
        opponent: 'FitnessPro',
        wager: 0.1,
        result: 'win',
        profit: 0.2,
        timestamp: new Date(Date.now() - 14400000), // 4 hours ago
        txHash: '9PLnqQS6ZUxNqDhRsXH3cId8Oh7YrZ5vS4pM5tG8xF2oD1',
        battleType: 'quick'
      },
      {
        id: '5',
        opponent: 'SolGym',
        wager: 0.3,
        result: 'win',
        profit: 0.6,
        timestamp: new Date(Date.now() - 21600000), // 6 hours ago
        txHash: '2GKmnNP8WVyOpEiStYI4dJf9Pi8ZsA6wT5qN6uH9yG3pE2',
        battleType: 'ranked'
      },
      {
        id: '6',
        opponent: 'BlockchainBeast',
        wager: 0.4,
        result: 'win',
        profit: 0.8,
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        txHash: '8OLpsRQ7XTzPqFjTuZJ5eKg0Qj9AtB7xU6rO7vI0zH4qF3',
        battleType: 'tournament'
      },
      {
        id: '7',
        opponent: 'NFTFighter',
        wager: 0.18,
        result: 'loss',
        profit: -0.18,
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        txHash: '6NKqrPS9YU0QrGkUvAK6fLh1Rk0BuC8yV7sP8wJ1AI5rG4',
        battleType: 'quick'
      }
    ];

    setWinningsStats(mockStats);
    setBattleHistory(mockHistory);
    setLoading(false);
  };

  const formatSOL = (amount: number) => `${amount.toFixed(4)} SOL`;
  
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getBattleTypeColor = (type: string) => {
    switch (type) {
      case 'quick': return '#06b6d4';
      case 'ranked': return '#8b5cf6';
      case 'tournament': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      {/* Main Stats Cards */}
      <div className="main-stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Trophy size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Net Profit</span>
            <span className="stat-value profit">
              +{formatSOL(winningsStats?.netProfit || 0)}
            </span>
            <span className="stat-sub">
              ${((winningsStats?.netProfit || 0) * 180).toFixed(2)} USD
            </span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <TrendingUp size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">
              {winningsStats?.winRate.toFixed(1)}%
            </span>
            <span className="stat-sub">
              {winningsStats?.totalBattles} battles
            </span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Zap size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Win Streak</span>
            <span className="stat-value">
              {winningsStats?.winStreak}
            </span>
            <span className="stat-sub">
              Current streak
            </span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <Coins size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Best Win</span>
            <span className="stat-value">
              +{formatSOL(winningsStats?.bestWin || 0)}
            </span>
            <span className="stat-sub">
              Single battle
            </span>
          </div>
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="time-stats-grid">
        <div className="time-stat">
          <span className="time-label">Today</span>
          <span className={`time-value ${(winningsStats?.profitToday || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(winningsStats?.profitToday || 0) >= 0 ? '+' : ''}{formatSOL(winningsStats?.profitToday || 0)}
          </span>
        </div>
        
        <div className="time-stat">
          <span className="time-label">This Week</span>
          <span className={`time-value ${(winningsStats?.profitThisWeek || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(winningsStats?.profitThisWeek || 0) >= 0 ? '+' : ''}{formatSOL(winningsStats?.profitThisWeek || 0)}
          </span>
        </div>
        
        <div className="time-stat">
          <span className="time-label">This Month</span>
          <span className={`time-value ${(winningsStats?.profitThisMonth || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(winningsStats?.profitThisMonth || 0) >= 0 ? '+' : ''}{formatSOL(winningsStats?.profitThisMonth || 0)}
          </span>
        </div>
      </div>

      {/* Win/Loss Breakdown */}
      <div className="breakdown-section">
        <h3>📊 Performance Breakdown</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <span className="breakdown-label">Total Winnings</span>
            <span className="breakdown-value win">+{formatSOL(winningsStats?.totalWinnings || 0)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Total Losses</span>
            <span className="breakdown-value loss">-{formatSOL(winningsStats?.totalLosses || 0)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Average Wager</span>
            <span className="breakdown-value">{formatSOL(winningsStats?.averageWager || 0)}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Worst Loss</span>
            <span className="breakdown-value loss">{formatSOL(winningsStats?.worstLoss || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="history-section">
      <div className="history-header">
        <h3>⚔️ Battle History</h3>
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value as any)}
          className="time-filter"
        >
          <option value="all">All Time</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="battles-list">
        {battleHistory.map((battle) => (
          <div key={battle.id} className={`battle-record ${battle.result}`}>
            <div className="battle-main-info">
              <div className="battle-opponent">
                <span className="opponent-name">vs {battle.opponent}</span>
                <span 
                  className="battle-type-badge"
                  style={{ backgroundColor: getBattleTypeColor(battle.battleType) }}
                >
                  {battle.battleType.toUpperCase()}
                </span>
              </div>
              
              <div className="battle-details">
                <span className="wager-info">💰 {formatSOL(battle.wager)} wager</span>
                <span className="time-info">{formatTimeAgo(battle.timestamp)}</span>
              </div>
            </div>

            <div className="battle-result-info">
              <div className="result-badge-container">
                <span className={`result-badge ${battle.result}`}>
                  {battle.result === 'win' ? '🏆 WIN' : '💀 LOSS'}
                </span>
                <span className={`profit-amount ${battle.result}`}>
                  {battle.result === 'win' ? '+' : ''}{formatSOL(battle.profit)}
                </span>
              </div>
              
              <a 
                href={`https://solscan.io/tx/${battle.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                <ExternalLink size={16} />
                <span>View TX</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {battleHistory.length === 0 && (
        <div className="empty-history">
          <Trophy size={48} />
          <p>No battles yet!</p>
          <p>Start battling to see your history here.</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <h3>📈 Advanced Analytics</h3>
      
      <div className="analytics-grid">
        {/* Performance Metrics */}
        <div className="analytics-card">
          <h4><BarChart3 size={20} /> Performance Metrics</h4>
          <div className="metrics-list">
            <div className="metric">
              <span>ROI (Return on Investment)</span>
              <span className="positive">+{(((winningsStats?.netProfit || 0) / (winningsStats?.totalLosses || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span>Profit Factor</span>
              <span>{((winningsStats?.totalWinnings || 0) / (winningsStats?.totalLosses || 1)).toFixed(2)}</span>
            </div>
            <div className="metric">
              <span>Average Win</span>
              <span className="positive">+{formatSOL((winningsStats?.totalWinnings || 0) / Math.max(1, (winningsStats?.totalBattles || 1) * (winningsStats?.winRate || 0) / 100))}</span>
            </div>
            <div className="metric">
              <span>Average Loss</span>
              <span className="negative">{formatSOL((winningsStats?.totalLosses || 0) / Math.max(1, (winningsStats?.totalBattles || 1) * (100 - (winningsStats?.winRate || 0)) / 100))}</span>
            </div>
          </div>
        </div>

        {/* Battle Type Analysis */}
        <div className="analytics-card">
          <h4><PieChart size={20} /> Battle Type Analysis</h4>
          <div className="battle-types">
            <div className="battle-type-stat">
              <span className="type-dot" style={{ backgroundColor: '#06b6d4' }}></span>
              <span>Quick Battles</span>
              <span>65%</span>
            </div>
            <div className="battle-type-stat">
              <span className="type-dot" style={{ backgroundColor: '#8b5cf6' }}></span>
              <span>Ranked</span>
              <span>25%</span>
            </div>
            <div className="battle-type-stat">
              <span className="type-dot" style={{ backgroundColor: '#f59e0b' }}></span>
              <span>Tournaments</span>
              <span>10%</span>
            </div>
          </div>
        </div>

        {/* Recent Trends */}
        <div className="analytics-card">
          <h4><TrendingUp size={20} /> Recent Trends</h4>
          <div className="trends-info">
            <div className="trend-item">
              <span>📈 Current form: </span>
              <span className="positive">Hot streak!</span>
            </div>
            <div className="trend-item">
              <span>🎯 Favorite opponent type: </span>
              <span>Crypto enthusiasts</span>
            </div>
            <div className="trend-item">
              <span>⏰ Most active time: </span>
              <span>Evening battles</span>
            </div>
            <div className="trend-item">
              <span>💎 Best wager range: </span>
              <span>0.1-0.3 SOL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Progress */}
      <div className="achievements-section">
        <h4>🏆 Achievement Progress</h4>
        <div className="achievements-grid">
          <div className="achievement-item">
            <span className="achievement-icon">🔥</span>
            <div className="achievement-info">
              <span className="achievement-name">Hot Streak</span>
              <span className="achievement-progress">7/10 wins</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '70%'}}></div>
            </div>
          </div>
          
          <div className="achievement-item">
            <span className="achievement-icon">💰</span>
            <div className="achievement-info">
              <span className="achievement-name">High Roller</span>
              <span className="achievement-progress">5.2/10 SOL</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '52%'}}></div>
            </div>
          </div>
          
          <div className="achievement-item completed">
            <span className="achievement-icon">⚔️</span>
            <div className="achievement-info">
              <span className="achievement-name">Battle Veteran</span>
              <span className="achievement-progress">47/50 battles</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: '94%'}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="winnings-dashboard loading">
        <div className="loading-spinner">
          <Coins size={48} />
          <p>Loading your winnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="winnings-dashboard">
      <style>{`
        .winnings-dashboard {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
          background: linear-gradient(135deg, #14101d 0%, #2a1b3d 50%, #44337a 100%);
          min-height: 100vh;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .back-btn {
          background: none;
          border: none;
          color: #c084fc;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .back-btn:hover {
          color: #a855f7;
        }

        .dashboard-title {
          font-size: 2.5em;
          font-weight: bold;
          background: linear-gradient(135deg, #06b6d4, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 12px;
        }

        .tab-btn {
          background: none;
          border: none;
          color: #9ca3af;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .tab-btn.active {
          background: linear-gradient(45deg, #9333ea, #7c3aed);
          color: white;
        }

        .tab-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        /* Main Stats Grid */
        .main-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .stat-card.primary {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
          border-color: #10b981;
        }

        .stat-card.success {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(8, 145, 178, 0.1));
          border-color: #06b6d4;
        }

        .stat-card.warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
          border-color: #f59e0b;
        }

        .stat-card.info {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.1));
          border-color: #8b5cf6;
        }

        .stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 60px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: #9ca3af;
          font-weight: 500;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: white;
        }

        .stat-value.profit {
          color: #10b981;
        }

        .stat-sub {
          font-size: 12px;
          color: #6b7280;
        }

        /* Time Stats */
        .time-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .time-stat {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .time-label {
          display: block;
          font-size: 14px;
          color: #9ca3af;
          margin-bottom: 8px;
        }

        .time-value {
          font-size: 20px;
          font-weight: bold;
        }

        .time-value.positive {
          color: #10b981;
        }

        .time-value.negative {
          color: #ef4444;
        }

        /* Breakdown Section */
        .breakdown-section {
          background: rgba(255, 255, 255, 0.03);
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .breakdown-label {
          color: #9ca3af;
          font-size: 14px;
        }

        .breakdown-value {
          font-weight: bold;
          color: white;
        }

        .breakdown-value.win {
          color: #10b981;
        }

        .breakdown-value.loss {
          color: #ef4444;
        }

        /* History Section */
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .time-filter {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          color: white;
          font-size: 14px;
        }

        .battles-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .battle-record {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .battle-record.win {
          border-left: 4px solid #10b981;
        }

        .battle-record.loss {
          border-left: 4px solid #ef4444;
        }

        .battle-main-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .battle-opponent {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .opponent-name {
          font-weight: bold;
          font-size: 16px;
        }

        .battle-type-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          color: white;
        }

        .battle-details {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #9ca3af;
        }

        .battle-result-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .result-badge-container {
          text-align: right;
        }

        .result-badge {
          display: block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .result-badge.win {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .result-badge.loss {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .profit-amount {
          font-weight: bold;
          font-size: 16px;
        }

        .profit-amount.win {
          color: #10b981;
        }

        .profit-amount.loss {
          color: #ef4444;
        }

        .tx-link {
          color: #06b6d4;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(6, 182, 212, 0.1);
        }

        .tx-link:hover {
          background: rgba(6, 182, 212, 0.2);
        }

        /* Analytics Section */
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .analytics-card {
          background: rgba(255, 255, 255, 0.03);
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .analytics-card h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          color: #e5e7eb;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .metric span:first-child {
          color: #9ca3af;
          font-size: 14px;
        }

        .metric span:last-child {
          font-weight: bold;
          color: white;
        }

        .positive {
          color: #10b981 !important;
        }

        .negative {
          color: #ef4444 !important;
        }

        /* Battle Types */
        .battle-types {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .battle-type-stat {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
        }

        .type-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        /* Trends */
        .trends-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .trend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #d1d5db;
        }

        /* Achievements */
        .achievements-section {
          background: rgba(255, 255, 255, 0.03);
          padding: 24px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .achievements-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .achievement-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
        }

        .achievement-item.completed {
          border: 1px solid #10b981;
          background: rgba(16, 185, 129, 0.05);
        }

        .achievement-icon {
          font-size: 32px;
        }

        .achievement-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .achievement-name {
          font-weight: bold;
          color: white;
        }

        .achievement-progress {
          font-size: 14px;
          color: #9ca3af;
        }

        .progress-bar {
          width: 120px;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.3s ease;
        }

        /* Loading State */
        .winnings-dashboard.loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          text-align: center;
          color: #9ca3af;
        }

        .loading-spinner svg {
          animation: spin 2s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Empty State */
        .empty-history {
          text-align: center;
          padding: 60px 20px;
          color: #9ca3af;
        }

        .empty-history svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .winnings-dashboard {
            padding: 16px;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            text-align: center;
          }

          .main-stats-grid {
            grid-template-columns: 1fr;
          }

          .battle-record {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .battle-result-info {
            align-items: flex-start;
            width: 100%;
          }

          .tab-navigation {
            flex-direction: column;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-header">
        <button className="back-btn" onClick={onBack}>
          ← Back to Dashboard
        </button>
        <h1 className="dashboard-title">💰 Your Battle Winnings</h1>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Trophy size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Calendar size={16} />
          History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          Analytics
        </button>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'analytics' && renderAnalytics()}
    </div>
  );
};

export default WinningsDashboard;