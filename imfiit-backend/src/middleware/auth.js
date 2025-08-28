// src/middleware/auth.js 
import { logger } from '../utils/logger.js'; 
 
export const authMiddleware = (socket, next) => { 
  try { 
    const { userProfile } = socket.handshake.auth || {}; 
    if (!userProfile || !userProfile.id) { 
      return next(new Error('Authentication failed')); 
    } 
    socket.userId = userProfile.id; 
    socket.telegramId = userProfile.telegramUser.id; 
    socket.userProfile = userProfile; 
    next(); 
  } catch (error) { 
    next(new Error('Authentication failed')); 
  } 
}; 
