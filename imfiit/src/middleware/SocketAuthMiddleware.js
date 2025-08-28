// src/middleware/SocketAuthMiddleware.js - Authenticates socket connections
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class SocketAuthMiddleware {
  static authenticate(socket, next) {
    try {
      // Get auth data from handshake
      const { auth, query } = socket.handshake;
      
      // Try to get user profile from auth data
      let userProfile = null;

      // Method 1: JWT token authentication
      if (auth && auth.token) {
        try {
          const decoded = jwt.verify(auth.token, process.env.JWT_SECRET || 'imfiit-secret');
          userProfile = decoded.userProfile;
        } catch (jwtError) {
          logger.warn('Invalid JWT token:', jwtError.message);
        }
      }

      // Method 2: Direct user profile in auth (for development/demo)
      if (!userProfile && auth && auth.userProfile) {
        userProfile = auth.userProfile;
      }

      // Method 3: Query parameters (fallback for some clients)
      if (!userProfile && query && query.userProfile) {
        try {
          userProfile = JSON.parse(decodeURIComponent(query.userProfile));
        } catch (parseError) {
          logger.warn('Failed to parse userProfile from query:', parseError.message);
        }
      }

      // Method 4: Telegram user data validation
      if (!userProfile && auth && auth.telegramData) {
        userProfile = SocketAuthMiddleware.validateTelegramData(auth.telegramData);
      }

      // Validate user profile
      if (!userProfile || !SocketAuthMiddleware.isValidUserProfile(userProfile)) {
        logger.warn('Socket connection rejected: Invalid or missing user profile');
        return next(new Error('Authentication failed: Invalid user profile'));
      }

      // Attach user profile to socket
      socket.userProfile = userProfile;
      socket.userId = userProfile.id;

      // Set up user activity tracking
      socket.lastActivity = Date.now();
      socket.on('ping', () => {
        socket.lastActivity = Date.now();
      });

      logger.info(`Socket authenticated for user: ${userProfile.telegramUser.first_name} (${userProfile.id})`);
      next();

    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  static validateTelegramData(telegramData) {
    try {
      // Validate Telegram WebApp data
      const { user, auth_date, hash } = telegramData;
      
      if (!user || !auth_date || !hash) {
        throw new Error('Missing required Telegram data');
      }

      // Check if auth is recent (within 24 hours)
      const authAge = Date.now() / 1000 - auth_date;
      if (authAge > 86400) { // 24 hours
        throw new Error('Telegram auth data is too old');
      }

      // In production, verify the hash using bot token
      if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_BOT_TOKEN) {
        const isValid = SocketAuthMiddleware.verifyTelegramHash(telegramData);
        if (!isValid) {
          throw new Error('Invalid Telegram hash');
        }
      }

      // Create user profile from Telegram data
      return {
        id: `user_${user.id}`,
        telegramId: user.id,
        telegramUser: user,
        stats: {
          strength: 50,
          endurance: 50,
          level: 1,
          experience: 0,
          totalWorkouts: 0
        },
        bodyType: 'fit-male', // Default, should be set during profile setup
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      logger.warn('Telegram data validation failed:', error.message);
      return null;
    }
  }

  static verifyTelegramHash(telegramData) {
    try {
      const crypto = require('crypto');
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      
      if (!botToken) {
        logger.warn('No Telegram bot token provided for hash verification');
        return true; // Skip verification in development
      }

      // Create data check string
      const { hash, ...data } = telegramData;
      const dataCheckString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join('\n');

      // Create secret key
      const secretKey = crypto.createHash('sha256').update(botToken).digest();
      
      // Calculate hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      logger.error('Telegram hash verification error:', error);
      return false;
    }
  }

  static isValidUserProfile(profile) {
    if (!profile || typeof profile !== 'object') {
      return false;
    }

    // Required fields
    const requiredFields = ['id', 'telegramUser', 'stats'];
    for (const field of requiredFields) {
      if (!profile[field]) {
        return false;
      }
    }

    // Validate telegramUser
    if (!profile.telegramUser.id || !profile.telegramUser.first_name) {
      return false;
    }

    // Validate stats
    const { stats } = profile;
    if (typeof stats.strength !== 'number' || 
        typeof stats.endurance !== 'number' || 
        typeof stats.level !== 'number' || 
        typeof stats.experience !== 'number') {
      return false;
    }

    // Validate ranges
    if (stats.strength < 0 || stats.strength > 1000 ||
        stats.endurance < 0 || stats.endurance > 1000 ||
        stats.level < 1 || stats.level > 100 ||
        stats.experience < 0 || stats.experience > 1000000) {
      return false;
    }

    return true;
  }

  // Rate limiting for socket connections
  static rateLimit(socket, next) {
    const ip = socket.handshake.address;
    const now = Date.now();
    
    if (!SocketAuthMiddleware.connectionAttempts) {
      SocketAuthMiddleware.connectionAttempts = new Map();
    }

    const attempts = SocketAuthMiddleware.connectionAttempts.get(ip) || [];
    
    // Remove old attempts (older than 1 minute)
    const recentAttempts = attempts.filter(time => now - time < 60000);
    
    // Check if too many attempts
    if (recentAttempts.length >= 10) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return next(new Error('Too many connection attempts'));
    }

    // Add current attempt
    recentAttempts.push(now);
    SocketAuthMiddleware.connectionAttempts.set(ip, recentAttempts);
    
    next();
  }

  // Clean up old connection attempts periodically
  static cleanupRateLimit() {
    if (!SocketAuthMiddleware.connectionAttempts) return;

    const now = Date.now();
    for (const [ip, attempts] of SocketAuthMiddleware.connectionAttempts) {
      const recentAttempts = attempts.filter(time => now - time < 60000);
      if (recentAttempts.length === 0) {
        SocketAuthMiddleware.connectionAttempts.delete(ip);
      } else {
        SocketAuthMiddleware.connectionAttempts.set(ip, recentAttempts);
      }
    }
  }

  // Generate JWT token for user
  static generateToken(userProfile) {
    try {
      const payload = {
        userProfile,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      return jwt.sign(payload, process.env.JWT_SECRET || 'imfiit-secret');
    } catch (error) {
      logger.error('Token generation error:', error);
      return null;
    }
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'imfiit-secret');
      return decoded.userProfile;
    } catch (error) {
      logger.warn('Token verification failed:', error.message);
      return null;
    }
  }

  // Middleware for admin authentication
  static authenticateAdmin(socket, next) {
    try {
      const { auth } = socket.handshake;
      
      if (!auth || !auth.adminToken) {
        return next(new Error('Admin authentication required'));
      }

      const adminToken = process.env.ADMIN_TOKEN;
      if (!adminToken || auth.adminToken !== adminToken) {
        return next(new Error('Invalid admin token'));
      }

      socket.isAdmin = true;
      logger.info(`Admin authenticated: ${socket.id}`);
      next();

    } catch (error) {
      logger.error('Admin authentication error:', error);
      next(new Error('Admin authentication failed'));
    }
  }

  // Check if user is banned
  static async checkBanStatus(socket, next) {
    try {
      if (!socket.userProfile) {
        return next();
      }

      // Check in-memory ban list first
      if (SocketAuthMiddleware.bannedUsers && 
          SocketAuthMiddleware.bannedUsers.has(socket.userProfile.id)) {
        return next(new Error('User is banned'));
      }

      // Check database for ban status
      try {
        const Ban = require('../models/Ban');
        const ban = await Ban.findOne({
          userId: socket.userProfile.id,
          isActive: true,
          expiresAt: { $gt: new Date() }
        });

        if (ban) {
          logger.info(`Banned user attempted connection: ${socket.userProfile.id}`);
          return next(new Error(`User is banned: ${ban.reason}`));
        }
      } catch (dbError) {
        logger.warn('Failed to check ban status in database:', dbError);
        // Continue without database check
      }

      next();

    } catch (error) {
      logger.error('Ban check error:', error);
      next(new Error('Failed to verify user status'));
    }
  }

  // Initialize ban list
  static initializeBanList() {
    SocketAuthMiddleware.bannedUsers = new Set();
  }

  // Add user to ban list
  static banUser(userId, reason = 'Banned by admin') {
    if (!SocketAuthMiddleware.bannedUsers) {
      SocketAuthMiddleware.initializeBanList();
    }
    
    SocketAuthMiddleware.bannedUsers.add(userId);
    logger.info(`User banned: ${userId} - ${reason}`);
  }

  // Remove user from ban list
  static unbanUser(userId) {
    if (SocketAuthMiddleware.bannedUsers) {
      SocketAuthMiddleware.bannedUsers.delete(userId);
      logger.info(`User unbanned: ${userId}`);
    }
  }
}

// Initialize static properties
SocketAuthMiddleware.connectionAttempts = new Map();
SocketAuthMiddleware.bannedUsers = new Set();

// Clean up rate limiting data every minute
setInterval(() => {
  SocketAuthMiddleware.cleanupRateLimit();
}, 60000);

module.exports = SocketAuthMiddleware;