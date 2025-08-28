// src/components/battle/BattleTimer.tsx
import React, { useState, useEffect } from 'react';

// ============================================================================
// ENHANCED TURN TIMER
// ============================================================================

interface TurnTimerProps {
  timeLeft: number;
  maxTime: number;
  isMyTurn: boolean;
  onTimeout?: () => void;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
  timeLeft,
  maxTime,
  isMyTurn,
  onTimeout
}) => {
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    setIsWarning(timeLeft <= 10);
    
    if (timeLeft <= 0 && onTimeout) {
      onTimeout();
    }
  }, [timeLeft, onTimeout]);

  const percentage = (timeLeft / maxTime) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getTimerColor = () => {
    if (percentage > 60) return '#4ade80';
    if (percentage > 30) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 120,
      height: 120
    }}>
      {/* Circular Progress */}
      <svg
        width="100"
        height="100"
        style={{
          position: 'absolute',
          transform: 'rotate(-90deg)'
        }}
      >
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={getTimerColor()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease',
            filter: isWarning ? 'drop-shadow(0 0 8px currentColor)' : 'none'
          }}
        />
      </svg>

      {/* Timer Text */}
      <div style={{
        position: 'absolute',
        textAlign: 'center',
        color: getTimerColor(),
        animation: isWarning ? 'timerWarning 0.5s ease-in-out infinite' : 'none'
      }}>
        <div style={{ 
          fontSize: 24, 
          fontWeight: 'bold',
          marginBottom: 2
        }}>
          {timeLeft}
        </div>
        <div style={{ 
          fontSize: 10, 
          opacity: 0.8,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          {isMyTurn ? 'Your Turn' : 'Wait'}
        </div>
      </div>

      <style jsx>{`
        @keyframes timerWarning {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// BATTLE RESULTS COMPONENT
// ============================================================================

interface BattleResult {
  winner: string;
  loser: string;
  battleDuration: number;
  totalTurns: number;
  winnerRewards: {
    experience: number;
    strength: number;
    endurance: number;
    coins: number;
  };
  loserRewards: {
    experience: number;
    strength: number;
    endurance: number;
    coins: number;
  };
  finalHealth: {
    [playerId: string]: number;
  };
  battleLog: string[];
}

interface BattleResultsProps {
  result: BattleResult;
  myId: string;
  myName: string;
  opponentName: string;
  onClose: () => void;
}

export const BattleResults: React.FC<BattleResultsProps> = ({
  result,
  myId,
  myName,
  opponentName,
  onClose
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const isWinner = result.winner === myId;
  const myRewards = isWinner ? result.winnerRewards : result.loserRewards;
  const myFinalHealth = result.finalHealth[myId];
  
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: 20
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        borderRadius: 20,
        padding: 32,
        maxWidth: 500,
        width: '100%',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        animation: 'resultSlideIn 0.5s ease-out'
      }}>
        {/* Result Header */}
        <div style={{
          fontSize: 48,
          marginBottom: 16,
          animation: 'resultBounce 1s ease-out'
        }}>
          {isWinner ? '🏆' : '💪'}
        </div>

        <h2 style={{
          fontSize: 32,
          fontWeight: 'bold',
          marginBottom: 8,
          color: isWinner ? '#22c55e' : '#f59e0b',
          textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
        }}>
          {isWinner ? 'VICTORY!' : 'GOOD FIGHT!'}
        </h2>

        <p style={{
          fontSize: 16,
          color: '#d1d5db',
          marginBottom: 24
        }}>
          {isWinner 
            ? `You defeated ${opponentName}!` 
            : `${opponentName} won this round!`
          }
        </p>

        {/* Battle Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>⏱️</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Duration</div>
            <div style={{ fontWeight: 'bold' }}>{formatDuration(result.battleDuration)}</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>🔥</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Turns</div>
            <div style={{ fontWeight: 'bold' }}>{result.totalTurns}</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: 16
          }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>❤️</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Final HP</div>
            <div style={{ fontWeight: 'bold', color: myFinalHealth > 50 ? '#22c55e' : '#ef4444' }}>
              {myFinalHealth}/100
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          padding: 20,
          marginBottom: 24
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 16,
            color: '#06b6d4'
          }}>
            🎁 Battle Rewards
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12
          }}>
            <div style={{
              background: 'rgba(6,182,212,0.2)',
              border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: 8,
              padding: 12
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>🎯</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Experience</div>
              <div style={{ fontWeight: 'bold', color: '#06b6d4' }}>
                +{myRewards.experience} XP
              </div>
            </div>

            <div style={{
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8,
              padding: 12
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>🪙</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Coins</div>
              <div style={{ fontWeight: 'bold', color: '#22c55e' }}>
                +{myRewards.coins}
              </div>
            </div>

            <div style={{
              background: 'rgba(139,92,246,0.2)',
              border: '1px solid rgba(139,92,246,0.3)',
              borderRadius: 8,
              padding: 12
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>💪</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Strength</div>
              <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                +{myRewards.strength}
              </div>
            </div>

            <div style={{
              background: 'rgba(245,158,11,0.2)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 8,
              padding: 12
            }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>🏃</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Endurance</div>
              <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                +{myRewards.endurance}
              </div>
            </div>
          </div>
        </div>

        {/* Battle Log Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '8px 16px',
            color: 'white',
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 16
          }}
        >
          {showDetails ? '🔼 Hide Details' : '🔽 Show Battle Log'}
        </button>

        {/* Battle Log */}
        {showDetails && (
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            maxHeight: 150,
            overflowY: 'auto',
            textAlign: 'left'
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 'bold',
              marginBottom: 12,
              color: '#06b6d4'
            }}>
              Battle Summary
            </div>
            {result.battleLog.map((log, index) => (
              <div key={index} style={{
                fontSize: 12,
                color: '#d1d5db',
                marginBottom: 4,
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 4
              }}>
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(45deg, #06b6d4, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🏠 Return to Dashboard
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            ⚔️ Battle Again
          </button>
        </div>

        <style jsx>{`
          @keyframes resultSlideIn {
            0% {
              opacity: 0;
              transform: translateY(-50px) scale(0.9);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes resultBounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-10px);
            }
            60% {
              transform: translateY(-5px);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

// ============================================================================
// BATTLE PROGRESS INDICATOR
// ============================================================================

interface BattleProgressProps {
  currentTurn: number;
  maxTurns: number;
  playerHealth: number;
  opponentHealth: number;
}

export const BattleProgress: React.FC<BattleProgressProps> = ({
  currentTurn,
  maxTurns,
  playerHealth,
  opponentHealth
}) => {
  const progressPercentage = (currentTurn / maxTurns) * 100;

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: 12,
      padding: 16,
      margin: '16px 0'
    }}>
      {/* Turn Counter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <div style={{ fontSize: 14, color: '#d1d5db' }}>
          Turn {currentTurn} of {maxTurns}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>
          {Math.round(progressPercentage)}% complete
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        height: 8,
        overflow: 'hidden',
        marginBottom: 16
      }}>
        <div style={{
          width: `${progressPercentage}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Health Comparison */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: 16
      }}>
        {/* Player Health */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
            Your Health
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            height: 12,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${playerHealth}%`,
              height: '100%',
              background: playerHealth > 50 ? '#22c55e' : playerHealth > 25 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>
            {playerHealth}/100
          </div>
        </div>

        {/* VS */}
        <div style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#ef4444'
        }}>
          VS
        </div>

        {/* Opponent Health */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>
            Opponent Health
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
            height: 12,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${opponentHealth}%`,
              height: '100%',
              background: opponentHealth > 50 ? '#22c55e' : opponentHealth > 25 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.5s ease'
            }} />
          </div>
          <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>
            {opponentHealth}/100
          </div>
        </div>
      </div>
    </div>
  );
};