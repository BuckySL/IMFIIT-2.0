// src/managers/GameRoomManager.js 
import { v4 as uuidv4 } from 'uuid'; 
import { logger } from '../utils/logger.js'; 
 
export class GameRoomManager { 
  constructor(io) { 
    this.io = io; 
    this.rooms = new Map(); 
    this.userRooms = new Map(); 
  } 
 
  async createRoom(hostId, config) { 
    const roomId = uuidv4(); 
    const room = { id: roomId, hostId, status: 'waiting' }; 
    this.rooms.set(roomId, room); 
    this.userRooms.set(hostId, roomId); 
    logger.info(`Room created: ${roomId}`); 
    return room; 
  } 
 
  async joinRoom(roomId, userId) { 
    const room = this.rooms.get(roomId); 
    if (!room) throw new Error('Room not found'); 
    room.guestId = userId; 
    this.userRooms.set(userId, roomId); 
    return room; 
  } 
 
  async leaveRoom(roomId, userId) { 
    this.userRooms.delete(userId); 
  } 
 
  async setPlayerReady(roomId, userId) { 
    const room = this.rooms.get(roomId); 
    if (room) room.status = 'ready'; 
    return room; 
  } 
 
  getPublicRooms() { 
    return Array.from(this.rooms.values()); 
  } 
} 
