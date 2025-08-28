// components/battle/MatchmakingLobby.tsx
interface MatchmakingLobbyProps {
  onCreateRoom: (config: CreateRoomConfig) => void;
  onJoinRoom: (roomId: string) => void;
}

export const MatchmakingLobby: React.FC<MatchmakingLobbyProps> = ({
  onCreateRoom,
  onJoinRoom
}) => {
  const [betAmount, setBetAmount] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  return (
    <div className="matchmaking-lobby">
      <h2>🥊 Multiplayer Battle</h2>
      
      {/* Create Room */}
      <div className="create-room-section">
        <h3>Create Battle Room</h3>
        <div className="bet-selector">
          <label>Bet Amount:</label>
          <input 
            type="number" 
            value={betAmount} 
            onChange={(e) => setBetAmount(Number(e.target.value))}
            placeholder="0 (Optional)"
          />
        </div>
        <div className="privacy-toggle">
          <label>
            <input 
              type="checkbox" 
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Private Room
          </label>
        </div>
        <button 
          onClick={() => onCreateRoom({ betAmount, isPrivate })}
          className="create-room-btn"
        >
          🆕 Create Room
        </button>
      </div>

      {/* Join Room */}
      <div className="join-room-section">
        <h3>Join Battle Room</h3>
        <input 
          type="text"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          placeholder="Enter Room ID"
        />
        <button 
          onClick={() => onJoinRoom(joinRoomId)}
          disabled={!joinRoomId}
          className="join-room-btn"
        >
          🔗 Join Room
        </button>
      </div>

      {/* Quick Match */}
      <div className="quick-match-section">
        <button 
          onClick={() => onCreateRoom({ betAmount: 0, isPrivate: false })}
          className="quick-match-btn"
        >
          ⚡ Quick Match
        </button>
      </div>
    </div>
  );
};