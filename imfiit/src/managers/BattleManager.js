// src/managers/BattleManager.js - Handles all battle logic and state
const logger = require('../utils/logger');
const BattleState = require('../models/BattleState');
const { validateBattleAction, calculateDamage } = require('../utils/battleUtils');

class BattleManager {
  constructor(io) {
    this.io = io;
    this.activeBattles = new Map(); // roomId -> BattleState
    this.playerBattles = new Map(); // playerId -> roomId
    this.battleTickers = new Map(); // roomId -> setInterval
  }

  createBattle(room) {
    const battleState = new BattleState(room);
    this.activeBattles.set(room.id, battleState);
    
    // Set up battle ticker for turn timeouts
    const ticker = setInterval(() => {
      this.tickBattle(room.id);
    }, 1000);
    
    this.battleTickers.set(room.id, ticker);
    
    // Track players in battle
    room.players.forEach(player => {
      this.playerBattles.set(player.id, room.id);
    });

    logger.info(`Battle created for room ${room.id} with ${room.players.length} players`);
    return battleState;
  }

  handlePlayerAction(socket, action, callback) {
    try {
      const roomId = this.playerBattles.get(socket.userProfile.id);
      if (!roomId) {
        return callback({ error: 'Not in an active battle' });
      }

      const battleState = this.activeBattles.get(roomId);
      if (!battleState) {
        return callback({ error: 'Battle state not found' });
      }

      // Validate it's the player's turn
      if (battleState.currentTurn !== socket.userProfile.id) {
        return callback({ error: 'Not your turn' });
      }

      // Validate action
      const validation = validateBattleAction(battleState, socket.userProfile.id, action);
      if (!validation.valid) {
        return callback({ error: validation.reason });
      }

      // Execute the action
      const result = this.executeBattleAction(battleState, socket.userProfile.id, action);
      
      // Broadcast battle update to all players in the room
      this.io.to(roomId).emit('battle:action', {
        playerId: socket.userProfile.id,
        action: action.type,
        result,
        newState: this.getBattleStateForClient(battleState)
      });

      // Check for battle end
      if (battleState.status === 'finished') {
        this.endBattle(roomId, battleState);
      } else {
        // Switch turns
        this.switchTurn(battleState);
      }

      callback({ success: true, result });
    } catch (error) {
      logger.error('Battle action error:', error);
      callback({ error: 'Failed to execute action' });
    }
  }

  executeBattleAction(battleState, playerId, action) {
    const attacker = battleState.getPlayer(playerId);
    const defender = battleState.getOpponent(playerId);

    if (!attacker || !defender) {
      throw new Error('Player not found in battle');
    }

    // Check energy cost
    const energyCost = this.getActionEnergyCost(action.type);
    if (attacker.energy < energyCost) {
      throw new Error('Insufficient energy');
    }

    // Calculate hit chance and damage
    const hitChance = this.getActionHitChance(action.type);
    const hit = Math.random() < hitChance;

    let result = {
      hit,
      damage: 0,
      critical: false,
      energyUsed: energyCost
    };

    if (hit) {
      // Calculate damage
      const baseDamage = this.getActionBaseDamage(action.type);
      const damage = calculateDamage(attacker, defender, baseDamage);
      
      // Check for critical hit
      const criticalChance = this.getCriticalChance(attacker);
      const critical = Math.random() < criticalChance;
      
      const finalDamage = critical ? Math.round(damage * 1.5) : damage;
      
      // Apply damage
      defender.health = Math.max(0, defender.health - finalDamage);
      
      result.damage = finalDamage;
      result.critical = critical;

      // Check for battle end
      if (defender.health <= 0) {
        battleState.status = 'finished';
        battleState.winner = playerId;
        battleState.finishedAt = new Date();
      }
    }

    // Consume energy
    attacker.energy = Math.max(0, attacker.energy - energyCost);

    // Add to battle log
    battleState.addToLog({
      turn: battleState.turnCount,
      playerId,
      action: action.type,
      hit,
      damage: result.damage,
      critical: result.critical,
      timestamp: new Date()
    });

    return result;
  }

  switchTurn(battleState) {
    const currentPlayerIndex = battleState.players.findIndex(p => p.id === battleState.currentTurn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % battleState.players.length;
    
    battleState.currentTurn = battleState.players[nextPlayerIndex].id;
    battleState.turnTimeLeft = 10; // 10 seconds per turn
    battleState.turnCount++;

    logger.debug(`Turn switched to player ${battleState.currentTurn} (turn ${battleState.turnCount})`);
  }

  tickBattle(roomId) {
    const battleState = this.activeBattles.get(roomId);
    if (!battleState || battleState.status !== 'active') {
      return;
    }

    // Regenerate energy for all players
    battleState.players.forEach(player => {
      player.energy = Math.min(player.maxEnergy, player.energy + 2);
    });

    // Handle turn timeout
    if (battleState.turnTimeLeft > 0) {
      battleState.turnTimeLeft--;
      
      // Broadcast time update
      this.io.to(roomId).emit('battle:tick', {
        timeLeft: battleState.turnTimeLeft,
        players: battleState.players.map(p => ({
          id: p.id,
          health: p.health,
          energy: p.energy
        }))
      });
    } else {
      // Turn timeout - switch to next player
      logger.info(`Turn timeout for player ${battleState.currentTurn} in room ${roomId}`);
      
      battleState.addToLog({
        turn: battleState.turnCount,
        playerId: battleState.currentTurn,
        action: 'timeout',
        hit: false,
        damage: 0,
        timestamp: new Date()
      });

      this.switchTurn(battleState);
      
      this.io.to(roomId).emit('battle:turnTimeout', {
        newTurn: battleState.currentTurn,
        timeLeft: battleState.turnTimeLeft
      });
    }
  }

  endBattle(roomId, battleState) {
    logger.info(`Battle ended in room ${roomId}. Winner: ${battleState.winner}`);

    // Stop battle ticker
    const ticker = this.battleTickers.get(roomId);
    if (ticker) {
      clearInterval(ticker);
      this.battleTickers.delete(roomId);
    }

    // Calculate rewards
    const rewards = this.calculateBattleRewards(battleState);

    // Broadcast battle end
    this.io.to(roomId).emit('battle:ended', {
      winner: battleState.winner,
      battleLog: battleState.battleLog,
      rewards,
      summary: {
        duration: Date.now() - battleState.startedAt.getTime(),
        totalTurns: battleState.turnCount,
        totalDamageDealt: battleState.battleLog.reduce((sum, log) => sum + (log.damage || 0), 0)
      }
    });

    // Clean up
    battleState.players.forEach(player => {
      this.playerBattles.delete(player.id);
    });
    
    this.activeBattles.delete(roomId);
  }

  handleForfeit(socket, callback) {
    try {
      const roomId = this.playerBattles.get(socket.userProfile.id);
      if (!roomId) {
        return callback({ error: 'Not in an active battle' });
      }

      const battleState = this.activeBattles.get(roomId);
      if (!battleState) {
        return callback({ error: 'Battle state not found' });
      }

      // Set opponent as winner
      const opponent = battleState.getOpponent(socket.userProfile.id);
      if (opponent) {
        battleState.winner = opponent.id;
        battleState.status = 'finished';
        battleState.finishedAt = new Date();

        battleState.addToLog({
          turn: battleState.turnCount,
          playerId: socket.userProfile.id,
          action: 'forfeit',
          hit: false,
          damage: 0,
          timestamp: new Date()
        });

        this.endBattle(roomId, battleState);
        callback({ success: true });
      }
    } catch (error) {
      logger.error('Forfeit error:', error);
      callback({ error: 'Failed to forfeit' });
    }
  }

  handleDisconnection(socket) {
    const roomId = this.playerBattles.get(socket.userProfile?.id);
    if (!roomId) return;

    const battleState = this.activeBattles.get(roomId);
    if (battleState && battleState.status === 'active') {
      logger.info(`Player ${socket.userProfile.id} disconnected during battle`);
      
      // Treat as forfeit
      const opponent = battleState.getOpponent(socket.userProfile.id);
      if (opponent) {
        battleState.winner = opponent.id;
        battleState.status = 'finished';
        battleState.finishedAt = new Date();

        battleState.addToLog({
          turn: battleState.turnCount,
          playerId: socket.userProfile.id,
          action: 'disconnect',
          hit: false,
          damage: 0,
          timestamp: new Date()
        });

        this.endBattle(roomId, battleState);
      }
    }
  }

  getBattleStateForClient(battleState) {
    return {
      status: battleState.status,
      currentTurn: battleState.currentTurn,
      turnTimeLeft: battleState.turnTimeLeft,
      turnCount: battleState.turnCount,
      players: battleState.players.map(player => ({
        id: player.id,
        username: player.username,
        bodyType: player.bodyType,
        health: player.health,
        maxHealth: player.maxHealth,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        position: player.position
      }))
    };
  }

  calculateBattleRewards(battleState) {
    const winner = battleState.getPlayer(battleState.winner);
    const loser = battleState.getOpponent(battleState.winner);

    const baseReward = {
      experience: 25,
      coins: 10
    };

    const levelDifference = (winner?.level || 1) - (loser?.level || 1);
    const difficultyMultiplier = levelDifference <= 0 ? 1.2 : 0.8; // Bonus for beating higher level

    return {
      winner: {
        experience: Math.round(baseReward.experience * difficultyMultiplier),
        coins: Math.round(baseReward.coins * difficultyMultiplier),
        winStreak: winner?.winStreak ? winner.winStreak + 1 : 1
      },
      loser: {
        experience: 5, // Consolation XP
        coins: 0,
        winStreak: 0
      }
    };
  }

  getActionEnergyCost(actionType) {
    const costs = {
      punch: 10,
      kick: 15,
      special: 40,
      block: 5
    };
    return costs[actionType] || 10;
  }

  getActionHitChance(actionType) {
    const chances = {
      punch: 0.85,
      kick: 0.75,
      special: 0.90,
      block: 1.0 // Block always "hits" (succeeds)
    };
    return chances[actionType] || 0.8;
  }

  getActionBaseDamage(actionType) {
    const damages = {
      punch: 15,
      kick: 20,
      special: 35,
      block: 0
    };
    return damages[actionType] || 10;
  }

  getCriticalChance(player) {
    // Base 5% critical chance + 0.1% per strength point
    return 0.05 + (player.strength || 50) * 0.001;
  }

  getActiveBattleCount() {
    return this.activeBattles.size;
  }

  getBattleState(roomId) {
    return this.activeBattles.get(roomId);
  }

  // Cleanup method for testing
  cleanup() {
    this.battleTickers.forEach(ticker => clearInterval(ticker));
    this.activeBattles.clear();
    this.playerBattles.clear();
    this.battleTickers.clear();
  }
}

module.exports = BattleManager;