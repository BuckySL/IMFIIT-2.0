// src/components/battle/BattleRewards.tsx
import React, { useState, useEffect } from 'react';

// ============================================================================
// REWARD ANIMATION COMPONENT
// ============================================================================

interface RewardItem {
  type: 'experience' | 'strength' | 'endurance' | 'coins' | 'level';
  amount: number;
  icon: string;
  color: string;
  label: string;
}

interface AnimatedRewardProps {
  reward: RewardItem;
  delay: number;
  onComplete: () => void;
}

const AnimatedReward: React.FC<AnimatedRewardProps> = ({ reward, delay, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, delay);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, delay + 1500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [delay, onComplete]);

  if (!isVisible) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: `${reward.color}20`,
      border: `2px solid ${reward.color}40`,
      borderRadius: 12,
      padding: 16,
      margin: '8px 0',
      transform: isAnimating ? 'translateX(0) scale(1)' : 'translateX(-50px) scale(0.8)',
      opacity: isAnimating ? 1 : 0,
      transition: 'all 0.5s ease-out'
    }}>
      <div style={{
        fontSize: 32,
        marginRight: 12,
        animation: 'rewardBounce 1s ease-out'
      }}>
        {reward.icon}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: reward.color
        }}>
          +{reward.amount} {reward.label}
        </div>
        <div style={{
          fontSize: 12,
          color: '#9ca3af',
          marginTop: 2
        }}>
          {reward.type === 'level' ? 'Level Up!' : 'Battle Reward'}
        </div>
      </div>

      <style jsx>{`
        @keyframes rewardBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// REWARDS CALCULATOR
// ============================================================================

export class BattleRewardsCalculator {
  static calculateRewards(
    isWinner: boolean,
    playerLevel: number,
    opponentLevel: number,
    battleDuration: number,
    turnsUsed: number,
    playerHealth: number
  ) {
    const baseRewards = {
      experience: isWinner ? 25 : 10,
      strength: isWinner ? 2 : 1,
      endurance: isWinner ? 2 : 1,
      coins: isWinner ? 50 : 20
    };

    // Level difference bonus/penalty
    const levelDiff = opponentLevel - playerLevel;
    const levelMultiplier = 1 + (levelDiff * 0.1); // +10% per level difference

    // Performance bonuses
    const healthBonus = playerHealth > 50 ? 1.2 : 1.0; // 20% bonus for good health
    const speedBonus = turnsUsed < 10 ? 1.3 : turnsUsed < 20 ? 1.1 : 1.0; // Speed bonus
    const durationPenalty = battleDuration > 300000 ? 0.8 : 1.0; // 5+ minute penalty

    const totalMultiplier = levelMultiplier * healthBonus * speedBonus * durationPenalty;

    return {
      experience: Math.round(baseRewards.experience * totalMultiplier),
      strength: Math.round(baseRewards.strength * Math.max(0.5, totalMultiplier)),
      endurance: Math.round(baseRewards.endurance * Math.max(0.5, totalMultiplier)),
      coins: Math.round(baseRewards.coins * totalMultiplier)
    };
  }

  static checkLevelUp(currentXP: number, gainedXP: number, currentLevel: number) {
    const newXP = currentXP + gainedXP;
    const xpNeeded = this.getXPForLevel(currentLevel + 1);
    
    if (newXP >= xpNeeded) {
      return {
        leveledUp: true,
        newLevel: currentLevel + 1,
        newXP,
        xpForNextLevel: this.getXPForLevel(currentLevel + 2)
      };
    }

    return {
      leveledUp: false,
      newLevel: currentLevel,
      newXP,
      xpForNextLevel: xpNeeded
    };
  }

  static getXPForLevel(level: number): number {
    // XP formula: level^2 * 100 (exponential growth)
    return level * level * 100;
  }
}

// ============================================================================
// BATTLE REWARDS DISPLAY
// ============================================================================

interface BattleRewardsDisplayProps {
  isWinner: boolean;
  rewards: {
    experience: number;
    strength: number;
    endurance: number;
    coins: number;
  };
  levelUp?: {
    leveledUp: boolean;
    newLevel: number;
    oldLevel: number;
  };
  onComplete: () => void;
}

export const BattleRewardsDisplay: React.FC<BattleRewardsDisplayProps> = ({
  isWinner,
  rewards,
  levelUp,
  onComplete
}) => {
  const [completedRewards, setCompletedRewards] = useState(0);
  
  const rewardItems: RewardItem[] = [
    {
      type: 'experience',
      amount: rewards.experience,
      icon: '🎯',
      color: '#06b6d4',
      label: 'XP'
    },
    {
      type: 'coins',
      amount: rewards.coins,
      icon: '🪙',
      color: '#f59e0b',
      label: 'Coins'
    },
    {
      type: 'strength',
      amount: rewards.strength,
      icon: '💪',
      color: '#ef4444',
      label: 'Strength'
    },
    {
      type: 'endurance',
      amount: rewards.endurance,
      icon: '🏃',
      color: '#22c55e',
      label: 'Endurance'
    }
  ];

  // Add level up reward if applicable
  if (levelUp?.leveledUp) {
    rewardItems.push({
      type: 'level',
      amount: levelUp.newLevel,
      icon: '⭐',
      color: '#8b5cf6',
      label: `Level ${levelUp.newLevel}`
    });
  }

  const handleRewardComplete = () => {
    const newCompleted = completedRewards + 1;
    setCompletedRewards(newCompleted);
    
    if (newCompleted >= rewardItems.length) {
      setTimeout(onComplete, 500);
    }
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.9)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10001,
      padding: 20
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        borderRadius: 20,
        padding: 32,
        maxWidth: 400,
        width: '100%',
        textAlign: 'center',
        color: 'white'
      }}>
        {/* Header */}
        <div style={{
          fontSize: 48,
          marginBottom: 16,
          animation: 'rewardCelebration 1s ease-out'
        }}>
          {isWinner ? '🎉' : '💪'}
        </div>

        <h2 style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 24,
          color: isWinner ? '#22c55e' : '#f59e0b'
        }}>
          {isWinner ? 'Battle Rewards!' : 'Experience Gained!'}
        </h2>

        {/* Animated Rewards */}
        <div style={{ marginBottom: 24 }}>
          {rewardItems.map((reward, index) => (
            <AnimatedReward
              key={reward.type}
              reward={reward}
              delay={index * 300}
              onComplete={handleRewardComplete}
            />
          ))}
        </div>

        {/* Level Up Special Effect */}
        {levelUp?.leveledUp && completedRewards >= 4 && (
          <div style={{
            background: 'linear-gradient(45deg, #8b5cf6, #06b6d4)',
            borderRadius: 16,
            padding: 20,
            margin: '16px 0',
            animation: 'levelUpGlow 2s ease-in-out infinite'
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🌟</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>
              LEVEL UP!
            </div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>
              You reached Level {levelUp.newLevel}!
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div style={{
          marginTop: 20,
          color: '#9ca3af',
          fontSize: 12
        }}>
          {completedRewards < rewardItems.length ? 
            'Calculating rewards...' : 
            'Tap anywhere to continue'
          }
        </div>

        <style jsx>{`
          @keyframes rewardCelebration {
            0% { transform: scale(0) rotate(0deg); }
            50% { transform: scale(1.2) rotate(180deg); }
            100% { transform: scale(1) rotate(360deg); }
          }

          @keyframes levelUpGlow {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 0 30px rgba(139, 92, 246, 0.8);
              transform: scale(1.02);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

// ============================================================================
// ACHIEVEMENT SYSTEM
// ============================================================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: {
    coins: number;
    experience: number;
  };
}

export const BattleAchievements = {
  FIRST_WIN: {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win your first battle',
    icon: '🏆',
    rarity: 'common' as const,
    maxProgress: 1,
    reward: { coins: 100, experience: 50 }
  },
  
  PERFECT_BATTLE: {
    id: 'perfect_battle',
    title: 'Flawless Victory',
    description: 'Win a battle without taking damage',
    icon: '⭐',
    rarity: 'rare' as const,
    maxProgress: 1,
    reward: { coins: 250, experience: 100 }
  },

  SPEED_DEMON: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Win a battle in under 5 turns',
    icon: '⚡',
    rarity: 'epic' as const,
    maxProgress: 1,
    reward: { coins: 500, experience: 200 }
  },

  WIN_STREAK_5: {
    id: 'win_streak_5',
    title: 'On Fire',
    description: 'Win 5 battles in a row',
    icon: '🔥',
    rarity: 'epic' as const,
    maxProgress: 5,
    reward: { coins: 750, experience: 300 }
  },

  BATTLE_VETERAN: {
    id: 'battle_veteran',
    title: 'Battle Veteran',
    description: 'Complete 100 battles',
    icon: '🎖️',
    rarity: 'legendary' as const,
    maxProgress: 100,
    reward: { coins: 2000, experience: 1000 }
  },

  CRITICAL_MASTER: {
    id: 'critical_master',
    title: 'Critical Master',
    description: 'Land 50 critical hits',
    icon: '💥',
    rarity: 'rare' as const,
    maxProgress: 50,
    reward: { coins: 400, experience: 150 }
  }
};

// ============================================================================
// ACHIEVEMENT CHECKER
// ============================================================================

export class AchievementChecker {
  static checkBattleAchievements(
    battleResult: any,
    playerStats: any,
    battleHistory: any[]
  ): Achievement[] {
    const unlockedAchievements: Achievement[] = [];

    // First Win
    if (battleResult.winner === battleResult.playerId && battleHistory.length === 1) {
      unlockedAchievements.push({
        ...BattleAchievements.FIRST_WIN,
        progress: 1,
        unlocked: true
      });
    }

    // Perfect Battle (no damage taken)
    if (battleResult.winner === battleResult.playerId && 
        battleResult.finalHealth[battleResult.playerId] === 100) {
      unlockedAchievements.push({
        ...BattleAchievements.PERFECT_BATTLE,
        progress: 1,
        unlocked: true
      });
    }

    // Speed Demon (win in under 5 turns)
    if (battleResult.winner === battleResult.playerId && 
        battleResult.totalTurns <= 5) {
      unlockedAchievements.push({
        ...BattleAchievements.SPEED_DEMON,
        progress: 1,
        unlocked: true
      });
    }

    // Win Streak
    const recentWins = this.getRecentWinStreak(battleHistory, battleResult.playerId);
    if (recentWins >= 5) {
      unlockedAchievements.push({
        ...BattleAchievements.WIN_STREAK_5,
        progress: 5,
        unlocked: true
      });
    }

    // Battle Veteran
    if (battleHistory.length >= 100) {
      unlockedAchievements.push({
        ...BattleAchievements.BATTLE_VETERAN,
        progress: 100,
        unlocked: true
      });
    }

    return unlockedAchievements;
  }

  private static getRecentWinStreak(battles: any[], playerId: string): number {
    let streak = 0;
    for (let i = battles.length - 1; i >= 0; i--) {
      if (battles[i].winner === playerId) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}

// ============================================================================
// ACHIEVEMENT NOTIFICATION
// ============================================================================

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const rarityColors = {
    common: '#9ca3af',
    rare: '#06b6d4',
    epic: '#8b5cf6',
    legendary: '#f59e0b'
  };

  const rarityGlow = {
    common: 'none',
    rare: '0 0 20px rgba(6, 182, 212, 0.5)',
    epic: '0 0 20px rgba(139, 92, 246, 0.5)',
    legendary: '0 0 30px rgba(245, 158, 11, 0.8)'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      border: `2px solid ${rarityColors[achievement.rarity]}`,
      borderRadius: 16,
      padding: 20,
      maxWidth: 300,
      color: 'white',
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.3s ease-out',
      zIndex: 10002,
      boxShadow: rarityGlow[achievement.rarity]
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <div style={{
          fontSize: 32,
          marginRight: 12,
          animation: 'achievementBounce 1s ease-out'
        }}>
          {achievement.icon}
        </div>
        <div>
          <div style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: rarityColors[achievement.rarity],
            textTransform: 'uppercase',
            letterSpacing: 1
          }}>
            Achievement Unlocked!
          </div>
          <div style={{
            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 2
          }}>
            {achievement.title}
          </div>
        </div>
      </div>

      <p style={{
        fontSize: 12,
        color: '#d1d5db',
        margin: '0 0 12px 0',
        lineHeight: 1.4
      }}>
        {achievement.description}
      </p>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 11,
        color: '#9ca3af'
      }}>
        <span>+{achievement.reward.coins} coins</span>
        <span>+{achievement.reward.experience} XP</span>
      </div>

      <style jsx>{`
        @keyframes achievementBounce {
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
  );
};

// ============================================================================
// STATS PROGRESSION TRACKER
// ============================================================================

interface StatsProgressionProps {
  oldStats: {
    strength: number;
    endurance: number;
    level: number;
    experience: number;
  };
  newStats: {
    strength: number;
    endurance: number;
    level: number;
    experience: number;
  };
  isVisible: boolean;
}

export const StatsProgression: React.FC<StatsProgressionProps> = ({
  oldStats,
  newStats,
  isVisible
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const phases = [
        () => setAnimationPhase(1), // Show old stats
        () => setAnimationPhase(2), // Show progression
        () => setAnimationPhase(3)  // Show new stats
      ];

      phases.forEach((phase, index) => {
        setTimeout(phase, index * 1000);
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const StatBar = ({ 
    label, 
    oldValue, 
    newValue, 
    color, 
    icon 
  }: { 
    label: string; 
    oldValue: number; 
    newValue: number; 
    color: string; 
    icon: string; 
  }) => {
    const difference = newValue - oldValue;
    const displayValue = animationPhase >= 3 ? newValue : oldValue;

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 20, marginRight: 12 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4
          }}>
            <span style={{ fontSize: 14, color: '#d1d5db' }}>{label}</span>
            <span style={{ 
              fontSize: 14, 
              fontWeight: 'bold',
              color: animationPhase >= 2 && difference > 0 ? '#22c55e' : 'white'
            }}>
              {displayValue}
              {animationPhase >= 2 && difference > 0 && (
                <span style={{ 
                  color: '#22c55e',
                  marginLeft: 8,
                  animation: 'statIncrease 0.5s ease-out'
                }}>
                  +{difference}
                </span>
              )}
            </span>
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            height: 6,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(displayValue, 100)}%`,
              height: '100%',
              background: color,
              transition: 'width 1s ease-out'
            }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: 16,
      padding: 20,
      margin: '20px 0'
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#06b6d4',
        textAlign: 'center'
      }}>
        📊 Stats Progression
      </h3>

      <StatBar
        label="Strength"
        oldValue={oldStats.strength}
        newValue={newStats.strength}
        color="#ef4444"
        icon="💪"
      />

      <StatBar
        label="Endurance"
        oldValue={oldStats.endurance}
        newValue={newStats.endurance}
        color="#22c55e"
        icon="🏃"
      />

      <StatBar
        label="Level"
        oldValue={oldStats.level}
        newValue={newStats.level}
        color="#8b5cf6"
        icon="⭐"
      />

      <style jsx>{`
        @keyframes statIncrease {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};