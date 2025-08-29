import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Trophy, Zap, ExternalLink, BarChart3 } from 'lucide-react';

interface BattleResult {
  id: string;
  battleId: string;
  playerId: string;
  opponentId: string;
  opponentName: string;
  wager: number;
  result: 'win' | 'loss';
  profit: number; // positive for wins, negative for losses
  battleDate: string;
  txHash?: string;
  battleType: 'pvp' | 'ai';
  duration?: number;
}

interface WinningsStats {
  totalBattles: number;
  totalWins: number;
  totalLosses: number;
  winRate: number; // percentage
  totalWinnings: number; // sum of all positive profits
  totalLosses: number; // sum of all negative profits (absolute value)
  netProfit: number; // totalWinnings - totalLosses
  currentStreak: number;
  bestWin: number;
  worstLoss: number;
  averageWager: number;
}

interface WinningsDashboardProps {
  userProfile: any;
  onBack: () => void;
}

const WinningsDashboard: React.FC<WinningsDashboardProps> = ({ 
  userProfile, 
  onBack 
}) => {
  const [winningsStats, setWinningsStats] = useState<WinningsStats | null>(null);
  const [battleHistory, setBattleHistory] = useState<BattleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch winnings data from backend
  useEffect(() => {
    fetchWinningsData();
  }, [userProfile?.id]);

  const fetchWinningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = userProfile?.id || userProfile?.telegramId;
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Fetch battle results from your backend API
      const response = await fetch(`/api/battles/user/${userId}/results`);
      if (!response.ok) {
        throw new Error('Failed to fetch battle data');
      }

      const battles: BattleResult[] = await response.json();
      setBattleHistory(battles);

      // Calculate stats from the real data
      const stats = calculateWinningsStats(battles);
      setWinningsStats(stats);

    } catch (err) {
      console.error('Error fetching winnings data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load winnings data');
      
      // Initialize empty stats when no data or error
      setWinningsStats({
        totalBattles: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalWinnings: 0,
        totalLosses: 0,
        netProfit: 0,
        currentStreak: 0,
        bestWin: 0,
        worstLoss: 0,
        averageWager: 0
      });
      setBattleHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateWinningsStats = (battles: BattleResult[]): WinningsStats => {
    if (battles.length === 0) {
      return {
        totalBattles: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalWinnings: 0,
        totalLosses: 0,
        netProfit: 0,
        currentStreak: 0,
        bestWin: 0,
        worstLoss: 0,
        averageWager: 0
      };
    }

    const totalBattles = battles.length;
    const totalWins = battles.filter(b => b.result === 'win').length;
    const totalLossCount = battles.filter(b => b.result === 'loss').length;
    const winRate = totalBattles > 0 ? (totalWins / totalBattles) * 100 : 0;

    // Calculate winnings and losses
    const winnings = battles
      .filter(b => b.result === 'win')
      .reduce((sum, b) => sum + Math.abs(b.profit), 0);
    
    const losses = battles
      .filter(b => b.result === 'loss')
      .reduce((sum, b) => sum + Math.abs(b.profit), 0);

    const netProfit = winnings - losses;

    // Calculate streaks (current streak from most recent battles)
    let currentStreak = 0;
    const sortedBattles = [...battles].sort((a, b) => 
      new Date(b.battleDate).getTime() - new Date(a.battleDate).getTime()
    );
    
    if (sortedBattles.length > 0) {
      const lastResult = sortedBattles[0].result;
      for (const battle of sortedBattles) {
        if (battle.result === lastResult) {
          currentStreak++;
        } else {
          break;
        }
      }
      // Make streak negative if it's a loss streak
      if (lastResult === 'loss') currentStreak = -currentStreak;
    }

    // Find best win and worst loss
    const bestWin = battles
      .filter(b => b.result === 'win')
      .reduce((max, b) => Math.max(max, b.profit), 0);
    
    const worstLoss = battles
      .filter(b => b.result === 'loss')
      .reduce((min, b) => Math.min(min, Math.abs(b.profit)), 0);

    // Average wager
    const averageWager = battles.reduce((sum, b) => sum + b.wager, 0) / totalBattles;

    return {
      totalBattles,
      totalWins,
      totalLosses: totalLossCount,
      winRate,
      totalWinnings: winnings,
      totalLosses: losses,
      netProfit,
      currentStreak,
      bestWin,
      worstLoss,
      averageWager
    };
  };

  const formatSOL = (amount: number): string => {
    return `${amount.toFixed(4)} SOL`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <p>Loading your battle history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', padding: '20px' }}>
      <button 
        onClick={onBack} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: '#06b6d4', 
          marginBottom: '20px', 
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ← Back to Battle Arena
      </button>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>💰 Your Battle Winnings</h1>
          <p>Track your performance and earnings from battles</p>
        </div>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid #ef4444', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#ef4444', margin: 0 }}>⚠️ {error}</p>
            <button 
              onClick={fetchWinningsData}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                marginTop: '8px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px', 
          marginBottom: '40px' 
        }}>
          {/* Net Profit */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '24px',
            borderRadius: '12px',
            border: `2px solid ${winningsStats?.netProfit >= 0 ? '#10b981' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Trophy size={32} color={winningsStats?.netProfit >= 0 ? '#10b981' : '#ef4444'} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>Net Profit</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: winningsStats?.netProfit >= 0 ? '#10b981' : '#ef4444'
              }}>
                {winningsStats?.netProfit >= 0 ? '+' : ''}{formatSOL(winningsStats?.netProfit || 0)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>
                ${((winningsStats?.netProfit || 0) * 240).toFixed(2)} USD
              </div>
            </div>
          </div>

          {/* Win Rate */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '24px',
            borderRadius: '12px',
            border: '2px solid #06b6d4',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <BarChart3 size={32} color="#06b6d4" />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>Win Rate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4' }}>
                {winningsStats?.winRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>
                {winningsStats?.totalBattles} battles
              </div>
            </div>
          </div>

          {/* Win Streak */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '24px',
            borderRadius: '12px',
            border: `2px solid ${winningsStats?.currentStreak >= 0 ? '#f59e0b' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Zap size={32} color={winningsStats?.currentStreak >= 0 ? '#f59e0b' : '#ef4444'} />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.7', marginBottom: '4px' }}>Current Streak</div>
              <div style={{ 
                fontSize: '24px', 
                fontWeight: 'bold',
                color: winningsStats?.currentStreak >= 0 ? '#f59e0b' : '#ef4444'
              }}>
                {Math.abs(winningsStats?.currentStreak || 0)}
                <span style={{ fontSize: '16px', marginLeft: '4px' }}>
                  {winningsStats?.currentStreak >= 0 ? '🔥' : '❄️'}
                </span>
              </div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>
                {winningsStats?.currentStreak >= 0 ? 'Win streak' : 'Loss streak'}
              </div>
            </div>
          </div>

          {/* Best Win */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '24px',
            borderRadius: '12px',
            border: '2px solid #8b5cf6',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <TrendingUp size={32} color="#8b5cf6" />
            <div>
              <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '4px' }}>Best Win</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                +{formatSOL(winningsStats?.bestWin || 0)}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>Single battle</div>
            </div>
          </div>
        </div>

        {/* Battle History */}
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🕒</span> Recent Battle History
          </h3>
          
          {battleHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Trophy size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ opacity: 0.7 }}>No battles yet!</p>
              <p style={{ opacity: 0.5 }}>Start battling to see your history here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {battleHistory.slice(0, 10).map((battle) => (
                <div
                  key={battle.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '16px',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${battle.result === 'win' ? '#10b981' : '#ef4444'}`
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>vs {battle.opponentName}</span>
                    <span style={{ fontSize: '12px', opacity: 0.6 }}>
                      {formatSOL(battle.wager)} wager • {formatDate(battle.battleDate)}
                    </span>
                    <span style={{ fontSize: '11px', opacity: 0.5 }}>
                      {battle.battleType === 'pvp' ? '👥 PvP' : '🤖 AI'} Battle
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: battle.result === 'win' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: battle.result === 'win' ? '#10b981' : '#ef4444'
                      }}>
                        {battle.result === 'win' ? '🏆 WIN' : '💀 LOSS'}
                      </div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: battle.result === 'win' ? '#10b981' : '#ef4444',
                        marginTop: '4px'
                      }}>
                        {battle.result === 'win' ? '+' : ''}{formatSOL(battle.profit)}
                      </div>
                    </div>
                    
                    {battle.txHash && (
                      <a
                        href={`https://solscan.io/tx/${battle.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#06b6d4',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <ExternalLink size={14} />
                        TX
                      </a>
                    )}
                  </div>
                </div>
              ))}
              
              {battleHistory.length > 10 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button
                    onClick={() => {/* Implement load more */}}
                    style={{
                      background: 'rgba(6, 182, 212, 0.2)',
                      color: '#06b6d4',
                      border: '1px solid #06b6d4',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Load More ({battleHistory.length - 10} more battles)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WinningsDashboard;