// components/battle/MultiplayerBattle.tsx
import React, { useState, useEffect } from 'react';
import { useMultiplayerBattle } from '../../hooks/useMultiplayerBattle';
import { CharacterSprite, BattleBackground } from '../fitness/FitnessComponents';
import dataService from '../services/DataService';

interface MultiplayerBattleProps {
  userProfile: any;
  onBattleEnd: (result: any) => void;
  onBack: () => void;
}

export const MultiplayerBattle: React.FC<MultiplayerBattleProps> = ({
  userProfile,
  onBattleEnd,
  onBack
}) => {
  const {
    isConnected,
    connectionError,
    currentRoom,
    battleState,
    chatMessages,
    createRoom,
    joinRoom,
    leaveRoom,
    setReady,
    executeAction,
    sendChatMessage
  } = useMultiplayerBattle(userProfile);

  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  const getOpponentData = () => {
  // Get opponent from battleState or currentRoom
  if (battleState?.players) {
    const opponentId = Object.keys(battleState.players).find(id => id !== userProfile.id);
    return battleState.players[opponentId];
  }
  
  if (currentRoom?.players) {
    return currentRoom.players.find(p => p.id !== userProfile.id);
  }
  
  return null;
};

const getOpponentBodyType = () => {
  const opponent = getOpponentData();
  return opponent?.bodyType || 'fit-male';
};

const getOpponentName = () => {
  const opponent = getOpponentData();
  return opponent?.telegramUser?.first_name || opponent?.name || 'Opponent';
};

const getOpponentAnimation = () => {
  if (battleState?.animations) {
    const opponentId = Object.keys(battleState.players || {}).find(id => id !== userProfile.id);
    return battleState.animations[opponentId] || 'idle';
  }
  return 'idle';
};

const getMyAnimation = () => {
  if (battleState?.animations) {
    return battleState.animations[userProfile.id] || 'idle';
  }
  return 'idle';
};

const getMyHealth = () => {
  if (battleState?.players?.[userProfile.id]) {
    return battleState.players[userProfile.id].health;
  }
  return 100;
};

const getOpponentHealth = () => {
  const opponent = getOpponentData();
  return opponent?.health || 100;
};
  // Handle battle end
  useEffect(() => {
    if (battleState?.status === 'finished') {
      setTimeout(() => {
        onBattleEnd(battleState.result);
      }, 3000); // Show result for 3 seconds
    }
  }, [battleState?.status, onBattleEnd]);

  // Connection status display
  if (!isConnected) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            background: 'none',
            border: 'none',
            color: '#06b6d4',
            fontSize: 16,
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🔌</div>
          <h2>Connecting to Battle Server...</h2>
          {connectionError && (
            <div style={{
              background: 'rgba(239,68,68,0.2)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: 16,
              marginTop: 20,
              color: '#f87171'
            }}>
              Connection failed: {connectionError}
              <br />
              Make sure backend is running on http://localhost:3001
            </div>
          )}
          <div style={{ marginTop: 20, color: '#9ca3af' }}>
            Attempting to connect to multiplayer server...
          </div>
        </div>
      </div>
    );
  }

  // Room lobby - no room joined yet
  if (!currentRoom) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        color: 'white',
        padding: 24
      }}>
        <button
          onClick={onBack}
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

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{
              fontSize: 32,
              fontWeight: 'bold',
              background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Multiplayer Battle Lobby
            </h1>
            <div style={{
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8,
              padding: 12,
              color: '#4ade80',
              display: 'inline-block',
              marginTop: 16
            }}>
              ✅ Connected to server • Ready to battle!
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 24
          }}>
            {/* Create Room */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 24,
              backdropFilter: 'blur(8px)'
            }}>
              <h3 style={{ marginBottom: 16, color: '#06b6d4' }}>🏠 Create Battle Room</h3>
              <p style={{ color: '#d1d5db', marginBottom: 20, fontSize: 14 }}>
                Create a new room and wait for an opponent to join
              </p>
              <button
                onClick={() => createRoom()}
                style={{
                  width: '100%',
                  background: 'linear-gradient(45deg, #06b6d4, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Create Room
              </button>
            </div>

            {/* Join Room */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: 24,
              backdropFilter: 'blur(8px)'
            }}>
              <h3 style={{ marginBottom: 16, color: '#10b981' }}>🚪 Join Battle Room</h3>
              <p style={{ color: '#d1d5db', marginBottom: 20, fontSize: 14 }}>
                Enter a room ID to join an existing battle
              </p>
              <input
                type="text"
                placeholder="Enter Room ID..."
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  padding: 12,
                  color: 'white',
                  marginBottom: 16,
                  fontSize: 14
                }}
              />
              <button
                onClick={() => selectedRoomId && joinRoom(selectedRoomId)}
                disabled={!selectedRoomId}
                style={{
                  width: '100%',
                  background: selectedRoomId 
                    ? 'linear-gradient(45deg, #10b981, #059669)' 
                    : 'rgba(100,100,100,0.3)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 24px',
                  borderRadius: 12,
                  fontSize: 16,
                  fontWeight: 'bold',
                  cursor: selectedRoomId ? 'pointer' : 'not-allowed',
                  opacity: selectedRoomId ? 1 : 0.5
                }}
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            background: 'rgba(139,92,246,0.1)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 12,
            padding: 20,
            marginTop: 32,
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#a78bfa', marginBottom: 12 }}>💡 How to Play</h4>
            <p style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1.6 }}>
              Create a room to host a battle, or join an existing room using its ID. 
              Once both players are ready, the turn-based fitness battle begins!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // In room - waiting for players/battle
  if (currentRoom && !battleState) {
    const isHost = currentRoom.hostId === userProfile.id;
    const hasOpponent = currentRoom.guestId;
    
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        color: 'white',
        padding: 24
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <button
              onClick={() => { leaveRoom(); onBack(); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#06b6d4',
                fontSize: 16,
                cursor: 'pointer'
              }}
            >
              ← Leave Room
            </button>
            
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 12,
              color: '#d1d5db'
            }}>
              Room ID: {currentRoom.id.slice(0, 8)}...
            </div>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: 'bold',
              marginBottom: 16
            }}>
              Battle Room
            </h1>

            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}>
                {/* Host */}
                <div style={{
                  background: 'rgba(34,197,94,0.2)',
                  border: '2px solid rgba(34,197,94,0.3)',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#4ade80', marginBottom: 8 }}>HOST</div>
                  <div style={{ fontWeight: 'bold' }}>
                    {isHost ? 'You' : 'Player 1'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    Level {userProfile.stats?.level || 1}
                  </div>
                </div>

                {/* Guest */}
                <div style={{
                  background: hasOpponent 
                    ? 'rgba(34,197,94,0.2)' 
                    : 'rgba(100,100,100,0.2)',
                  border: hasOpponent 
                    ? '2px solid rgba(34,197,94,0.3)' 
                    : '2px dashed rgba(100,100,100,0.3)',
                  borderRadius: 12,
                  padding: 16
                }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>GUEST</div>
                  <div style={{ fontWeight: 'bold' }}>
                    {hasOpponent 
                      ? (!isHost ? 'You' : 'Player 2')
                      : 'Waiting for player...'
                    }
                  </div>
                  {hasOpponent && (
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                      Level 1
                    </div>
                  )}
                </div>
              </div>

              {hasOpponent ? (
                <div>
                  <div style={{
                    background: 'rgba(34,197,94,0.2)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    color: '#4ade80'
                  }}>
                    ✅ Both players connected! Ready to battle?
                  </div>
                  
                  <button
                    onClick={setReady}
                    style={{
                      background: 'linear-gradient(45deg, #ef4444, #dc2626)',
                      color: 'white',
                      border: 'none',
                      padding: '16px 32px',
                      borderRadius: 12,
                      fontSize: 18,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    ⚔️ READY TO FIGHT!
                  </button>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(251,191,36,0.2)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  borderRadius: 8,
                  padding: 16,
                  color: '#fbbf24'
                }}>
                  ⏳ Waiting for opponent to join...
                  <div style={{ fontSize: 12, marginTop: 8, color: '#d1d5db' }}>
                    Share room ID: <code>{currentRoom.id}</code>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          {hasOpponent && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              marginTop: 32
            }}>
              <button
                onClick={() => setShowChat(!showChat)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#06b6d4',
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 12
                }}
              >
                💬 {showChat ? 'Hide' : 'Show'} Chat
              </button>
              
              {showChat && (
                <div>
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    height: 100,
                    overflowY: 'auto',
                    fontSize: 12
                  }}>
                    {chatMessages.map((msg, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>
                          {msg.username}:
                        </span>
                        <span style={{ marginLeft: 8 }}>{msg.message}</span>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                        No messages yet...
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatMessage.trim()) {
                          sendChatMessage(chatMessage);
                          setChatMessage('');
                        }
                      }}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 6,
                        padding: 8,
                        color: 'white',
                        fontSize: 12
                      }}
                    />
                    <button
                      onClick={() => {
                        if (chatMessage.trim()) {
                          sendChatMessage(chatMessage);
                          setChatMessage('');
                        }
                      }}
                      style={{
                        background: '#06b6d4',
                        border: 'none',
                        borderRadius: 6,
                        padding: '8px 12px',
                        color: 'white',
                        fontSize: 12,
                        cursor: 'pointer'
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active battle
  if (battleState) {
    const isMyTurn = battleState.currentTurn === userProfile.id;
    const myHealth = battleState.currentHealth?.[userProfile.id] || 100;
    const opponentId = Object.keys(battleState.currentHealth || {}).find(id => id !== userProfile.id);
    const opponentHealth = battleState.currentHealth?.[opponentId] || 100;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #000000 100%)',
        color: 'white',
        padding: 24
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          {/* Battle Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 12,
            padding: 20
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#06b6d4', marginBottom: 8 }}>YOU</div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                height: 20,
                marginBottom: 8,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${myHealth}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ef4444, #22c55e)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ fontSize: 12 }}>Health: {myHealth}/100</div>
            </div>

            <div style={{ textAlign: 'center', margin: '0 40px' }}>
              <div style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: isMyTurn ? '#22c55e' : '#ef4444',
                marginBottom: 8
              }}>
                {isMyTurn ? 'YOUR TURN' : 'OPPONENT TURN'}
              </div>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fbbf24' }}>
                {battleState.turnTimeLeft || 30}s
              </div>
            </div>

            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 8 }}>OPPONENT</div>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                height: 20,
                marginBottom: 8,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${opponentHealth}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #ef4444, #22c55e)',
                  transition: 'width 0.5s ease'
                }} />
              </div>
              <div style={{ fontSize: 12 }}>Health: {opponentHealth}/100</div>
            </div>
          </div>

          {/* Battle Arena */}
<BattleBackground style={{
  borderRadius: 16,
  marginBottom: 32,
  minHeight: 300
}}>
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 40,
    height: '100%'
  }}>
    {/* Player Avatar */}
    <div style={{ textAlign: 'center' }}>
      <CharacterSprite 
        bodyType={userProfile.bodyType || 'fit-male'} 
        currentAnimation={getMyAnimation()} 
        scale={1.5} 
      />
      <div style={{ marginTop: 8, fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
        {userProfile.telegramUser?.first_name || 'You'}
      </div>
      <div style={{ fontSize: 12, color: '#4ade80' }}>
        HP: {getMyHealth()}/100
      </div>
    </div>

    {/* VS Text */}
    <div style={{ 
      fontSize: 48, 
      color: '#ef4444', 
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
      transform: 'rotate(-10deg)'
    }}>
      VS
    </div>

    {/* Opponent Avatar */}
    <div style={{ textAlign: 'center' }}>
      <CharacterSprite 
        bodyType={getOpponentBodyType()} 
        currentAnimation={getOpponentAnimation()} 
        scale={1.5} 
        isFlipped 
      />
      <div style={{ marginTop: 8, fontWeight: 'bold', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
        {getOpponentName()}
      </div>
      <div style={{ fontSize: 12, color: '#ef4444' }}>
        HP: {getOpponentHealth()}/100
      </div>
    </div>
  </div>
</BattleBackground>


          {/* Battle Actions */}
          {isMyTurn && battleState.status !== 'finished' && (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
    marginBottom: 32
  }}>
    <button
      onClick={() => executeAction('punch')}
      style={{
        background: 'linear-gradient(45deg, #ef4444, #dc2626)',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        padding: '20px 16px',
        fontSize: 16,
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 4 }}>👊</div>
      <div>PUNCH</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>15 damage • 10 energy</div>
    </button>

    <button
      onClick={() => executeAction('kick')}
      style={{
        background: 'linear-gradient(45deg, #f59e0b, #d97706)',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        padding: '20px 16px',
        fontSize: 16,
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 4 }}>🦵</div>
      <div>KICK</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>20 damage • 15 energy</div>
    </button>

    <button
      onClick={() => executeAction('special')}
      style={{
        background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        padding: '20px 16px',
        fontSize: 16,
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 4 }}>⚡</div>
      <div>SPECIAL</div>
      <div style={{ fontSize: 12, opacity: 0.8 }}>30 damage • 25 energy</div>
    </button>
  </div>
)}

          {/* Battle Result */}
         {battleState?.battleLog && (
  <div style={{
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    maxHeight: 150,
    overflowY: 'auto'
  }}>
    <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#06b6d4' }}>
      Battle Log
    </div>
    {battleState.battleLog.slice(-5).map((log, index) => (
      <div key={index} style={{
        fontSize: 12,
        color: '#d1d5db',
        marginBottom: 4,
        padding: '4px 8px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 4
      }}>
        {log}
      </div>
    ))}
  </div>
)}
          {/* Last Action Display */}
          {battleState.lastAction && (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 14, color: '#d1d5db' }}>
                Last Action: <strong>{battleState.lastAction.action.toUpperCase()}</strong>
                {battleState.lastAction.hit ? (
                  <span style={{ color: '#ef4444' }}> • {battleState.lastAction.damage} damage!</span>
                ) : (
                  <span style={{ color: '#9ca3af' }}> • Missed!</span>
                )}
                {battleState.lastAction.critical && (
                  <span style={{ color: '#fbbf24' }}> • CRITICAL HIT!</span>
                )}
              </div>
            </div>
          )}

          {/* Turn Info */}
          {!isMyTurn && battleState.status !== 'finished' && (
            <div style={{
              textAlign: 'center',
              background: 'rgba(251,191,36,0.2)',
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 12,
              padding: 20,
              color: '#fbbf24'
            }}>
              ⏳ Waiting for opponent's move...
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};