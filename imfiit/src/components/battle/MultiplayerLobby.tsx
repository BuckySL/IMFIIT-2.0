// components/battle/MultiplayerLobby.tsx
import React, { useState, useEffect } from 'react';
import { BattleBackground, CharacterSprite } from '../fitness/FitnessComponents';

interface MultiplayerLobbyProps {
  userProfile: any;
  onBackToDashboard: () => void;
}

interface BattleRoom {
  id: string;
  hostId: string;
  hostProfile: any;
  guestId?: string;
  guestProfile?: any;
  status: 'waiting' | 'ready' | 'fighting';
  createdAt: number;
}

export const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({
  userProfile,
  onBackToDashboard
}) => {
  const [mode, setMode] = useState<'lobby' | 'create' | 'join' | 'battle'>('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<BattleRoom | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);

  // Generate simple room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create room
  const createRoom = () => {
    const newRoomCode = generateRoomCode();
    const room: BattleRoom = {
      id: newRoomCode,
      hostId: userProfile.id,
      hostProfile: userProfile,
      status: 'waiting',
      createdAt: Date.now()
    };
    
    // Save room to localStorage (temporary storage)
    localStorage.setItem(`room_${newRoomCode}`, JSON.stringify(room));
    setCurrentRoom(room);
    setRoomCode(newRoomCode);
    setMode('create');
    
    // Start checking for opponent
    checkForOpponent(newRoomCode);
  };

  // Join room
  const joinRoom = () => {
    const savedRoom = localStorage.getItem(`room_${joinCode}`);
    if (!savedRoom) {
      alert('Room not found! Check the code.');
      return;
    }

    const room: BattleRoom = JSON.parse(savedRoom);
    if (room.guestId) {
      alert('Room is full!');
      return;
    }

    // Add self as guest
    room.guestId = userProfile.id;
    room.guestProfile = userProfile;
    room.status = 'ready';
    
    localStorage.setItem(`room_${joinCode}`, JSON.stringify(room));
    setCurrentRoom(room);
    setOpponent(room.hostProfile);
    setIsMyTurn(false); // Guest goes second
    setMode('battle');
    setGameStarted(true);
  };

  // Check for opponent joining (for room creator)
  const checkForOpponent = (code: string) => {
    const interval = setInterval(() => {
      const savedRoom = localStorage.getItem(`room_${code}`);
      if (savedRoom) {
        const room: BattleRoom = JSON.parse(savedRoom);
        if (room.guestId && room.guestProfile) {
          setOpponent(room.guestProfile);
          setCurrentRoom(room);
          setMode('battle');
          setGameStarted(true);
          clearInterval(interval);
        }
      }
    }, 2000); // Check every 2 seconds

    // Clean up after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  // Share room code via Telegram
  const shareRoomCode = () => {
    const message = `🥊 Join my IM FIIT battle!\nRoom Code: ${roomCode}\n\nClick Battle Arena → Join Room → Enter: ${roomCode}`;
    
    if (window.Telegram?.WebApp) {
      // Try to use Telegram sharing
      try {
        window.Telegram.WebApp.openTelegramLink(
          `https://t.me/share/url?url=imfiit.app&text=${encodeURIComponent(message)}`
        );
      } catch {
        // Fallback to copy
        navigator.clipboard.writeText(message);
        alert('Battle code copied to clipboard! Share it with your friend.');
      }
    } else {
      // Browser fallback
      navigator.clipboard.writeText(message);
      alert('Battle code copied to clipboard! Share it with your friend.');
    }
  };

  // Handle battle action
  const handleAction = (action: 'punch' | 'kick') => {
    if (!currentRoom || !isMyTurn) return;
    
    // Simple turn switching
    setIsMyTurn(false);
    
    // Update room state
    const updatedRoom = { ...currentRoom };
    localStorage.setItem(`room_${currentRoom.id}`, JSON.stringify(updatedRoom));
    
    // Switch turns after 2 seconds
    setTimeout(() => {
      setIsMyTurn(true);
    }, 2000);
    
    alert(`You used ${action}! Opponent's turn...`);
  };

  // Render lobby
  if (mode === 'lobby') {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <button 
          onClick={onBackToDashboard}
          style={{
            background: 'none',
            border: 'none', 
            color: '#06b6d4',
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 20
          }}
        >
          ← Back to Dashboard
        </button>

        <h2 style={{ 
          fontSize: 28,
          marginBottom: 8,
          background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🥊 Multiplayer Battle
        </h2>
        
        <p style={{ color: '#d1d5db', marginBottom: 40 }}>
          Challenge your friends to epic battles!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <button
            onClick={createRoom}
            style={{
              background: 'linear-gradient(to right, #10b981, #059669)',
              padding: '20px 30px',
              borderRadius: 12,
              border: 'none',
              color: 'white',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🆕 Create Battle Room
          </button>

          <button
            onClick={() => setMode('join')}
            style={{
              background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
              padding: '20px 30px',
              borderRadius: 12,
              border: 'none',
              color: 'white',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🔗 Join Battle Room
          </button>
        </div>
      </div>
    );
  }

  // Render join room
  if (mode === 'join') {
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        <button 
          onClick={() => setMode('lobby')}
          style={{
            background: 'none',
            border: 'none',
            color: '#06b6d4',
            fontSize: 16,
            cursor: 'pointer',
            marginBottom: 20
          }}
        >
          ← Back to Lobby
        </button>

        <h3 style={{ marginBottom: 20, color: '#06b6d4' }}>Join Battle Room</h3>
        
        <input
          type="text"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Enter room code"
          style={{
            width: '100%',
            padding: 15,
            borderRadius: 8,
            border: '2px solid rgba(6,182,212,0.3)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: 18,
            textAlign: 'center',
            marginBottom: 20
          }}
        />

        <button
          onClick={joinRoom}
          disabled={!joinCode}
          style={{
            background: joinCode ? 'linear-gradient(to right, #3b82f6, #1d4ed8)' : '#64748b',
            padding: '15px 30px',
            borderRadius: 12,
            border: 'none',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor: joinCode ? 'pointer' : 'not-allowed',
            width: '100%'
          }}
        >
          🚀 Join Battle
        </button>
      </div>
    );
  }

  // Render create room (waiting)
  if (mode === 'create' && !gameStarted) {
    return (
      <div style={{ padding: 24, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        <h3 style={{ marginBottom: 20, color: '#10b981' }}>Battle Room Created!</h3>
        
        <div style={{
          background: 'rgba(16,185,129,0.1)',
          border: '2px solid rgba(16,185,129,0.3)',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20
        }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>🏆</div>
          <div style={{ fontSize: 14, color: '#d1d5db', marginBottom: 8 }}>Room Code:</div>
          <div style={{ 
            fontSize: 32, 
            fontWeight: 'bold', 
            color: '#10b981',
            letterSpacing: 4 
          }}>
            {roomCode}
          </div>
        </div>

        <button
          onClick={shareRoomCode}
          style={{
            background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
            padding: '15px 30px',
            borderRadius: 12,
            border: 'none',
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            marginBottom: 20
          }}
        >
          📤 Share with Friend
        </button>

        <div style={{ color: '#d1d5db', fontSize: 14 }}>
          Waiting for opponent to join...
        </div>
        
        <div style={{ fontSize: 30, margin: '20px 0' }}>⏳</div>
      </div>
    );
  }

  // Render battle
  if (mode === 'battle' && opponent) {
    return (
      <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h3 style={{ 
            color: isMyTurn ? '#10b981' : '#fbbf24',
            fontSize: 20,
            marginBottom: 10
          }}>
            {isMyTurn ? '🎯 YOUR TURN' : '⏳ OPPONENT\'S TURN'}
          </h3>
        </div>

        <BattleBackground>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '60px',
            height: 300,
            padding: 20
          }}>
            {/* Player */}
            <div style={{ textAlign: 'center' }}>
              <CharacterSprite 
                bodyType={userProfile.bodyType} 
                currentAnimation="idle" 
                scale={1.3} 
              />
              <div style={{ 
                marginTop: 10,
                color: 'white',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}>
                {userProfile.telegramUser.first_name}
              </div>
            </div>

            {/* Opponent */}
            <div style={{ textAlign: 'center' }}>
              <CharacterSprite 
                bodyType={opponent.bodyType} 
                currentAnimation="idle" 
                scale={1.3} 
                isFlipped 
              />
              <div style={{ 
                marginTop: 10,
                color: 'white',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
              }}>
                {opponent.telegramUser?.first_name || 'Opponent'}
              </div>
            </div>
          </div>
        </BattleBackground>

        {/* Controls */}
        {isMyTurn && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            marginTop: 20
          }}>
            <button
              onClick={() => handleAction('punch')}
              style={{
                background: 'linear-gradient(to right, #ef4444, #dc2626)',
                padding: '15px 25px',
                borderRadius: 12,
                border: 'none',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: 120
              }}
            >
              👊 PUNCH
            </button>
            
            <button
              onClick={() => handleAction('kick')}
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #7c3aed)',
                padding: '15px 25px',
                borderRadius: 12,
                border: 'none',
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                minWidth: 120
              }}
            >
              🦵 KICK
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
};