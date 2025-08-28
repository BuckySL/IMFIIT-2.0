// src/managers/GameRoomManager.js - Handles game room creation, joining, and management
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const GameRoom = require('../models/GameRoom');

class GameRoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // roomId -> GameRoom
    this.playerRooms = new Map(); // playerId -> roomId
    this.publicRooms = new Set(); // Set of public room IDs
    
    // Cleanup interval for empty rooms
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, 30000); // Every 30 seconds
  }

  createRoom(socket, config, callback) {
    try {
      // Validate config
      if (!config || typeof config !== 'object') {
        return callback({ error: 'Invalid room configuration' });
      }

      // Check if user is already in a room
      const existingRoomId = this.playerRooms.get(socket.userProfile.id);
      if (existingRoomId) {
        return callback({ error: 'Already in a room. Leave current room first.' });
      }

      // Create new room
      const roomId = `room_${uuidv4()}`;
      const room = new GameRoom({
        id: roomId,
        hostId: socket.userProfile.id,
        betAmount: config.betAmount || 0,
        isPrivate: config.isPrivate || false,
        maxPlayers: config.maxPlayers || 2,
        gameMode: config.gameMode || 'battle',
        createdAt: new Date()
      });

      // Add host as first player
      room.addPlayer({
        id: socket.userProfile.id,
        username: socket.userProfile.telegramUser.first_name,
        bodyType: socket.userProfile.bodyType,
        level: socket.userProfile.stats.level,
        strength: socket.userProfile.stats.strength,
        endurance: socket.userProfile.stats.endurance,
        isReady: false,
        isHost: true,
        socketId: socket.id
      });

      // Store room
      this.rooms.set(roomId, room);
      this.playerRooms.set(socket.userProfile.id, roomId);
      
      if (!room.isPrivate) {
        this.publicRooms.add(roomId);
      }

      // Join socket to room
      socket.join(roomId);

      logger.info(`Room created: ${roomId} by ${socket.userProfile.telegramUser.first_name}`);

      // Broadcast room list update to lobby
      this.broadcastRoomListUpdate();

      callback({ 
        success: true, 
        room: this.getRoomDataForClient(room),
        roomId 
      });

      // Emit room created event to the room
      socket.emit('room:created', this.getRoomDataForClient(room));

    } catch (error) {
      logger.error('Create room error:', error);
      callback({ error: 'Failed to create room' });
    }
  }

  joinRoom(socket, roomId, callback) {
    try {
      const room = this.rooms.get(roomId);
      
      if (!room) {
        return callback({ error: 'Room not found' });
      }

      // Check if user is already in a room
      const existingRoomId = this.playerRooms.get(socket.userProfile.id);
      if (existingRoomId) {
        return callback({ error: 'Already in a room. Leave current room first.' });
      }

      // Check if room is full
      if (room.players.length >= room.maxPlayers) {
        return callback({ error: 'Room is full' });
      }

      // Check if game is already in progress
      if (room.status === 'playing') {
        return callback({ error: 'Game already in progress' });
      }

      // Add player to room
      const player = {
        id: socket.userProfile.id,
        username: socket.userProfile.telegramUser.first_name,
        bodyType: socket.userProfile.bodyType,
        level: socket.userProfile.stats.level,
        strength: socket.userProfile.stats.strength,
        endurance: socket.userProfile.stats.endurance,
        isReady: false,
        isHost: false,
        socketId: socket.id
      };

      room.addPlayer(player);
      this.playerRooms.set(socket.userProfile.id, roomId);

      // Join socket to room
      socket.join(roomId);

      logger.info(`Player ${socket.userProfile.telegramUser.first_name} joined room ${roomId}`);

      // Notify all players in room
      this.io.to(roomId).emit('room:playerJoined', {
        player: player,
        room: this.getRoomDataForClient(room)
      });

      // Update room list
      this.broadcastRoomListUpdate();

      callback({ 
        success: true, 
        room: this.getRoomDataForClient(room) 
      });

    } catch (error) {
      logger.error('Join room error:', error);
      callback({ error: 'Failed to join room' });
    }
  }

  leaveRoom(socket, callback) {
    try {
      const roomId = this.playerRooms.get(socket.userProfile.id);
      if (!roomId) {
        return callback({ error: 'Not in a room' });
      }

      const room = this.rooms.get(roomId);
      if (!room) {
        return callback({ error: 'Room not found' });
      }

      // Remove player from room
      room.removePlayer(socket.userProfile.id);
      this.playerRooms.delete(socket.userProfile.id);

      // Leave socket room
      socket.leave(roomId);

      logger.info(`Player ${socket.userProfile.telegramUser.first_name} left room ${roomId}`);

      // If room is empty, delete it
      if (room.players.length === 0) {
        this.deleteRoom(roomId);
      } else {
        // If the host left, assign new host
        if (room.hostId === socket.userProfile.id && room.players.length > 0) {
          room.hostId = room.players[0].id;
          room.players[0].isHost = true;
        }

        // Reset ready states if game was about to start
        if (room.status === 'ready') {
          room.status = 'waiting';
          room.players.forEach(player => {
            player.isReady = false;
          });
        }

        // Notify remaining players
        this.io.to(roomId).emit('room:playerLeft', {
          playerId: socket.userProfile.id,
          room: this.getRoomDataForClient(room)
        });
      }

      // Update room list
      this.broadcastRoomListUpdate();

      callback({ success: true });

    } catch (error) {
      logger.error('Leave room error:', error);
      callback({ error: 'Failed to leave room' });
    }
  }

  setPlayerReady(socket, callback) {
    try {
      const roomId = this.playerRooms.get(socket.userProfile.id);
      if (!roomId) {
        return callback({ error: 'Not in a room' });
      }

      const room = this.rooms.get(roomId);
      if (!room) {
        return callback({ error: 'Room not found' });
      }

      const player = room.getPlayer(socket.userProfile.id);
      if (!player) {
        return callback({ error: 'Player not found in room' });
      }

      // Toggle ready state
      player.isReady = !player.isReady;

      logger.info(`Player ${socket.userProfile.telegramUser.first_name} is ${player.isReady ? 'ready' : 'not ready'} in room ${roomId}`);

      // Check if all players are ready and room has minimum players
      const allReady = room.players.length >= 2 && room.players.every(p => p.isReady);
      
      if (allReady && room.status === 'waiting') {
        this.startGame(room);
      } else if (!allReady && room.status === 'ready') {
        room.status = 'waiting';
      }

      // Notify all players in room
      this.io.to(roomId).emit('room:playerReady', {
        playerId: socket.userProfile.id,
        isReady: player.isReady,
        allReady,
        room: this.getRoomDataForClient(room)
      });

      callback({ success: true, isReady: player.isReady });

    } catch (error) {
      logger.error('Set player ready error:', error);
      callback({ error: 'Failed to update ready status' });
    }
  }

  startGame(room) {
    try {
      logger.info(`Starting game in room ${room.id}`);

      room.status = 'playing';
      room.gameStartedAt = new Date();

      // Remove from public room list
      this.publicRooms.delete(room.id);

      // Initialize battle if it's a battle game mode
      if (room.gameMode === 'battle') {
        const BattleManager = require('./BattleManager');
        if (this.io.battleManager) {
          const battleState = this.io.battleManager.createBattle(room);
          
          // Notify players battle is starting
          this.io.to(room.id).emit('battle:starting', {
            countdown: 3,
            battleState: this.io.battleManager.getBattleStateForClient(battleState)
          });

          // Start battle after countdown
          setTimeout(() => {
            battleState.status = 'active';
            battleState.startedAt = new Date();
            battleState.currentTurn = room.players[0].id; // First player starts
            battleState.turnTimeLeft = 10;

            this.io.to(room.id).emit('battle:started', {
              battleState: this.io.battleManager.getBattleStateForClient(battleState)
            });
          }, 3000);
        }
      }

      // Update room list
      this.broadcastRoomListUpdate();

    } catch (error) {
      logger.error('Start game error:', error);
      room.status = 'waiting';
      this.io.to(room.id).emit('room:error', { error: 'Failed to start game' });
    }
  }

  handleDisconnection(socket) {
    const roomId = this.playerRooms.get(socket.userProfile?.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    logger.info(`Handling disconnection for player ${socket.userProfile.id} in room ${roomId}`);

    // Remove player from room
    room.removePlayer(socket.userProfile.id);
    this.playerRooms.delete(socket.userProfile.id);

    // If room is empty, delete it
    if (room.players.length === 0) {
      this.deleteRoom(roomId);
    } else {
      // If the host disconnected, assign new host
      if (room.hostId === socket.userProfile.id && room.players.length > 0) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
      }

      // If game was in progress, handle appropriately
      if (room.status === 'playing') {
        // Let BattleManager handle battle-specific disconnection logic
        this.io.to(roomId).emit('room:playerDisconnected', {
          playerId: socket.userProfile.id,
          room: this.getRoomDataForClient(room)
        });
      } else {
        // Reset ready states
        room.status = 'waiting';
        room.players.forEach(player => {
          player.isReady = false;
        });

        this.io.to(roomId).emit('room:playerLeft', {
          playerId: socket.userProfile.id,
          room: this.getRoomDataForClient(room)
        });
      }
    }

    this.broadcastRoomListUpdate();
  }

  deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    logger.info(`Deleting room ${roomId}`);

    // Remove all player associations
    room.players.forEach(player => {
      this.playerRooms.delete(player.id);
    });

    // Remove from collections
    this.rooms.delete(roomId);
    this.publicRooms.delete(roomId);

    this.broadcastRoomListUpdate();
  }

  getPublicRooms() {
    const publicRooms = [];
    
    for (const roomId of this.publicRooms) {
      const room = this.rooms.get(roomId);
      if (room && room.status === 'waiting' && room.players.length < room.maxPlayers) {
        publicRooms.push(this.getRoomDataForClient(room));
      }
    }

    return publicRooms.sort((a, b) => b.createdAt - a.createdAt);
  }

  getRoomDataForClient(room) {
    return {
      id: room.id,
      hostId: room.hostId,
      betAmount: room.betAmount,
      isPrivate: room.isPrivate,
      maxPlayers: room.maxPlayers,
      currentPlayers: room.players.length,
      gameMode: room.gameMode,
      status: room.status,
      createdAt: room.createdAt,
      players: room.players.map(player => ({
        id: player.id,
        username: player.username,
        bodyType: player.bodyType,
        level: player.level,
        isReady: player.isReady,
        isHost: player.isHost
      }))
    };
  }

  broadcastRoomListUpdate() {
    const publicRooms = this.getPublicRooms();
    this.io.emit('rooms:updated', { rooms: publicRooms });
  }

  cleanupEmptyRooms() {
    const roomsToDelete = [];
    
    for (const [roomId, room] of this.rooms) {
      if (room.players.length === 0) {
        roomsToDelete.push(roomId);
      }
    }

    roomsToDelete.forEach(roomId => {
      this.deleteRoom(roomId);
    });

    if (roomsToDelete.length > 0) {
      logger.info(`Cleaned up ${roomsToDelete.length} empty rooms`);
    }
  }

  getUserRoom(userId) {
    const roomId = this.playerRooms.get(userId);
    return roomId ? this.rooms.get(roomId) : null;
  }

  getRoomCount() {
    return this.rooms.size;
  }

  getActiveGameCount() {
    let activeGames = 0;
    for (const room of this.rooms.values()) {
      if (room.status === 'playing') {
        activeGames++;
      }
    }
    return activeGames;
  }

  // Get room by ID (for API endpoints)
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  // Force kick player (admin function)
  kickPlayer(roomId, playerId, reason = 'Kicked by admin') {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const player = room.getPlayer(playerId);
    if (!player) return false;

    room.removePlayer(playerId);
    this.playerRooms.delete(playerId);

    // Notify room
    this.io.to(roomId).emit('room:playerKicked', {
      playerId,
      reason,
      room: this.getRoomDataForClient(room)
    });

    // Notify kicked player
    const kickedSocket = this.io.sockets.sockets.get(player.socketId);
    if (kickedSocket) {
      kickedSocket.leave(roomId);
      kickedSocket.emit('room:kicked', { reason });
    }

    return true;
  }

  // Get statistics for monitoring
  getStats() {
    return {
      totalRooms: this.rooms.size,
      publicRooms: this.publicRooms.size,
      activeGames: this.getActiveGameCount(),
      totalPlayers: this.playerRooms.size,
      roomsByGameMode: this.getRoomsByGameMode()
    };
  }

  getRoomsByGameMode() {
    const gameModeCounts = {};
    for (const room of this.rooms.values()) {
      gameModeCounts[room.gameMode] = (gameModeCounts[room.gameMode] || 0) + 1;
    }
    return gameModeCounts;
  }
}

module.exports = GameRoomManager;