// ============================================================================
// FRONTEND API CLIENT FIX - Create/Update: src/client.ts
// This ensures frontend calls the correct backend endpoints
// ============================================================================

import axios from 'axios';

// ============================================================================
// API CONFIGURATION
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    });
    return Promise.reject(error);
  }
);

// ============================================================================
// API FUNCTIONS - THESE MATCH YOUR BACKEND ROUTES
// ============================================================================

export const api = {
  // Health check
  health: () => apiClient.get('/api/health'),

  // Authentication
  auth: {
    login: (telegramUser: any) => 
      apiClient.post('/api/auth/login', { telegramUser }),
    logout: () => 
      apiClient.post('/api/auth/logout'),
  },

  // User management
  users: {
    getProfile: (userId: string) => 
      apiClient.get(`/api/users/${userId}/profile`),
    updateProfile: (userId: string, profile: any) => 
      apiClient.put(`/api/users/${userId}/profile`, profile),
    uploadWorkout: (userId: string, workoutData: any) => 
      apiClient.post(`/api/users/${userId}/workout`, workoutData),
    getBattles: (userId: string) => 
      apiClient.get(`/api/users/${userId}/battles`),
  },

  // AI Trainers
  trainers: {
    getAll: () => 
      apiClient.get('/api/ai-trainers'),
    getById: (trainerId: string) => 
      apiClient.get(`/api/ai-trainers/${trainerId}`),
    chat: (trainerId: string, message: string, userId: string) => 
      apiClient.post('/api/ai-trainers/chat', { trainerId, message, userId }),
    analyze: (trainerId: string, userId: string) => 
      apiClient.post(`/api/ai-trainers/${trainerId}/analyze`, { userId }),
    workoutComplete: (trainerId: string, workoutData: any, userId: string) => 
      apiClient.post(`/api/ai-trainers/${trainerId}/workout-complete`, { workoutData, userId }),
  },

  // Game/Battle system
  rooms: {
    getAll: () => 
      apiClient.get('/api/rooms'),
    create: (userId: string, config: any) => 
      apiClient.post('/api/rooms', { userId, config }),
    join: (roomId: string, userId: string) => 
      apiClient.post(`/api/rooms/${roomId}/join`, { userId }),
  },

  // Leaderboard
  leaderboard: () => 
    apiClient.get('/api/leaderboard'),

  // File uploads
  upload: {
    workoutImage: (image: string | File, userId: string) => 
      apiClient.post('/api/upload/workout-image', { image, userId }),
  },
};

// ============================================================================
// SOCKET.IO CLIENT SETUP
// ============================================================================

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const createSocketConnection = (userId: string): Socket => {
  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: {
      userId: userId
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log(`🔌 Socket connected: ${socket.id}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error);
  });

  return socket;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await api.health();
    return response.status === 200;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

// ============================================================================
// TYPED INTERFACES FOR BETTER DEVELOPMENT
// ============================================================================

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface UserProfile {
  id: string;
  telegramId: number;
  name: string;
  username?: string;
  level: number;
  stats: {
    strength: number;
    endurance: number;
    speed: number;
  };
  battles: {
    wins: number;
    losses: number;
    draws: number;
  };
}

export interface WorkoutData {
  type: string;
  duration: number;
  exercises: Array<{
    name: string;
    sets?: number;
    reps?: number;
    weight?: number;
    duration?: number;
  }>;
  image?: string;
  timestamp: string;
}

export interface AITrainer {
  id: string;
  name: string;
  specialty: string;
  personality: string;
  experience: string;
  avatar: string;
  description: string;
  stats: {
    strength: number;
    endurance: number;
    intelligence: number;
  };
}

export interface GameRoom {
  id: string;
  name: string;
  creator: string;
  players: string[];
  maxPlayers: number;
  wager?: number;
  status: 'waiting' | 'active' | 'completed';
  config: {
    battleType: string;
    timeLimit?: number;
    private?: boolean;
  };
}

export interface Battle {
  id: string;
  roomId: string;
  players: string[];
  status: 'preparation' | 'active' | 'completed';
  winner?: string;
  wager?: number;
  startTime: string;
  endTime?: string;
}

// ============================================================================
// EXPORT ALL FOR EASY IMPORTING
// ============================================================================

export default apiClient;

// Usage examples:
/*
// In your React components:

import { api, handleApiError, createSocketConnection } from '../client';

// Login example
try {
  const response = await api.auth.login(telegramUser);
  console.log('Login successful:', response.data);
} catch (error) {
  console.error('Login failed:', handleApiError(error));
}

// Get trainers example
try {
  const response = await api.trainers.getAll();
  console.log('Trainers:', response.data.trainers);
} catch (error) {
  console.error('Failed to get trainers:', handleApiError(error));
}

// Socket connection example
const socket = createSocketConnection(userId);
socket.on('room:created', (room) => {
  console.log('Room created:', room);
});

*/