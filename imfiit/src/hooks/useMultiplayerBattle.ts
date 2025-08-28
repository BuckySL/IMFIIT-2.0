// hooks/useMultiplayerBattle.ts
import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ServerToClientEvents {
  'room:created': (room: BattleRoom) => void;
  'room:joined': (room: BattleRoom) => void;
  'room:updated': (room: BattleRoom) => void;
  'battle:started': (battle: any) => void;
  'battle:turn': (result: any) => void;
  'battle:ended': (result: any) => void;
  'player:joined': (player: any) => void;
  'player:left': (playerId: string) => void;
  'chat:message': (message: any) => void;
  'error': (error: string) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: any) => void;
}

interface ClientToServerEvents {
  'room:create': (config: CreateRoomConfig) => void;
  'room:join': (roomId: string) => void;
  'room:leave': () => void;
  'room:ready': (roomId: string) => void;
  'battle:action': (action: any) => void;
  'chat:message': (data: { message: string }) => void;
}

export const useMultiplayerBattle = (userProfile: any) => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents>>();
  const [currentRoom, setCurrentRoom] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [battleState, setBattleState] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile?.id) {
      console.log('❌ No user profile provided');
      return;
    }

    console.log('🔌 Connecting to backend with user:', userProfile.id);

    // Connect to your backend
    const newSocket = io('http://localhost:3001', {
      auth: {
        userProfile: {
          id: userProfile.id,
          telegramUser: userProfile.telegramUser || {
            id: userProfile.id,
            first_name: userProfile.telegramUser?.first_name || 'Player'
          },
          stats: userProfile.stats || {
            level: 1,
            strength: 50,
            endurance: 50,
            experience: 0
          },
          bodyType: userProfile.bodyType || 'fit-male'
        }
      },
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to backend! Socket ID:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from backend:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error.message);
      setIsConnected(false);
      setConnectionError(error.message);
    });

    // Room events
    newSocket.on('room:created', (room) => {
      console.log('🏠 Room created:', room);
      setCurrentRoom(room);
    });

    newSocket.on('room:joined', (room) => {
      console.log('🚪 Room joined:', room);
      setCurrentRoom(room);
    });

    newSocket.on('room:updated', (room) => {
      console.log('📊 Room updated:', room);
      setCurrentRoom(room);
    });

    // Battle events
    newSocket.on('battle:started', (battle) => {
      console.log('⚔️ Battle started:', battle);
      setBattleState(battle);
    });

    newSocket.on('battle:turn', (result) => {
      console.log('🥊 Battle turn result:', result);
      setBattleState(prev => ({
        ...prev,
        ...result,
        lastAction: result
      }));
    });

    newSocket.on('battle:ended', (result) => {
      console.log('🏆 Battle ended:', result);
      setBattleState(prev => ({
        ...prev,
        status: 'finished',
        result
      }));
    });

    // Player events
    newSocket.on('player:joined', (player) => {
      console.log('👥 Player joined:', player);
    });

    newSocket.on('player:left', (playerId) => {
      console.log('👋 Player left:', playerId);
    });

    // Chat events
    newSocket.on('chat:message', (message) => {
      console.log('💬 Chat message:', message);
      setChatMessages(prev => [...prev, message]);
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.log('⚠️ Socket error:', error);
      setConnectionError(error);
    });

    setSocket(newSocket);

    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.close();
    };
  }, [userProfile?.id]);

  const createRoom = useCallback((config: any = {}) => {
    if (!socket || !isConnected) {
      console.log('❌ Cannot create room: not connected');
      return;
    }

    console.log('🏠 Creating room with config:', config);
    socket.emit('room:create', {
      betAmount: config.betAmount || 0,
      isPrivate: config.isPrivate || false,
      ...config
    });
  }, [socket, isConnected]);

  const joinRoom = useCallback((roomId: string) => {
    if (!socket || !isConnected) {
      console.log('❌ Cannot join room: not connected');
      return;
    }

    console.log('🚪 Joining room:', roomId);
    socket.emit('room:join', roomId);
  }, [socket, isConnected]);

  const leaveRoom = useCallback(() => {
    if (!socket) return;

    console.log('👋 Leaving room');
    socket.emit('room:leave');
    setCurrentRoom(null);
    setBattleState(null);
  }, [socket]);

  const setReady = useCallback(() => {
    if (!socket || !currentRoom) {
      console.log('❌ Cannot set ready: no room');
      return;
    }

    console.log('🟢 Setting player ready');
    socket.emit('room:ready', currentRoom.id);
  }, [socket, currentRoom]);

  const executeAction = useCallback((action: any) => {
    if (!socket || !isConnected) {
      console.log('❌ Cannot execute action: not connected');
      return;
    }

    console.log('⚔️ Executing battle action:', action);
    socket.emit('battle:action', {
      action: action.action || action,
      timestamp: new Date()
    });
  }, [socket, isConnected]);

  const sendChatMessage = useCallback((message: string) => {
    if (!socket || !isConnected) {
      console.log('❌ Cannot send chat: not connected');
      return;
    }

    console.log('💬 Sending chat message:', message);
    socket.emit('chat:message', { message });
  }, [socket, isConnected]);

  return {
    // Connection state
    socket,
    isConnected,
    connectionError,

    // Room state
    currentRoom,
    
    // Battle state
    battleState,
    
    // Chat
    chatMessages,
    
    // Actions
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    executeAction,
    sendChatMessage
  };
};