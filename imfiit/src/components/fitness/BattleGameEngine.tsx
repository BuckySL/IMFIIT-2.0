// BattleGameEngine.tsx - Fixed Version
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CharacterSprite, BattleBackground } from './FitnessComponents';
import dataService from '../services/DataService'; // ← added

/* ========================================================================== */
/*                                GAME TYPES                                  */
/* ========================================================================== */

interface Fighter {
  id: string;
  name: string;
  bodyType: string;
  stats: {
    strength: number;
    endurance: number;
    level: number;
  };
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  position: 'left' | 'right';
}

interface GameState {
  status: 'waiting' | 'fighting' | 'finished';
  currentTurn: 'player' | 'opponent';
  winner?: 'player' | 'opponent';
  turnTimeLeft: number;
  combatLog: string[];
  turnCount?: number;
  startTime?: number;
}

interface Attack {
  type: 'punch' | 'kick' | 'special';
  damage: number;
  energyCost: number;
  animation: string;
  hitChance: number;
}

/* ========================================================================== */
/*                            BATTLE GAME ENGINE                              */
/* ========================================================================== */

interface BattleGameProps {
  userProfile: any;
  aiOpponent?: any; // AI opponent data
  onBattleEnd?: (result: any) => void;
  onBack?: () => void;
}

const BattleGameEngine: React.FC<BattleGameProps> = ({ 
  userProfile, 
  aiOpponent, 
  onBattleEnd,
  onBack 
}) => {
  // Fighter setup
  const [player, setPlayer] = useState<Fighter>(() => ({
    id: 'player',
    name: userProfile?.telegramUser?.first_name || 'Player',
    bodyType: userProfile?.bodyType || 'fit-male',
    stats: {
      strength: userProfile?.stats?.strength || 50,
      endurance: userProfile?.stats?.endurance || 50,
      level: userProfile?.stats?.level || 1
    },
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    position: 'left'
  }));

  // FIXED: Single opponent state declaration
  const [opponent, setOpponent] = useState<Fighter>(() => {
    // If AI opponent is provided, use it
    if (aiOpponent) {
      return {
        id: aiOpponent.id || 'ai_opponent',
        name: aiOpponent.name || 'AI Fighter',
        bodyType: aiOpponent.bodyType || 'fit-male',
        stats: {
          strength: aiOpponent.stats?.strength || 50,
          endurance: aiOpponent.stats?.endurance || 50,
          level: aiOpponent.stats?.level || 1
        },
        health: 100,
        maxHealth: 100,
        energy: 100,
        maxEnergy: 100,
        position: 'right'
      };
    }

    // Fallback for non-AI opponents
    const baseStats = Math.max(30, userProfile?.stats?.level * 8 || 40);
    const variation = Math.random() * 20 - 10;
    
    return {
      id: 'opponent',
      name: 'Shadow Fighter',
      bodyType: 'fit-male',
      stats: {
        strength: Math.round(baseStats + variation),
        endurance: Math.round(baseStats + variation),
        level: Math.max(1, (userProfile?.stats?.level || 1) + Math.floor(Math.random() * 3) - 1)
      },
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      position: 'right'
    };
  });

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    status: 'waiting',
    currentTurn: 'player',
    turnTimeLeft: 10,
    combatLog: [],
    turnCount: 0,
    startTime: Date.now()
  });

  const initializePlayer = (userProfile) => {
  // Base stats from fitness tracking
  const fitnessBonus = {
    strength: Math.floor((userProfile.stats.strength - 50) / 10), // Every 10 strength = +1 battle power
    endurance: Math.floor((userProfile.stats.endurance - 50) / 5), // Every 5 endurance = +1 energy regen
  };

  return {
    health: 100,
    maxHealth: 100,
    energy: 100 + fitnessBonus.endurance, // Endurance affects energy
    maxEnergy: 100 + fitnessBonus.endurance,
    stats: {
      level: userProfile.stats.level,
      strength: userProfile.stats.strength,
      endurance: userProfile.stats.endurance,
      // Battle stats influenced by fitness
      attackPower: 20 + fitnessBonus.strength,
      defense: 15 + Math.floor(fitnessBonus.strength / 2),
      speed: 10 + Math.floor(fitnessBonus.endurance / 3)
    }
  };
};

  // Animation states
  const [playerAnimation, setPlayerAnimation] = useState<string>('idle');
  const [opponentAnimation, setOpponentAnimation] = useState<string>('idle');
  const [isAnimating, setIsAnimating] = useState(false);

  // Special effects
  const [damageEffect, setDamageEffect] = useState<{ target: 'player' | 'opponent', damage: number } | null>(null);
  const [shakeEffect, setShakeEffect] = useState<'player' | 'opponent' | null>(null);

  /* ========================================================================== */
  /*                               ATTACK SYSTEM                                */
  /* ========================================================================== */

  const attacks = useMemo<Record<string, Attack>>(() => ({
    punch: {
      type: 'punch',
      damage: 15,
      energyCost: 10,
      animation: 'punch',
      hitChance: 0.85
    },
    kick: {
      type: 'kick', 
      damage: 20,
      energyCost: 15,
      animation: 'kick',
      hitChance: 0.75
    },
    special: {
      type: 'special',
      damage: 35,
      energyCost: 40,
      animation: 'punch', // Could be special animation
      hitChance: 0.90
    }
  }), []);

  const calculateDamage = useCallback((attacker: Fighter, attack: Attack): number => {
    const baseDamage = attack.damage;
    const strengthBonus = attacker.stats.strength * 0.3;
    const randomFactor = 0.8 + Math.random() * 0.4; // 80% to 120%
    
    return Math.round((baseDamage + strengthBonus) * randomFactor);
  }, []);

  const canUseSpecial = useCallback((fighter: Fighter): boolean => {
    return fighter.energy >= attacks.special.energyCost && 
           fighter.stats.strength >= 40 && 
           fighter.stats.endurance >= 40;
  }, [attacks.special.energyCost]);

  // FIXED: Moved AI decision making inside component
  const makeAIDecision = useCallback((
    aiOpp: any, 
    aiHealth: number, 
    aiEnergy: number, 
    playerHealth: number
  ): 'punch' | 'kick' | 'special' => {
    if (!aiOpp?.personality) {
      // Fallback simple AI
      const options = ['punch', 'kick'];
      if (aiEnergy >= 40) options.push('special');
      return options[Math.floor(Math.random() * options.length)] as any;
    }

    const personality = aiOpp.personality;
    const traits = personality.traits;
    
    // Calculate action weights based on personality
    let weights = {
      punch: 30,
      kick: 30,
      special: aiEnergy >= 40 ? 20 : 0
    };

    // Personality adjustments
    if (personality.fightingStyle === 'aggressive') {
      weights.punch += traits.aggression / 4;
      weights.special += 10;
    } else if (personality.fightingStyle === 'defensive') {
      weights.kick += traits.defense / 4;
      if (aiHealth < 30) weights.special += 15;
    } else if (personality.fightingStyle === 'strategic') {
      // Strategic AI adapts based on player patterns
      if (aiOpp.aiState?.playerPatterns) {
        const patterns = aiOpp.aiState.playerPatterns;
        const mostUsedKey = Object.keys(patterns).reduce((a, b) => patterns[a] > patterns[b] ? a : b);
        
        // Counter the player's most used move
        if (mostUsedKey.includes('punch')) weights.kick += 20;
        if (mostUsedKey.includes('kick')) weights.punch += 20;
        if (mostUsedKey.includes('special')) weights.special += 15;
      }
    } else if (personality.fightingStyle === 'unpredictable') {
      // Add randomness
      const randomBonus = Math.random() * 30;
      const randomMove = ['punch', 'kick', 'special'][Math.floor(Math.random() * 3)] as keyof typeof weights;
      weights[randomMove] += randomBonus;
    }

    // Health-based adjustments
    if (aiHealth < 30) {
      weights.special += 20;
    }
    
    if (playerHealth < 20) {
      weights.punch += 15;
      weights.kick += 15;
    }

    // Energy management
    if (aiEnergy < 30) {
      weights.special = 0;
      weights.punch += 10;
      weights.kick += 10;
    }

    // Normalize weights and make decision
    const totalWeight = weights.punch + weights.kick + weights.special;
    const random = Math.random() * totalWeight;
    
    if (random < weights.punch) return 'punch';
    if (random < weights.punch + weights.kick) return 'kick';
    return 'special';
  }, []);

  const generateAIComment = useCallback((aiOpp: any, situation: string, damage?: number): string => {
    if (!aiOpp?.personality) return '';

    const comments: Record<string, Record<string, string[]>> = {
      player_hit: {
        aggressive: ["Not bad!", "You'll have to do better!", "Is that all?"],
        defensive: ["I felt that one.", "Good technique.", "Well aimed."],
        balanced: ["Nice hit!", "Well played!", "Good move!"],
        unpredictable: ["Ouch! Unexpected!", "Interesting choice!", "Fun!"],
        strategic: ["Data logged.", "Pattern noted.", "Analyzing..."]
      },
      ai_hit: {
        aggressive: ["Take that!", "Feel my power!", "BOOM!"],
        defensive: ["Perfect counter!", "Calculated strike!", "Defense wins!"],
        balanced: ["Clean hit!", "Well executed!", "Good timing!"],
        unpredictable: ["Surprise!", "Random success!", "Chaos!"],
        strategic: ["As calculated.", "Optimal outcome.", "Predicted result."]
      },
      low_health: {
        aggressive: ["I'm not done yet!", "Rage mode!", "You haven't won!"],
        defensive: ["Time to be careful...", "Defense is key now.", "Strategic retreat."],
        balanced: ["This is intense!", "Close fight!", "Anyone's game!"],
        unpredictable: ["Plot twist incoming!", "Now it gets interesting!", "Chaos mode!"],
        strategic: ["Adjusting parameters...", "New strategy needed.", "Recalculating..."]
      }
    };

    const styleComments = comments[situation]?.[aiOpp.personality.fightingStyle] || ["..."];
    return styleComments[Math.floor(Math.random() * styleComments.length)];
  }, []);

  /* ========================================================================== */
  /*                              COMBAT MECHANICS                              */
  /* ========================================================================== */

  const executeAttack = useCallback(async (attackType: keyof typeof attacks, isOpponent = false) => {
    // Check if it's a valid turn
    if (isAnimating || gameState.status !== 'fighting') return;
    
    // Check turn validation
    const expectedTurn = isOpponent ? 'opponent' : 'player';
    if (gameState.currentTurn !== expectedTurn) return;

    const attacker = isOpponent ? opponent : player;
    const defender = isOpponent ? player : opponent;
    const attack = attacks[attackType];

    // Energy and special move validation
    if (attacker.energy < attack.energyCost) return;
    if (attackType === 'special' && !canUseSpecial(attacker)) return;

    setIsAnimating(true);

    // Track player actions for AI learning (if AI opponent exists)
    if (!isOpponent && aiOpponent) {
      // Update AI's knowledge of player patterns
      if (aiOpponent.aiState) {
        aiOpponent.aiState.lastPlayerActions = aiOpponent.aiState.lastPlayerActions || [];
        aiOpponent.aiState.lastPlayerActions.push(attackType);
        if (aiOpponent.aiState.lastPlayerActions.length > 5) {
          aiOpponent.aiState.lastPlayerActions.shift();
        }
        
        // Update pattern counters
        aiOpponent.aiState.playerPatterns = aiOpponent.aiState.playerPatterns || {};
        aiOpponent.aiState.playerPatterns[`${attackType}Count`] = 
          (aiOpponent.aiState.playerPatterns[`${attackType}Count`] || 0) + 1;
      }
    }

    // Set attacker animation
    if (isOpponent) {
      setOpponentAnimation(attack.animation);
    } else {
      setPlayerAnimation(attack.animation);
    }

    // Calculate hit chance with AI personality modifiers
    let hitChance = attack.hitChance;
    
    if (isOpponent && aiOpponent?.personality) {
      // AI accuracy affected by intelligence and fighting style
      const intelligenceBonus = (aiOpponent.personality.traits.intelligence - 50) / 500; // ±0.1
      const aggressionPenalty = aiOpponent.personality.traits.aggression > 80 ? -0.1 : 0;
      hitChance = Math.max(0.1, Math.min(0.95, hitChance + intelligenceBonus + aggressionPenalty));
    }

    const hitRoll = Math.random();
    const hit = hitRoll < hitChance;

    setTimeout(() => {
      let damage = 0;

      if (hit) {
        // Calculate damage
        damage = calculateDamage(attacker, attack);
        
        // Apply damage to defender
        if (isOpponent) {
          setPlayer(prev => ({
            ...prev,
            health: Math.max(0, prev.health - damage)
          }));
        } else {
          setOpponent(prev => ({
            ...prev,
            health: Math.max(0, prev.health - damage)
          }));
        }

        // Hit animations and effects
        if (isOpponent) {
          setPlayerAnimation('hit');
          setShakeEffect('player');
          setDamageEffect({ target: 'player', damage });
        } else {
          setOpponentAnimation('hit');
          setShakeEffect('opponent');
          setDamageEffect({ target: 'opponent', damage });
        }

        // Combat log with AI personality comments
        let logMessage = `${attacker.name} hits for ${damage} damage!`;
        
        if (isOpponent && aiOpponent?.personality) {
          const aiComment = generateAIComment(aiOpponent, 'ai_hit', damage);
          if (aiComment) {
            logMessage += ` "${aiComment}"`;
          }
        }

        setGameState(prev => ({
          ...prev,
          combatLog: [...prev.combatLog, logMessage]
        }));

        // Reset hit animations
        setTimeout(() => {
          if (isOpponent) {
            setPlayerAnimation('idle');
          } else {
            setOpponentAnimation('idle');
          }
          setShakeEffect(null);
          setDamageEffect(null);
        }, 800);

      } else {
        // Miss
        let missMessage = `${attacker.name} misses!`;
        
        if (isOpponent && aiOpponent?.personality) {
          const aiComment = generateAIComment(aiOpponent, 'player_hit', 0);
          if (aiComment) {
            missMessage += ` "${aiComment}"`;
          }
        }

        setGameState(prev => ({
          ...prev,
          combatLog: [...prev.combatLog, missMessage]
        }));
      }

      // >>> SIMULATE BATTLE TURN (dataService) — your requested insertion
      try {
        const turnResult = dataService.simulateBattleTurn(
          // pass snapshots; casting to any to avoid strict typing on external service
          (isOpponent ? { ...opponent } : { ...player }) as any,
          (isOpponent ? { ...player } : { ...opponent }) as any,
          gameState.currentTurn
        );
        if (turnResult) {
          const text =
            typeof turnResult === 'string'
              ? turnResult
              : turnResult.summary || turnResult.log || turnResult.message || JSON.stringify(turnResult);
          setGameState(prev => ({
            ...prev,
            combatLog: [...prev.combatLog, `🔮 ${text}`]
          }));
        }
      } catch (e) {
        console.warn('dataService.simulateBattleTurn failed:', e);
      }
      // <<< END INSERT

      // Consume energy
      if (isOpponent) {
        setOpponent(prev => ({
          ...prev,
          energy: Math.max(0, prev.energy - attack.energyCost)
        }));
      } else {
        setPlayer(prev => ({
          ...prev,
          energy: Math.max(0, prev.energy - attack.energyCost)
        }));
      }

      // Reset attacker animation and switch turns
      setTimeout(() => {
        if (isOpponent) {
          setOpponentAnimation('idle');
        } else {
          setPlayerAnimation('idle');
        }
        setIsAnimating(false);

        // Switch turns
        setGameState(prev => ({
          ...prev,
          currentTurn: isOpponent ? 'player' : 'opponent',
          turnTimeLeft: 10,
          turnCount: (prev.turnCount || 0) + 1
        }));
      }, 1000);
    }, 500);

  }, [isAnimating, gameState, player, opponent, attacks, calculateDamage, canUseSpecial, aiOpponent, generateAIComment]);

  // AI decision making
  const opponentAI = useCallback(() => {
    if (!isAnimating && gameState.status === 'fighting' && gameState.currentTurn === 'opponent') {
      // AI thinking time based on intelligence
      let thinkingTime = 1500; // Default
      
      if (aiOpponent?.personality) {
        const intelligence = aiOpponent.personality.traits.intelligence;
        thinkingTime = Math.max(800, 2000 - (intelligence * 12)); // Higher intelligence = faster decisions
        
        // Add some randomness for unpredictable AIs
        if (aiOpponent.personality.traits.adaptability < 50) {
          thinkingTime += Math.random() * 1000 - 500; // ±0.5 seconds
        }
      }

      setTimeout(() => {
        if (gameState.status === 'fighting' && opponent.health > 0) {
          const selectedAction = makeAIDecision(aiOpponent, opponent.health, opponent.energy, player.health);
          executeAttack(selectedAction, true);
        }
      }, thinkingTime);
    }
  }, [gameState, opponent, player, isAnimating, aiOpponent, executeAttack, makeAIDecision]);

  /* ========================================================================== */
  /*                               GAME LOOP                                   */
  /* ========================================================================== */

  // Battle end handling
  useEffect(() => {
    if (gameState.status === 'finished' && gameState.winner && onBattleEnd) {
      const battleResult = {
        winner: gameState.winner,
        aiOpponent: aiOpponent,
        playerStats: {
          health: player.health,
          finalLevel: player.stats.level
        },
        opponentStats: {
          health: opponent.health,
          finalLevel: opponent.stats.level
        },
        turnCount: gameState.turnCount || 0,
        battleDuration: Date.now() - (gameState.startTime || Date.now())
      };
      
      console.log('🏁 Battle finished with result:', battleResult);
      onBattleEnd(battleResult);
    }
  }, [gameState.status, gameState.winner, onBattleEnd, aiOpponent, player, opponent, gameState.turnCount, gameState.startTime]);

  // Turn timer
  useEffect(() => {
    if (gameState.status === 'fighting' && gameState.turnTimeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          turnTimeLeft: prev.turnTimeLeft - 1
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [gameState.status, gameState.turnTimeLeft]);

  // AI turn execution
  useEffect(() => {
    if (gameState.currentTurn === 'opponent' && !isAnimating && gameState.status === 'fighting') {
      const delay = setTimeout(opponentAI, 1000);
      return () => clearTimeout(delay);
    }
  }, [gameState.currentTurn, isAnimating, gameState.status, opponentAI]);

  // Check for game end
  useEffect(() => {
    if (player.health <= 0) {
      setPlayerAnimation('defeat');
      setOpponentAnimation('victory');
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        winner: 'opponent'
      }));
    } else if (opponent.health <= 0) {
      setPlayerAnimation('victory');
      setOpponentAnimation('defeat');
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        winner: 'player'
      }));
    }
  }, [player.health, opponent.health]);

  /* ========================================================================== */
  /*                                 UI RENDER                                  */
  /* ========================================================================== */

  const startBattle = () => {
    setGameState(prev => ({
      ...prev,
      status: 'fighting',
      combatLog: [`Battle begins! ${player.name} vs ${opponent.name}`],
      startTime: Date.now()
    }));
  };

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <style>{battleStyles}</style>
      
      {/* Back Button */}
      {onBack && (
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
          ← Back to AI Selection
        </button>
      )}
      
      {/* Game UI Header */}
      <div className="battle-header">
        <div className="fighter-info">
          <div className="fighter-card player">
            <div className="fighter-name">{player.name}</div>
            <div className="health-bar">
              <div className="health-fill" style={{ width: `${(player.health / player.maxHealth) * 100}%` }} />
              <span className="health-text">{player.health}/100</span>
            </div>
            <div className="energy-bar">
              <div className="energy-fill" style={{ width: `${(player.energy / player.maxEnergy) * 100}%` }} />
              <span className="energy-text">{player.energy}/100</span>
            </div>
          </div>
        </div>

        <div className="battle-status">
          {gameState.status === 'waiting' && (
            <button className="start-battle-btn" onClick={startBattle}>
              ⚔️ START BATTLE
            </button>
          )}
          {gameState.status === 'fighting' && (
            <div className="turn-info">
              <div className="current-turn">
                {gameState.currentTurn === 'player' ? 'YOUR TURN' : `${opponent.name.toUpperCase()} TURN`}
              </div>
              <div className="timer">{gameState.turnTimeLeft}s</div>
            </div>
          )}
          {gameState.status === 'finished' && (
            <div className="battle-result">
              <div className={`result-text ${gameState.winner}`}>
                {gameState.winner === 'player' ? '🏆 VICTORY!' : '💀 DEFEAT!'}
              </div>
            </div>
          )}
        </div>

        <div className="fighter-info">
          <div className="fighter-card opponent">
            <div className="fighter-name">{opponent.name}</div>
            <div className="health-bar">
              <div className="health-fill" style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }} />
              <span className="health-text">{opponent.health}/100</span>
            </div>
            <div className="energy-bar">
              <div className="energy-fill" style={{ width: `${(opponent.energy / opponent.maxEnergy) * 100}%` }} />
              <span className="energy-text">{opponent.energy}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <BattleBackground style={{ position: 'relative' }}>
        {/* Damage Effects */}
        {damageEffect && (
          <div 
            className={`damage-effect ${damageEffect.target}`}
            style={{
              position: 'absolute',
              top: '40%',
              left: damageEffect.target === 'player' ? '30%' : '70%',
              transform: 'translate(-50%, -50%)',
              color: '#ff4444',
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              animation: 'damageFloat 1s ease-out forwards',
              zIndex: 10
            }}
          >
            -{damageEffect.damage}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: gameState.status === 'waiting' ? 'space-between' : 'center',
          alignItems: 'center',
          padding: 24,
          height: 360,
          position: 'relative',
          gap: gameState.status === 'fighting' ? '60px' : '0px'
        }}>
          {/* Player Character */}
          <div className={`character-container ${shakeEffect === 'player' ? 'shake' : ''}`}>
            <CharacterSprite 
              bodyType={player.bodyType} 
              currentAnimation={playerAnimation as any} 
              scale={1.4} 
            />
            <div className="character-label">{player.name}</div>
          </div>

          {/* VS Text - Only show when waiting */}
          {gameState.status === 'waiting' && (
            <div className="vs-text">VS</div>
          )}

          {/* Opponent Character */}
          <div className={`character-container ${shakeEffect === 'opponent' ? 'shake' : ''}`}>
            <CharacterSprite 
              bodyType={opponent.bodyType} 
              currentAnimation={opponentAnimation as any} 
              scale={1.4} 
              isFlipped 
            />
            <div className="character-label">{opponent.name}</div>
          </div>
        </div>
      </BattleBackground>

      {/* Control Panel */}
      {gameState.status === 'fighting' && gameState.currentTurn === 'player' && (
        <div className="control-panel">
          <button 
            className="attack-btn punch"
            onClick={() => executeAttack('punch')}
            disabled={isAnimating || player.energy < attacks.punch.energyCost}
          >
            <div className="btn-icon">👊</div>
            <div className="btn-text">PUNCH</div>
            <div className="btn-cost">-{attacks.punch.energyCost} energy</div>
          </button>

          <button 
            className="attack-btn kick"
            onClick={() => executeAttack('kick')}
            disabled={isAnimating || player.energy < attacks.kick.energyCost}
          >
            <div className="btn-icon">🦵</div>
            <div className="btn-text">KICK</div>
            <div className="btn-cost">-{attacks.kick.energyCost} energy</div>
          </button>

          <button 
            className="attack-btn special"
            onClick={() => executeAttack('special')}
            disabled={isAnimating || !canUseSpecial(player)}
          >
            <div className="btn-icon">⚡</div>
            <div className="btn-text">SPECIAL</div>
            <div className="btn-cost">-{attacks.special.energyCost} energy</div>
            {!canUseSpecial(player) && (
              <div className="btn-requirement">Need 40+ STR/END</div>
            )}
          </button>
        </div>
      )}

      {/* Combat Log */}
      <div className="combat-log">
        <h4>Combat Log</h4>
        <div className="log-entries">
          {gameState.combatLog.slice(-5).map((entry, index) => (
            <div key={index} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ========================================================================== */
/*                                   STYLES                                   */
/* ========================================================================== */

const battleStyles = `
@keyframes damageFloat {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -150%) scale(1.5); opacity: 0; }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0,0,0,0.8);
  border-radius: 12px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
}

.fighter-info {
  flex: 1;
  max-width: 300px;
}

.fighter-card {
  background: rgba(255,255,255,0.1);
  padding: 16px;
  border-radius: 12px;
  border: 2px solid transparent;
}

.fighter-card.player {
  border-color: #06b6d4;
}

.fighter-card.opponent {
  border-color: #ef4444;
}

.fighter-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
}

.health-bar, .energy-bar {
  position: relative;
  height: 20px;
  background: rgba(0,0,0,0.3);
  border-radius: 10px;
  margin-bottom: 8px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #22c55e);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.energy-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.health-text, .energy-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}

.battle-status {
  flex: 1;
  text-align: center;
  max-width: 200px;
}

.start-battle-btn {
  background: linear-gradient(45deg, #ef4444, #dc2626);
  color: white;
  border: none;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.start-battle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.turn-info {
  text-align: center;
}

.current-turn {
  font-size: 14px;
  font-weight: bold;
  color: #06b6d4;
  margin-bottom: 8px;
}

.timer {
  font-size: 24px;
  font-weight: bold;
  color: #fbbf24;
}

.battle-result {
  text-align: center;
}

.result-text {
  font-size: 24px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.result-text.player {
  color: #22c55e;
}

.result-text.opponent {
  color: #ef4444;
}

.character-container {
  text-align: center;
  transition: transform 0.2s ease;
}

.character-container.shake {
  animation: shake 0.5s ease-in-out;
}

.character-label {
  margin-top: 8px;
  font-weight: bold;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.vs-text {
  color: white;
  font-size: 48px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  transform: rotate(-10deg);
}

.control-panel {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.attack-btn {
  background: linear-gradient(145deg, #1f2937, #374151);
  border: 2px solid #06b6d4;
  border-radius: 12px;
  padding: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.attack-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: #0891b2;
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.3);
}

.attack-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.attack-btn.special {
  border-color: #fbbf24;
  background: linear-gradient(145deg, #451a03, #92400e);
}

.attack-btn.special:hover:not(:disabled) {
  border-color: #f59e0b;
  box-shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
}

.btn-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.btn-text {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 2px;
}

.btn-cost {
  font-size: 10px;
  opacity: 0.8;
}

.btn-requirement {
  font-size: 9px;
  color: #ef4444;
  margin-top: 2px;
}

.combat-log {
  background: rgba(0,0,0,0.6);
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
  max-height: 150px;
  overflow-y: auto;
}

.combat-log h4 {
  margin: 0 0 8px 0;
  color: #06b6d4;
  font-size: 14px;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-entry {
  font-size: 12px;
  color: #d1d5db;
  padding: 4px 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
}

@media (max-width: 768px) {
  .battle-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .fighter-info {
    max-width: none;
    width: 100%;
  }
  
  .control-panel {
    flex-direction: column;
    align-items: center;
  }
  
  .attack-btn {
    width: 80%;
    max-width: 200px;
  }
}
`;

export default BattleGameEngine;
