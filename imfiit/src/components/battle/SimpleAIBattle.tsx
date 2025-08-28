// src/components/battle/SimpleAIBattle.tsx
import React, { useState, useEffect, useCallback } from 'react';
import BattleGameEngine from '../fitness/BattleGameEngine';
import dataService from '../services/DataService';

// ============================================================================
// AI PERSONALITY TYPES
// ============================================================================

interface AIPersonality {
  name: string;
  description: string;
  fightingStyle: 'aggressive' | 'defensive' | 'balanced' | 'unpredictable' | 'strategic';
  traits: {
    aggression: number;      // 0-100
    defense: number;         // 0-100  
    intelligence: number;    // 0-100
    adaptability: number;    // 0-100
    endurance: number;       // 0-100
  };
  preferences: {
    favoriteAttack: 'punch' | 'kick' | 'special';
    riskTolerance: 'low' | 'medium' | 'high';
    combatTempo: 'slow' | 'medium' | 'fast';
  };
}

interface AIOpponent {
  id: string;
  name: string;
  bodyType: string;
  level: number;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  stats: {
    strength: number;
    endurance: number;
    level: number;
  };
  personality: AIPersonality;
  description: string;
  rewards: {
    experience: number;
    coins: number;
  };
  aiState?: {
    lastPlayerActions: string[];
    playerPatterns: Record<string, number>;
    adaptationLevel: number;
    currentStrategy: string;
  };
}

// ============================================================================
// AI PERSONALITY DEFINITIONS
// ============================================================================

const AI_PERSONALITIES: AIPersonality[] = [
  {
    name: "Berserker",
    description: "A relentless fighter who never backs down from a challenge",
    fightingStyle: 'aggressive',
    traits: { aggression: 90, defense: 30, intelligence: 50, adaptability: 40, endurance: 80 },
    preferences: { favoriteAttack: 'punch', riskTolerance: 'high', combatTempo: 'fast' }
  },
  {
    name: "Guardian",
    description: "A defensive master who waits for the perfect counter-attack",
    fightingStyle: 'defensive',
    traits: { aggression: 30, defense: 95, intelligence: 80, adaptability: 85, endurance: 90 },
    preferences: { favoriteAttack: 'kick', riskTolerance: 'low', combatTempo: 'slow' }
  },
  {
    name: "Tactician",
    description: "A balanced fighter with strategic combat awareness",
    fightingStyle: 'balanced',
    traits: { aggression: 65, defense: 70, intelligence: 90, adaptability: 80, endurance: 75 },
    preferences: { favoriteAttack: 'kick', riskTolerance: 'medium', combatTempo: 'medium' }
  },
  {
    name: "Wildcard",
    description: "An unpredictable opponent who keeps you guessing",
    fightingStyle: 'unpredictable',
    traits: { aggression: 70, defense: 50, intelligence: 60, adaptability: 95, endurance: 70 },
    preferences: { favoriteAttack: 'special', riskTolerance: 'high', combatTempo: 'fast' }
  },
  {
    name: "Mastermind", 
    description: "A calculated fighter who analyzes every move",
    fightingStyle: 'strategic',
    traits: { aggression: 50, defense: 75, intelligence: 100, adaptability: 90, endurance: 85 },
    preferences: { favoriteAttack: 'special', riskTolerance: 'medium', combatTempo: 'slow' }
  }
];

const BODY_TYPES = [
  'fit-male', 'fit-female', 'skinny-male', 'skinny-female',
  'overweight-male', 'overweight-female', 'obese-male', 'obese-female'
];

// ============================================================================
// AI OPPONENT GENERATOR
// ============================================================================

export const generateAIOpponent = (
  playerLevel: number, 
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Random' = 'Random'
): AIOpponent => {
  // Select personality
  const personality = AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];
  
  // Calculate level based on difficulty
  let aiLevel: number;
  if (difficulty === 'Random') {
    aiLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 7) - 3); // ±3 levels
  } else {
    const levelMods = { Easy: -2, Medium: 0, Hard: 2, Expert: 4 };
    aiLevel = Math.max(1, playerLevel + levelMods[difficulty]);
  }

  // Generate stats based on level and personality
  const baseStats = aiLevel * 8 + 20;
  const variation = Math.random() * 20 - 10; // ±10 variation
  
  // Personality influences stats
  const strengthBonus = (personality.traits.aggression - 50) / 5; // ±10 based on aggression
  const enduranceBonus = (personality.traits.endurance - 50) / 5; // ±10 based on endurance
  
  const finalStrength = Math.max(20, Math.round(baseStats + variation + strengthBonus));
  const finalEndurance = Math.max(20, Math.round(baseStats + variation + enduranceBonus));

  // Random body type
  const bodyType = BODY_TYPES[Math.floor(Math.random() * BODY_TYPES.length)];

  // Calculate rewards based on difficulty
  const rewardMultiplier = { Easy: 0.7, Medium: 1.0, Hard: 1.3, Expert: 1.6, Random: 1.0 }[difficulty];
  
  return {
    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: personality.name,
    bodyType,
    level: aiLevel,
    difficulty: difficulty === 'Random' ? ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as any : difficulty,
    stats: {
      strength: finalStrength,
      endurance: finalEndurance,
      level: aiLevel
    },
    personality,
    description: personality.description,
    rewards: {
      experience: Math.round(aiLevel * 15 * rewardMultiplier),
      coins: Math.round(aiLevel * 10 * rewardMultiplier)
    },
    aiState: {
      lastPlayerActions: [],
      playerPatterns: { punch: 0, kick: 0, special: 0 },
      adaptationLevel: 0,
      currentStrategy: 'normal'
    }
  };
};

// ============================================================================
// MAIN AI BATTLE COMPONENT
// ============================================================================

interface SimpleAIBattleProps {
  userProfile: any;
  onBattleEnd: (result: any) => void;
  onBack: () => void;
}

const SimpleAIBattle: React.FC<SimpleAIBattleProps> = ({ 
  userProfile, 
  onBattleEnd, 
  onBack 
}) => {
  const [aiOpponent, setAiOpponent] = useState<AIOpponent | null>(null);
  const [battleStarted, setBattleStarted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert' | 'Random'>('Random');

  // Generate initial opponent
  useEffect(() => {
    if (userProfile?.stats?.level) {
      const opponent = generateAIOpponent(userProfile.stats.level, selectedDifficulty);
      setAiOpponent(opponent);
    }
  }, [userProfile?.stats?.level, selectedDifficulty]);

  const regenerateOpponent = useCallback(() => {
    if (userProfile?.stats?.level) {
      const opponent = generateAIOpponent(userProfile.stats.level, selectedDifficulty);
      setAiOpponent(opponent);
    }
  }, [userProfile?.stats?.level, selectedDifficulty]);

  const handleBattleStart = useCallback(() => {
    if (aiOpponent) {
      setBattleStarted(true);
    }
  }, [aiOpponent]);

  const handleBattleEnd = useCallback((result: any) => {
    setBattleStarted(false);
    onBattleEnd(result);
  }, [onBattleEnd]);

  const handleBackFromBattle = useCallback(() => {
    setBattleStarted(false);
  }, []);

  // If battle is active, show the battle engine
  if (battleStarted && aiOpponent) {
    return (
      <BattleGameEngine
        userProfile={userProfile}
        aiOpponent={aiOpponent}
        onBattleEnd={handleBattleEnd}
        onBack={handleBackFromBattle}
      />
    );
  }

  // Show loading if no opponent yet
  if (!aiOpponent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
          <div>Generating AI Opponent...</div>
        </div>
      </div>
    );
  }

  // Main AI opponent selection screen
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
      color: 'white',
      padding: 24
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button 
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#06b6d4',
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 20
          }}
        >
          ← Back to Dashboard
        </button>
        
        <h1 style={{
          fontSize: 32,
          fontWeight: 'bold',
          textAlign: 'center',
          background: 'linear-gradient(to right, #ef4444, #dc2626)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: 8
        }}>
          🤖 AI Training Battle
        </h1>
        
        <p style={{ 
          textAlign: 'center', 
          color: '#d1d5db', 
          fontSize: 16 
        }}>
          Face intelligent AI opponents to sharpen your skills
        </p>
      </div>

      {/* Difficulty Selection */}
      <div style={{
        maxWidth: 800,
        margin: '0 auto 32px auto',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          marginBottom: 16, 
          color: '#06b6d4' 
        }}>
          🎯 Select Difficulty
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12
        }}>
          {(['Easy', 'Medium', 'Hard', 'Expert', 'Random'] as const).map(diff => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: selectedDifficulty === diff ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.2)',
                background: selectedDifficulty === diff ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: 14,
                fontWeight: selectedDifficulty === diff ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* AI Opponent Card */}
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        padding: 32,
        border: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center'
      }}>
        {/* Opponent Avatar & Info */}
        <div style={{
          background: 'linear-gradient(145deg, rgba(239,68,68,0.2), rgba(220,38,38,0.2))',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: '2px solid rgba(239,68,68,0.3)'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🤖</div>
          
          <h2 style={{
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 8,
            color: '#ef4444'
          }}>
            {aiOpponent.name}
          </h2>
          
          <div style={{
            display: 'inline-block',
            background: 'rgba(239,68,68,0.3)',
            padding: '4px 12px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#ef4444',
            marginBottom: 16
          }}>
            {aiOpponent.difficulty} • Level {aiOpponent.level}
          </div>
          
          <p style={{
            fontSize: 16,
            color: '#d1d5db',
            lineHeight: 1.5,
            maxWidth: 400,
            margin: '0 auto'
          }}>
            {aiOpponent.description}
          </p>
        </div>

        {/* Stats Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24
        }}>
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.3)'
          }}>
            <div style={{ fontSize: 12, color: '#ef4444', marginBottom: 4 }}>STRENGTH</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{aiOpponent.stats.strength}</div>
          </div>
          
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(34,197,94,0.3)'
          }}>
            <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 4 }}>ENDURANCE</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{aiOpponent.stats.endurance}</div>
          </div>
          
          <div style={{
            background: 'rgba(168,85,247,0.1)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid rgba(168,85,247,0.3)'
          }}>
            <div style={{ fontSize: 12, color: '#a855f7', marginBottom: 4 }}>LEVEL</div>
            <div style={{ fontSize: 20, fontWeight: 'bold' }}>{aiOpponent.level}</div>
          </div>
        </div>

        {/* Fighting Style */}
        <div style={{
          background: 'rgba(6,182,212,0.1)',
          padding: 16,
          borderRadius: 12,
          border: '1px solid rgba(6,182,212,0.3)',
          marginBottom: 24
        }}>
          <div style={{ fontSize: 12, color: '#06b6d4', marginBottom: 4 }}>
            FIGHTING STYLE
          </div>
          <div style={{ fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }}>
            {aiOpponent.personality.fightingStyle}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 16
        }}>
          <button
            onClick={handleBattleStart}
            style={{
              background: 'linear-gradient(45deg, #ef4444, #dc2626)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(239,68,68,0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ⚔️ START BATTLE
          </button>

          <button
            onClick={regenerateOpponent}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
            }}
          >
            🎲 NEW OPPONENT
          </button>

          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'rgba(6,182,212,0.1)',
              color: '#06b6d4',
              border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📊 {showDetails ? 'HIDE' : 'DETAILS'}
          </button>
        </div>

        {/* Rewards Preview */}
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          padding: 16,
          borderRadius: 12,
          border: '1px solid rgba(34,197,94,0.3)',
          marginTop: 16
        }}>
          <div style={{ fontSize: 12, color: '#22c55e', marginBottom: 8 }}>
            🏆 VICTORY REWARDS
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            <div>
              <span style={{ color: '#22c55e' }}>+{aiOpponent.rewards.experience}</span>
              <span style={{ color: '#d1d5db', fontSize: 12 }}> XP</span>
            </div>
            <div>
              <span style={{ color: '#fbbf24' }}>+{aiOpponent.rewards.coins}</span>
              <span style={{ color: '#d1d5db', fontSize: 12 }}> Coins</span>
            </div>
          </div>
        </div>

        {/* Detailed Stats (Expandable) */}
        {showDetails && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 20,
            marginTop: 16,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h4 style={{ 
              fontSize: 16, 
              fontWeight: 'bold', 
              marginBottom: 16,
              color: '#06b6d4'
            }}>
              🧠 AI Personality Traits
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 12
            }}>
              {Object.entries(aiOpponent.personality.traits).map(([trait, value]) => (
                <div key={trait} style={{
                  background: 'rgba(255,255,255,0.05)',
                  padding: 12,
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#d1d5db', 
                    textTransform: 'uppercase',
                    marginBottom: 4
                  }}>
                    {trait}
                  </div>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    color: value > 70 ? '#ef4444' : value > 40 ? '#fbbf24' : '#22c55e'
                  }}>
                    {value}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAIBattle;