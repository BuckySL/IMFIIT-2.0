// src/middleware/auth.js
import { logger } from '../../../imfiit-backend/src/utils/logger.js';

export const authMiddleware = (socket, next) => {
  try {
    // Get user data from socket handshake
    const { userProfile } = socket.handshake.auth || {};
    
    if (!userProfile || !userProfile.id) {
      logger.warn('Socket connection attempted without valid user profile');
      return next(new Error('Authentication failed: No user profile provided'));
    }

    // Validate required user profile fields
    if (!userProfile.telegramUser || !userProfile.telegramUser.id) {
      logger.warn('Socket connection attempted without valid Telegram user data');
      return next(new Error('Authentication failed: Invalid user profile'));
    }

    // Attach user data to socket
    socket.userId = userProfile.id;
    socket.telegramId = userProfile.telegramUser.id;
    socket.userProfile = userProfile;
    
    logger.info(`Socket authenticated for user: ${userProfile.id}`, {
      socketId: socket.id,
      userId: userProfile.id,
      telegramId: userProfile.telegramUser.id,
      username: userProfile.telegramUser.first_name
    });

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    next(new Error('Authentication failed: Server error'));
  }
};