// src/components/battle/AdvancedAIBattle.tsx
import React, { useState, useEffect } from 'react';
import dataService from '../services/DataService';

// ============================================================================
// AI PERSONALITY & FIGHTING STYLES
// ============================================================================

interface AIPersonality {
  name: string;
  description: string;
  fightingStyle: 'aggressive' | 'defensive' | 'balanced' | 'unpredictable' | 'strategic';
  preferences: {
    punch: number;    // Probability weights (0-100)
    kick: number;
    special: number;
    block: number;
  };
  traits: {
    riskTaking: number;      // 0-100 (how likely to use risky moves)
    patience: number;        // 0-100 (how likely to wait/defend)
    aggression: number;      // 0-100 (how likely to attack vs defend)
    intelligence: number;    // 0-100 (how well they adapt to player)
    consistency: number;     // 0-100 (how predictable they are)
  };
  tactics: {
    lowHealthBehavior: 'desperate' | 'defensive' | 'calculated';
    energyManagement: 'wasteful' | 'conservative' | 'efficient';
    counterAttack: number;   // 0-100 chance to counter after being hit
    comboChance: number;     // 0-100 chance to chain attacks
  };
}

const AI_PERSONALITIES: AIPersonality[] = [
  {
    name: "Berserker",
    description: "Aggressive fighter who never backs down",
    fightingStyle: 'aggressive',
    preferences: { punch: 40, kick: 35, special: 20, block: 5 },
    traits: { riskTaking: 90, patience: 20, aggression: 95, intelligence: 60, consistency: 80 },
    tactics: { 
      lowHealthBehavior: 'desperate', 
      energyManagement: 'wasteful', 
      counterAttack: 70, 
      comboChance: 60 
    }
  },
  {
    name: "Guardian",
    description: "Defensive specialist who waits for openings",
    fightingStyle: 'defensive',
    preferences: { punch: 25, kick: 20, special: 15, block: 40 },
    traits: { riskTaking: 30, patience: 85, aggression: 40, intelligence: 80, consistency: 90 },
    tactics: { 
      lowHealthBehavior: 'defensive', 
      energyManagement: 'conservative', 
      counterAttack: 85, 
      comboChance: 30 
    }
  },
  {
    name: "Tactician",
    description: "Smart fighter who adapts to your playstyle",
    fightingStyle: 'strategic',
    preferences: { punch: 30, kick: 30, special: 25, block: 15 },
    traits: { riskTaking: 50, patience: 70, aggression: 60, intelligence: 95, intelligence: 40 },
    tactics: { 
      lowHealthBehavior: 'calculated', 
      energyManagement: 'efficient', 
      counterAttack: 75, 
      comboChance: 50 
    }
  },
  {
    name: "Wildcard",
    description: "Unpredictable fighter with random tactics",
    fightingStyle: 'unpredictable',
    preferences: { punch: 35, kick: 30, special: 25, block: 10 },
    traits: { riskTaking: 75, patience: 45, aggression: 70, intelligence: 65, consistency: 20 },
    tactics: { 
      lowHealthBehavior: 'desperate', 
      energyManagement: 'wasteful', 
      counterAttack: 60, 
      comboChance: 80 
    }
  },
  {
    name: "Balanced Fighter",
    description: "Well-rounded opponent with no major weaknesses",
    fightingStyle: 'balanced',
    preferences: { punch: 35, kick: 30, special: 20, block: 15 },
    traits: { riskTaking: 55, patience: 60, aggression: 65, intelligence: 70, consistency: 70 },
    tactics: { 
      lowHealthBehavior: 'calculated', 
      energyManagement: 'efficient', 
      counterAttack: 55, 
      comboChance: 45 
    }
  },
  {
    name: "Power House",
    description: "High damage dealer who focuses on special moves",
    fightingStyle: 'aggressive',
    preferences: { punch: 20, kick: 25, special: 45, block: 10 },
    traits: { riskTaking: 80, patience: 40, aggression: 85, intelligence: 55, consistency: 75 },
    tactics: { 
      lowHealthBehavior: 'desperate', 
      energyManagement: 'wasteful', 
      counterAttack: 50, 
      comboChance: 70 
    }
  }
];

// ============================================================================
// ENHANCED AI OPPONENT GENERATOR
// ============================================================================

export const generateAdvancedAIOpponent = (
  playerLevel: number, 
  difficulty: 'easy' | 'medium' | 'hard' | 'random' = 'random'
) => {
  const bodyTypes = [
    'fit-male', 'fit-female', 'skinny-male', 'skinny-female', 
    'overweight-male', 'overweight-female', 'obese-male', 'obese-female'
  ];

  // Select random personality
  const personality = AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)];

  // Generate random level (±3 levels from player, but with some variety)
  let aiLevel: number;
  if (difficulty === 'random') {
    aiLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 7) - 3); // ±3 levels
  } else {
    const levelMods = { easy: -2, medium: 0, hard: 3 };
    aiLevel = Math.max(1, playerLevel + levelMods[difficulty] + Math.floor(Math.random() * 3) - 1);
  }

  // Generate random stats based on level with personality influence
  const baseStats = aiLevel * 8 + 20; // Base stats for this level
  const statVariation = Math.random() * 30 - 15; // ±15 variation

  // Personality affects stat distribution
  const strengthBias = personality.traits.aggression / 100 * 20 - 10; // ±10 based on aggression
  const enduranceBias = personality.traits.patience / 100 * 20 - 10;   // ±10 based on patience

  const aiStrength = Math.max(20, Math.round(baseStats + statVariation + strengthBias));
  const aiEndurance = Math.max(20, Math.round(baseStats + statVariation + enduranceBias));

  // Random body type
  const bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];

  return {
    id: `ai_${Date.now()}`,
    name: personality.name,
    description: personality.description,
    bodyType,
    telegramUser: {
      id: 999999 + Math.floor(Math.random() * 1000),
      first_name: personality.name
    },
    stats: {
      strength: aiStrength,
      endurance: aiEndurance,
      level: aiLevel,
      experience: aiLevel * aiLevel * 100
    },
    personality,
    isAI: true,
    difficulty: difficulty === 'random' ? 'random' : difficulty,
    
    // AI state tracking for adaptive behavior
    aiState: {
      turnCount: 0,
      playerPatterns: {
        punchCount: 0,
        kickCount: 0,
        specialCount: 0,
        blockCount: 0
      },
      lastPlayerActions: [],
      adaptationLevel: 0,
      currentStrategy: 'normal'
    }
  };
};

// ============================================================================
// AI DECISION MAKING ENGINE
// ============================================================================

export class AIBattleEngine {
  static decideAIAction(
    aiOpponent: any,
    playerHealth: number,
    aiHealth: number,
    aiEnergy: number,
    turnCount: number,
    lastPlayerAction?: string
  ): 'punch' | 'kick' | 'special' | 'block' {
    const personality = aiOpponent.personality;
    const aiState = aiOpponent.aiState;

    // Update AI state
    aiState.turnCount = turnCount;
    if (lastPlayerAction) {
      aiState.lastPlayerActions.push(lastPlayerAction);
      if (aiState.lastPlayerActions.length > 5) {
        aiState.lastPlayerActions.shift(); // Keep only last 5 actions
      }
      aiState.playerPatterns[`${lastPlayerAction}Count`]++;
    }

    // Calculate situation modifiers
    const healthRatio = aiHealth / 100;
    const energyRatio = aiEnergy / 100;
    const playerHealthRatio = playerHealth / 100;

    // Base action weights from personality
    let weights = { ...personality.preferences };

    // Modify weights based on health
    if (healthRatio < 0.3) {
      // Low health behavior
      switch (personality.tactics.lowHealthBehavior) {
        case 'desperate':
          weights.special *= 2;
          weights.punch *= 1.5;
          weights.block *= 0.5;
          break;
        case 'defensive':
          weights.block *= 3;
          weights.punch *= 0.5;
          weights.kick *= 0.5;
          break;
        case 'calculated':
          if (playerHealthRatio < healthRatio) {
            weights.special *= 1.5; // Go for the kill
          } else {
            weights.block *= 2; // Play safe
          }
          break;
      }
    }

    // Energy management
    if (energyRatio < 0.4) {
      switch (personality.tactics.energyManagement) {
        case 'wasteful':
          // Still tries expensive moves even when low on energy
          break;
        case 'conservative':
          weights.special *= 0.3;
          weights.kick *= 0.7;
          weights.block *= 1.5;
          break;
        case 'efficient':
          weights.special *= 0.6;
          weights.punch *= 1.2;
          break;
      }
    }

    // Counter-attack logic
    if (lastPlayerAction && lastPlayerAction !== 'block') {
      const counterChance = personality.tactics.counterAttack;
      if (Math.random() * 100 < counterChance) {
        // Choose aggressive response
        weights.punch *= 1.5;
        weights.kick *= 1.3;
        weights.special *= 1.2;
        weights.block *= 0.5;
      }
    }

    // Adaptive intelligence - learn from player patterns
    if (personality.traits.intelligence > 50 && aiState.turnCount > 3) {
      const totalActions = Object.values(aiState.playerPatterns).reduce((a, b) => a + b, 0);
      if (totalActions > 0) {
        // If player uses special a lot, AI blocks more
        const playerSpecialRatio = aiState.playerPatterns.specialCount / totalActions;
        if (playerSpecialRatio > 0.4) {
          weights.block *= 1.8;
        }

        // If player blocks a lot, AI uses more specials to break through
        const playerBlockRatio = aiState.playerPatterns.blockCount / totalActions;
        if (playerBlockRatio > 0.3) {
          weights.special *= 1.6;
          weights.kick *= 1.3;
        }

        // If player is very aggressive, AI becomes more defensive
        const playerAggressionRatio = (aiState.playerPatterns.punchCount + aiState.playerPatterns.kickCount) / totalActions;
        if (playerAggressionRatio > 0.6) {
          weights.block *= 1.4;
        }
      }
    }

    // Unpredictability factor
    const unpredictabilityFactor = (100 - personality.traits.consistency) / 100;
    if (Math.random() < unpredictabilityFactor) {
      // Add random chaos to weights
      Object.keys(weights).forEach(action => {
        weights[action] *= (0.5 + Math.random()); // Random multiplier 0.5-1.5
      });
    }

    // Combo chance - if AI just attacked, might chain another attack
    if (aiState.lastAIAction && aiState.lastAIAction !== 'block') {
      const comboChance = personality.tactics.comboChance;
      if (Math.random() * 100 < comboChance) {
        weights.punch *= 1.5;
        weights.kick *= 1.4;
        weights.special *= 1.2;
      }
    }

    // Energy requirements check
    if (aiEnergy < 25) weights.special = 0;  // Can't use special
    if (aiEnergy < 15) weights.kick *= 0.5;  // Prefer punch over kick
    if (aiEnergy < 10) weights.kick = 0;     // Can't use kick

    // Normalize weights and choose action
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    if (totalWeight === 0) return 'punch'; // Fallback

    const normalizedWeights = Object.fromEntries(
      Object.entries(weights).map(([action, weight]) => [action, weight / totalWeight])
    );

    // Weighted random selection
    const random = Math.random();
    let cumulative = 0;
    
    for (const [action, weight] of Object.entries(normalizedWeights)) {
      cumulative += weight;
      if (random <= cumulative) {
        aiState.lastAIAction = action;
        return action as 'punch' | 'kick' | 'special' | 'block';
      }
    }

    return 'punch'; // Fallback
  }

  // Generate AI taunt/comment based on battle situation
  static generateAIComment(
    aiOpponent: any,
    situation: 'battle_start' | 'player_hit' | 'ai_hit' | 'low_health' | 'victory' | 'defeat',
    damage?: number
  ): string {
    const personality = aiOpponent.personality;
    const comments = {
      battle_start: {
        aggressive: ["Let's dance!", "Time to crush you!", "Bring it on!"],
        defensive: ["Show me what you've got.", "I'm ready for you.", "Let's see your moves."],
        balanced: ["May the best fighter win!", "Good luck!", "Let's have a good fight!"],
        unpredictable: ["This should be fun!", "Chaos time!", "Ready for surprises?"],
        strategic: ["I've studied your moves.", "Let's test your strategy.", "Time to adapt."]
      },
      player_hit: {
        aggressive: ["Is that all?!", "I barely felt that!", "My turn!"],
        defensive: ["Nice hit, but I'm still standing!", "You'll have to do better!", "Impressive."],
        balanced: ["Good move!", "Well played!", "Nice technique!"],
        unpredictable: ["Ouch! That was unexpected!", "Fun! Do it again!", "Interesting choice!"],
        strategic: ["I see your pattern.", "Calculating countermeasures...", "Data updated."]
      },
      ai_hit: {
        aggressive: ["Take that!", "Feel my power!", "Boom!"],
        defensive: ["Perfect counter!", "Opening exploited!", "Defensive mastery!"],
        balanced: ["Clean hit!", "Well executed!", "Good timing!"],
        unpredictable: ["Surprise!", "Random success!", "Chaos prevails!"],
        strategic: ["Calculated strike.", "As predicted.", "Optimal outcome."]
      },
      low_health: {
        aggressive: ["I'm not done yet!", "You haven't won!", "Rage mode activated!"],
        defensive: ["Time to be careful...", "Defense is key now.", "Must preserve health."],
        balanced: ["This is getting intense!", "Close fight!", "Anyone's game!"],
        unpredictable: ["Plot twist incoming!", "Now it gets interesting!", "Chaos mode!"],
        strategic: ["Adjusting strategy...", "New parameters needed.", "Adapting to situation."]
      }
    };

    const styleComments = comments[situation]?.[personality.fightingStyle] || ["..."];
    return styleComments[Math.floor(Math.random() * styleComments.length)];
  }
}

// ============================================================================
// ADVANCED AI BATTLE COMPONENT
// ============================================================================

interface AdvancedAIBattleProps {
  userProfile: any;
  onBattleEnd: (result: any) => void;
  onBack: () => void;
}

export const AdvancedAIBattle: React.FC<AdvancedAIBattleProps> = ({ 
  userProfile, 
  onBattleEnd, 
  onBack 
}) => {
  const [aiOpponent, setAiOpponent] = useState(() => 
    generateAdvancedAIOpponent(userProfile?.stats?.level || 1, 'random')
  );
  const [battleStarted, setBattleStarted] = useState(false);
  const [showPersonality, setShowPersonality] = useState(false);

  const regenerateOpponent = () => {
    setAiOpponent(generateAdvancedAIOpponent(userProfile?.stats?.level || 1, 'random'));
  };

  if (battleStarted) {
    // Pass the AI opponent to your enhanced battle system
    return (
      <div>
        {/* This would integrate with your enhanced BattleGameEngine */}
        <p>Battle would start here with AI: {aiOpponent.name}</p>
        <button onClick={() => setBattleStarted(false)}>Back to AI Selection</button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
      color: 'white',
      padding: 24
    }}>
      <button onClick={onBack} style={{ /* back button styles */ }}>
        ← Back to Dashboard
      </button>

      <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8
        }}>
          🤖 Advanced AI Training
        </h1>

        {/* AI Opponent Card */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 24
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            <div style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32
            }}>
              🤖
            </div>
            <div style={{ textAlign: 'left', flex: 1 }}>
              <h3 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                {aiOpponent.name}
              </h3>
              <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8 }}>
                {aiOpponent.description}
              </p>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span>Level {aiOpponent.stats.level}</span>
                <span>STR: {aiOpponent.stats.strength}</span>
                <span>END: {aiOpponent.stats.endurance}</span>
                <span>{aiOpponent.bodyType.replace('-', ' ').toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Fighting Style Indicator */}
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16
          }}>
            <div style={{ fontSize: 14, color: '#06b6d4', marginBottom: 4 }}>
              Fighting Style: {aiOpponent.personality.fightingStyle.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: '#d1d5db' }}>
              {aiOpponent.description}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => setBattleStarted(true)}
              style={{
                background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ⚔️ FIGHT {aiOpponent.name.toUpperCase()}
            </button>

            <button
              onClick={regenerateOpponent}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 16,
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🎲 Random Opponent
            </button>

            <button
              onClick={() => setShowPersonality(!showPersonality)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 12,
                padding: '12px 24px',
                fontSize: 16,
                color: 'white',
                cursor: 'pointer'
              }}
            >
              📊 {showPersonality ? 'Hide' : 'Show'} Details
            </button>
          </div>
        </div>

        {/* Personality Details */}
        {showPersonality && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'left',
            fontSize: 12
          }}>
            <h4 style={{ color: '#06b6d4', marginBottom: 12 }}>AI Personality Profile:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <strong>Combat Preferences:</strong>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li>Punch: {aiOpponent.personality.preferences.punch}%</li>
                  <li>Kick: {aiOpponent.personality.preferences.kick}%</li>
                  <li>Special: {aiOpponent.personality.preferences.special}%</li>
                  <li>Block: {aiOpponent.personality.preferences.block}%</li>
                </ul>
              </div>
              <div>
                <strong>Traits:</strong>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li>Risk Taking: {aiOpponent.personality.traits.riskTaking}/100</li>
                  <li>Patience: {aiOpponent.personality.traits.patience}/100</li>
                  <li>Aggression: {aiOpponent.personality.traits.aggression}/100</li>
                  <li>Intelligence: {aiOpponent.personality.traits.intelligence}/100</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};