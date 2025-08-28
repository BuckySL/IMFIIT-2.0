// src/managers/BattleManager.js
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export class BattleManager {
  constructor(io) {
    this.io = io;
    this.activeBattles = new Map(); // battleId -> battle data
    this.playerBattles = new Map(); // userId -> battleId
  }

  // ============================================================================
  // BATTLE INITIALIZATION
  // ============================================================================

  async startBattle(room) {
    const players = room.players || [];
    if (players.length !== 2) {
      throw new Error('Need exactly 2 players to start battle');
    }

    const [player1, player2] = players;
    const battleId = uuidv4();

    // Create comprehensive battle state
    const battle = {
      id: battleId,
      roomId: room.id,
      status: 'fighting',
      startedAt: new Date(),
      
      // Player data with full profiles
      players: {
        [player1.id]: {
          id: player1.id,
          name: player1.telegramUser?.first_name || 'Player 1',
          bodyType: player1.bodyType || 'fit-male',
          telegramUser: player1.telegramUser,
          stats: {
            strength: player1.stats?.strength || 50,
            endurance: player1.stats?.endurance || 50,
            level: player1.stats?.level || 1,
            experience: player1.stats?.experience || 0
          },
          health: 100,
          maxHealth: 100,
          energy: 100,
          maxEnergy: 100
        },
        [player2.id]: {
          id: player2.id,
          name: player2.telegramUser?.first_name || 'Player 2',
          bodyType: player2.bodyType || 'fit-male',
          telegramUser: player2.telegramUser,
          stats: {
            strength: player2.stats?.strength || 50,
            endurance: player2.stats?.endurance || 50,
            level: player2.stats?.level || 1,
            experience: player2.stats?.experience || 0
          },
          health: 100,
          maxHealth: 100,
          energy: 100,
          maxEnergy: 100
        }
      },

      // Game state
      currentTurn: player1.id,
      turnTimeLeft: 30,
      turnCount: 0,
      maxTurns: 50, // Prevent infinite battles

      // Battle history
      actionHistory: [],
      battleLog: [],

      // Animations
      animations: {
        [player1.id]: 'idle',
        [player2.id]: 'idle'
      },

      // Effects
      effects: {
        damage: null,
        shake: null
      }
    };

    // Store battle
    this.activeBattles.set(battleId, battle);
    this.playerBattles.set(player1.id, battleId);
    this.playerBattles.set(player2.id, battleId);

    // Notify players
    this.io.to(room.id).emit('battle:started', {
      battleId,
      ...battle,
      message: 'Battle has begun! Choose your first move.'
    });

    // Start turn timer
    this.startTurnTimer(battleId);

    logger.info(`Battle started: ${battleId} between ${player1.id} and ${player2.id}`);
    return battle;
  }

  // ============================================================================
  // BATTLE ACTIONS
  // ============================================================================

  async processAction(actionData, userId) {
    const { action, battleId } = actionData;
    const battle = this.activeBattles.get(battleId);

    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.status !== 'fighting') {
      throw new Error('Battle is not active');
    }

    if (battle.currentTurn !== userId) {
      throw new Error('Not your turn');
    }

    const attacker = battle.players[userId];
    const defenderId = Object.keys(battle.players).find(id => id !== userId);
    const defender = battle.players[defenderId];

    // Calculate damage based on action and stats
    const result = this.calculateBattleAction(action, attacker, defender);

    // Apply damage
    defender.health = Math.max(0, defender.health - result.damage);

    // Update animations
    battle.animations[userId] = result.attackerAnimation;
    battle.animations[defenderId] = result.defenderAnimation;

    // Update energy
    attacker.energy = Math.max(0, attacker.energy - result.energyCost);

    // Add to battle log
    const logEntry = {
      turn: battle.turnCount + 1,
      attacker: userId,
      defender: defenderId,
      action: action,
      damage: result.damage,
      critical: result.critical,
      blocked: result.blocked,
      timestamp: new Date()
    };

    battle.actionHistory.push(logEntry);
    battle.battleLog.push(
      `${attacker.name} used ${action} for ${result.damage} damage!`
    );

    // Check for battle end
    const battleEnded = defender.health <= 0 || battle.turnCount >= battle.maxTurns;
    
    if (battleEnded) {
      const winner = defender.health <= 0 ? userId : this.determineWinnerByHealth(battle);
      await this.endBattle(battleId, winner);
      return { ...result, battleEnded: true, winner };
    }

    // Switch turns
    battle.currentTurn = defenderId;
    battle.turnCount++;
    battle.turnTimeLeft = 30;

    // Regenerate energy
    Object.values(battle.players).forEach(player => {
      player.energy = Math.min(player.maxEnergy, player.energy + 5);
    });

    // Reset animations after delay
    setTimeout(() => {
      battle.animations[userId] = 'idle';
      battle.animations[defenderId] = 'idle';
      this.io.to(battle.roomId).emit('battle:animation_reset', {
        animations: battle.animations
      });
    }, 1500);

    // Emit battle update
    this.io.to(battle.roomId).emit('battle:turn', {
      battleId,
      actionResult: result,
      battleState: this.getBattleClientData(battle),
      logEntry
    });

    // Start next turn timer
    this.startTurnTimer(battleId);

    logger.info(`Battle action: ${userId} used ${action} in battle ${battleId}`);
    return { ...result, battleEnded: false };
  }

  // ============================================================================
  // DAMAGE CALCULATION
  // ============================================================================

  calculateBattleAction(action, attacker, defender) {
    const actions = {
      punch: { baseDamage: 15, energyCost: 10, critChance: 0.1, blockChance: 0.3 },
      kick: { baseDamage: 20, energyCost: 15, critChance: 0.15, blockChance: 0.2 },
      special: { baseDamage: 30, energyCost: 25, critChance: 0.25, blockChance: 0.1 }
    };

    const actionData = actions[action] || actions.punch;

    // Check if attacker has enough energy
    if (attacker.energy < actionData.energyCost) {
      return {
        damage: 0,
        energyCost: 0,
        critical: false,
        blocked: false,
        miss: true,
        attackerAnimation: 'idle',
        defenderAnimation: 'idle',
        message: `${attacker.name} is too tired to attack!`
      };
    }

    // Calculate base damage with stats
    const strengthMultiplier = 1 + (attacker.stats.strength / 100);
    let damage = Math.round(actionData.baseDamage * strengthMultiplier);

    // Check for critical hit
    const critical = Math.random() < actionData.critChance;
    if (critical) {
      damage = Math.round(damage * 1.5);
    }

    // Check for block (based on defender's endurance)
    const blockChance = actionData.blockChance + (defender.stats.endurance / 1000);
    const blocked = Math.random() < blockChance;
    if (blocked) {
      damage = Math.round(damage * 0.3); // Reduce damage by 70%
    }

    // Add some randomness (±20%)
    const randomMultiplier = 0.8 + (Math.random() * 0.4);
    damage = Math.round(damage * randomMultiplier);

    return {
      damage: Math.max(1, damage), // Minimum 1 damage
      energyCost: actionData.energyCost,
      critical,
      blocked,
      miss: false,
      attackerAnimation: action, // punch, kick, special
      defenderAnimation: blocked ? 'block' : 'hit',
      message: this.generateActionMessage(attacker.name, action, damage, critical, blocked)
    };
  }

  // ============================================================================
  // BATTLE END & REWARDS
  // ============================================================================

  async endBattle(battleId, winnerId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;

    battle.status = 'finished';
    battle.endedAt = new Date();
    battle.winner = winnerId;

    const loserId = Object.keys(battle.players).find(id => id !== winnerId);
    const winner = battle.players[winnerId];
    const loser = battle.players[loserId];

    // Calculate rewards
    const rewards = this.calculateRewards(winner, loser, battle);

    const battleResult = {
      battleId,
      winner: winnerId,
      loser: loserId,
      battleDuration: battle.endedAt - battle.startedAt,
      totalTurns: battle.turnCount,
      winnerRewards: rewards.winner,
      loserRewards: rewards.loser,
      finalHealth: {
        [winnerId]: winner.health,
        [loserId]: loser.health
      },
      battleLog: battle.battleLog
    };

    // Emit battle end
    this.io.to(battle.roomId).emit('battle:ended', battleResult);

    // Cleanup
    this.activeBattles.delete(battleId);
    this.playerBattles.delete(winnerId);
    this.playerBattles.delete(loserId);

    logger.info(`Battle ended: ${battleId}, Winner: ${winnerId}`);
    return battleResult;
  }

  calculateRewards(winner, loser, battle) {
    const baseTurns = Math.min(battle.turnCount, 20);
    
    return {
      winner: {
        experience: 25 + (baseTurns * 2),
        strength: Math.floor(Math.random() * 3) + 1,
        endurance: Math.floor(Math.random() * 3) + 1,
        coins: 50 + (baseTurns * 3)
      },
      loser: {
        experience: 10 + Math.floor(baseTurns / 2),
        strength: Math.floor(Math.random() * 2),
        endurance: Math.floor(Math.random() * 2),
        coins: 20 + baseTurns
      }
    };
  }

  // ============================================================================
  // TURN MANAGEMENT
  // ============================================================================

  startTurnTimer(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle || battle.status !== 'fighting') return;

    // Clear existing timer
    if (battle.turnTimer) {
      clearInterval(battle.turnTimer);
    }

    battle.turnTimer = setInterval(() => {
      battle.turnTimeLeft--;

      // Emit timer update
      this.io.to(battle.roomId).emit('battle:timer', {
        battleId,
        turnTimeLeft: battle.turnTimeLeft,
        currentTurn: battle.currentTurn
      });

      // Handle timeout
      if (battle.turnTimeLeft <= 0) {
        clearInterval(battle.turnTimer);
        this.handleTurnTimeout(battleId);
      }
    }, 1000);
  }

  async handleTurnTimeout(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return;

    // Auto-action: random weak attack
    await this.processAction({
      action: 'punch',
      battleId
    }, battle.currentTurn);

    logger.info(`Turn timeout in battle ${battleId} for player ${battle.currentTurn}`);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getBattleClientData(battle) {
    return {
      id: battle.id,
      status: battle.status,
      players: battle.players,
      currentTurn: battle.currentTurn,
      turnTimeLeft: battle.turnTimeLeft,
      turnCount: battle.turnCount,
      animations: battle.animations,
      currentHealth: Object.fromEntries(
        Object.entries(battle.players).map(([id, player]) => [id, player.health])
      ),
      battleLog: battle.battleLog.slice(-5) // Last 5 messages
    };
  }

  determineWinnerByHealth(battle) {
    const players = Object.values(battle.players);
    return players.reduce((winner, player) => 
      player.health > winner.health ? player : winner
    ).id;
  }

  generateActionMessage(attackerName, action, damage, critical, blocked) {
    const actionVerbs = {
      punch: 'punched',
      kick: 'kicked', 
      special: 'unleashed a special attack on'
    };

    let message = `${attackerName} ${actionVerbs[action] || 'attacked'} for ${damage} damage`;
    
    if (critical) message += ' - CRITICAL HIT!';
    if (blocked) message += ' - partially blocked!';
    
    return message;
  }

  // ============================================================================
  // CLEANUP & QUERIES
  // ============================================================================

  async getUserBattles(userId) {
    // Return battle history for user
    return Array.from(this.activeBattles.values())
      .filter(battle => battle.players[userId])
      .map(battle => ({
        id: battle.id,
        status: battle.status,
        startedAt: battle.startedAt,
        opponent: Object.values(battle.players).find(p => p.id !== userId)?.name || 'Unknown',
        winner: battle.winner
      }));
  }

  getCurrentBattle(userId) {
    const battleId = this.playerBattles.get(userId);
    return battleId ? this.activeBattles.get(battleId) : null;
  }

  disconnectPlayer(userId) {
    const battleId = this.playerBattles.get(userId);
    if (battleId) {
      // End battle due to disconnection
      const battle = this.activeBattles.get(battleId);
      if (battle && battle.status === 'fighting') {
        const opponentId = Object.keys(battle.players).find(id => id !== userId);
        this.endBattle(battleId, opponentId); // Opponent wins by default
      }
    }
  }
}