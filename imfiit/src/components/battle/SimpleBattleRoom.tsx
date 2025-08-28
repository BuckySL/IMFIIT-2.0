// ============================================================================
// FIXED SIMPLE BATTLE ROOM - Replace your MultiplayerBattle.tsx with this
// ============================================================================

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface SimpleBattleProps {
  userProfile: any;
  onBattleEnd: (result: any) => void;
  onBack: () => void;
}

interface Room {
  id: string;
  creator: any;
  players: any[];
  wager: number;
  status: 'waiting' | 'ready' | 'fighting' | 'finished';
  maxPlayers: 2;
}

interface BattleState {
  id: string;
  players: { [key: string]: any };
  currentTurn: string;
  turnTimeLeft: number;
  status: 'fighting' | 'finished';
  winner?: string;
  battleLog: string[];
}

export const SimpleBattleRoom: React.FC<SimpleBattleProps> = ({ 
  userProfile, 
  onBattleEnd, 
  onBack 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [userTokens] = useState(1000); // Mock tokens - replace with real wallet balance
  const [error, setError] = useState<string>('');

  // Socket connection
  useEffect(() => {
    if (!userProfile) {
      setError('User profile not loaded');
      return;
    }

    const newSocket = io('http://localhost:3001', {
      auth: { userProfile },
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to battle server');
      setIsConnected(true);
      setError('');
      loadAvailableRooms();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Reconnection required
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to battle server');
    });

    // Room events
    newSocket.on('room:created', (room: Room) => {
      if (room && room.id) {
        setCurrentRoom(room);
        console.log('Room created:', room);
      }
    });

    newSocket.on('room:joined', (room: Room) => {
      if (room && room.id) {
        setCurrentRoom(room);
        console.log('Joined room:', room);
      }
    });

    newSocket.on('room:updated', (room: Room) => {
      if (room && room.id) {
        setCurrentRoom(room);
        if (room.status === 'ready' && room.players && room.players.length === 2) {
          console.log('Room ready - battle starting soon');
        }
      }
    });

    // Battle events
    newSocket.on('battle:started', (battle: BattleState) => {
      if (battle && battle.id) {
        setBattleState(battle);
        console.log('Battle started:', battle);
      }
    });

    newSocket.on('battle:turn', (result: any) => {
      if (result) {
        setBattleState(prev => prev ? { ...prev, ...result } : null);
      }
    });

    newSocket.on('battle:ended', (result: any) => {
      console.log('Battle ended:', result);
      if (result) {
        setBattleState(prev => prev ? { ...prev, status: 'finished', winner: result.winner } : null);
        setTimeout(() => onBattleEnd(result), 3000);
      }
    });

    newSocket.on('rooms:list', (rooms: Room[]) => {
      setAvailableRooms(Array.isArray(rooms) ? rooms : []);
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
      setError(error.message || 'Battle server error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userProfile, onBattleEnd]);

  const loadAvailableRooms = () => {
    if (socket && socket.connected) {
      socket.emit('rooms:get');
    }
  };

  const createRoom = () => {
    if (!socket || !socket.connected || wagerAmount > userTokens || wagerAmount < 10) return;
    
    socket.emit('room:create', {
      wager: wagerAmount,
      maxPlayers: 2,
      createdBy: userProfile?.id || userProfile?.telegramId
    });
  };

  const joinRoom = (roomId: string) => {
    if (!socket || !socket.connected || !roomId) return;
    
    const room = availableRooms.find(r => r?.id === roomId);
    if (!room || room.wager > userTokens) return;
    
    socket.emit('room:join', roomId);
  };

  const leaveRoom = () => {
    if (!socket || !socket.connected || !currentRoom) return;
    
    socket.emit('room:leave', currentRoom.id);
    setCurrentRoom(null);
  };

  const readyForBattle = () => {
    if (!socket || !socket.connected || !currentRoom) return;
    
    socket.emit('room:ready', currentRoom.id);
  };

  const performAction = (action: 'attack' | 'defend' | 'special') => {
    if (!socket || !socket.connected || !battleState || battleState.currentTurn !== (userProfile?.id || userProfile?.telegramId)) return;
    
    socket.emit('battle:action', {
      battleId: battleState.id,
      action,
      playerId: userProfile?.id || userProfile?.telegramId
    });
  };

  // Error screen
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2>Connection Error</h2>
          <p style={{ color: '#ef4444', marginBottom: '20px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              background: '#10b981', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '5px', 
              cursor: 'pointer' 
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Connection screen
  if (!isConnected) {
    return (
      <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔌</div>
          <h2>Connecting to Battle Server...</h2>
          <div style={{ marginTop: '15px', color: '#9ca3af' }}>
            Make sure your backend server is running on port 3001
          </div>
        </div>
      </div>
    );
  }

  // Battle screen
  if (battleState && battleState.status === 'fighting') {
    const opponent = Object.values(battleState.players || {}).find((p: any) => 
      p?.id !== userProfile?.id && p?.id !== userProfile?.telegramId
    ) as any;
    const myPlayerId = userProfile?.id || userProfile?.telegramId;
    const myPlayer = battleState.players?.[myPlayerId];
    const isMyTurn = battleState.currentTurn === myPlayerId;

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)', color: 'white' }}>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Battle Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '2em', marginBottom: '10px' }}>⚔️ BATTLE IN PROGRESS</h1>
            <div style={{ color: isMyTurn ? '#10b981' : '#ef4444' }}>
              {isMyTurn ? "YOUR TURN" : `${opponent?.name || "OPPONENT"}'S TURN`}
            </div>
            <div style={{ color: '#9ca3af' }}>Time: {battleState.turnTimeLeft || 30}s</div>
          </div>

          {/* Players */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '40px' }}>
            {/* You */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4em', marginBottom: '10px' }}>
                {userProfile?.bodyType?.includes('male') ? '🥊' : '👩‍🎤'}
              </div>
              <h3>{userProfile?.telegramUser?.first_name || userProfile?.name || 'You'} (YOU)</h3>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                <div>❤️ Health: {myPlayer?.health || 100}/100</div>
                <div>💪 Strength: {userProfile?.stats?.strength || 50}</div>
                <div>🏃 Endurance: {userProfile?.stats?.endurance || 50}</div>
              </div>
            </div>

            {/* Opponent */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4em', marginBottom: '10px' }}>
                {opponent?.bodyType?.includes('male') ? '🥊' : '👩‍🎤'}
              </div>
              <h3>{opponent?.name || 'Opponent'}</h3>
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                <div>❤️ Health: {opponent?.health || 100}/100</div>
                <div>💪 Strength: {opponent?.stats?.strength || 50}</div>
                <div>🏃 Endurance: {opponent?.stats?.endurance || 50}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isMyTurn && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
              <button
                onClick={() => performAction('attack')}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                ⚔️ ATTACK
              </button>
              <button
                onClick={() => performAction('defend')}
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                🛡️ DEFEND
              </button>
              <button
                onClick={() => performAction('special')}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                ⚡ SPECIAL
              </button>
            </div>
          )}

          {/* Battle Log */}
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            <h4>Battle Log:</h4>
            {battleState.battleLog && Array.isArray(battleState.battleLog) ? 
              battleState.battleLog.slice(-5).map((log, i) => (
                <div key={i} style={{ margin: '5px 0', fontSize: '14px' }}>{log}</div>
              )) : 
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>Battle starting...</div>
            }
          </div>
        </div>
      </div>
    );
  }

  // Room screen
  if (currentRoom) {
    const roomPlayers = currentRoom.players || [];
    const playersCount = roomPlayers.length;

    return (
      <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', padding: '20px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#06b6d4', marginBottom: '20px', cursor: 'pointer' }}>
          ← Back
        </button>
        
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1>Battle Room</h1>
          <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '30px', borderRadius: '15px', marginBottom: '30px' }}>
            <div style={{ fontSize: '3em', marginBottom: '15px' }}>💰</div>
            <h3>Wager: {currentRoom.wager} tokens</h3>
            <p>Winner takes all!</p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: playersCount === 2 ? '1fr 1fr' : '1fr', 
            gap: '20px', 
            marginBottom: '30px' 
          }}>
            {roomPlayers.map((player, index) => (
              <div key={player?.id || index} style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '10px' }}>
                <div style={{ fontSize: '3em', marginBottom: '10px' }}>
                  {player?.bodyType?.includes('male') ? '🥊' : '👩‍🎤'}
                </div>
                <h4>{player?.telegramUser?.first_name || player?.name || `Player ${index + 1}`}</h4>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Level {player?.stats?.level || 1} • STR: {player?.stats?.strength || 50} • END: {player?.stats?.endurance || 50}
                </div>
              </div>
            ))}
            
            {playersCount === 1 && (
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '20px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div>
                  <div style={{ fontSize: '3em', marginBottom: '10px' }}>⏳</div>
                  <div>Waiting for opponent...</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={leaveRoom} 
              style={{ 
                background: '#ef4444', 
                color: 'white', 
                border: 'none', 
                padding: '12px 24px', 
                borderRadius: '8px', 
                cursor: 'pointer' 
              }}
            >
              Leave Room
            </button>
            {playersCount === 2 && (
              <button 
                onClick={readyForBattle} 
                style={{ 
                  background: '#10b981', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px', 
                  cursor: 'pointer' 
                }}
              >
                Ready to Fight!
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main lobby screen
  const roomsToShow = Array.isArray(availableRooms) ? availableRooms : [];

  return (
    <div style={{ minHeight: '100vh', background: '#1f2937', color: 'white', padding: '20px' }}>
      <button 
        onClick={onBack} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: '#06b6d4', 
          marginBottom: '20px', 
          cursor: 'pointer' 
        }}
      >
        ← Back to Dashboard
      </button>
      
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>⚔️ Battle Arena</h1>
          <p>Create or join a battle room to fight other players!</p>
          <div style={{ marginTop: '15px', color: '#10b981' }}>Your Balance: {userTokens} tokens</div>
        </div>

        {/* Create Room */}
        <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '30px', borderRadius: '15px', marginBottom: '30px' }}>
          <h3>Create New Battle Room</h3>
          <div style={{ margin: '20px 0' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>Wager Amount:</label>
            <input
              type="number"
              value={wagerAmount}
              onChange={(e) => setWagerAmount(Number(e.target.value))}
              min="10"
              max={userTokens}
              style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                border: '1px solid rgba(255, 255, 255, 0.2)', 
                color: 'white', 
                padding: '10px', 
                borderRadius: '5px',
                width: '120px'
              }}
            />
            <span style={{ marginLeft: '10px', color: '#9ca3af' }}>tokens</span>
          </div>
          <button 
            onClick={createRoom}
            disabled={wagerAmount > userTokens || wagerAmount < 10}
            style={{ 
              background: wagerAmount > userTokens || wagerAmount < 10 ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)', 
              color: 'white', 
              border: 'none', 
              padding: '15px 30px', 
              borderRadius: '10px', 
              fontSize: '16px',
              fontWeight: '600',
              cursor: (wagerAmount > userTokens || wagerAmount < 10) ? 'not-allowed' : 'pointer'
            }}
          >
            Create Room
          </button>
        </div>

        {/* Available Rooms */}
        <div>
          <h3>Available Battle Rooms</h3>
          {roomsToShow.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ fontSize: '3em', marginBottom: '15px' }}>🏟️</div>
              <p>No rooms available. Create one to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {roomsToShow.map((room) => (
                <div key={room?.id || Math.random()} style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                      {room?.creator?.telegramUser?.first_name || room?.creator?.name || 'Anonymous'}'s Room
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      Wager: {room?.wager || 0} tokens • Players: {room?.players?.length || 0}/{room?.maxPlayers || 2}
                    </div>
                  </div>
                  <button
                    onClick={() => joinRoom(room?.id)}
                    disabled={!room?.id || (room.wager || 0) > userTokens}
                    style={{
                      background: (!room?.id || (room.wager || 0) > userTokens) ? '#6b7280' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      cursor: (!room?.id || (room.wager || 0) > userTokens) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {(!room?.id || (room.wager || 0) > userTokens) ? 'Too Expensive' : 'Join Battle'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};