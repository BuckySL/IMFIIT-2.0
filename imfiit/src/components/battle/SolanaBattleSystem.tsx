import React, { useState, useEffect } from 'react';
import { Users, Coins, Swords, Trophy, Clock, Zap, Wallet, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';

// Mock Solana Integration (looks like real contract)
const SolanaGameContract = {
  // Mock program ID (looks real)
  programId: "FiT7G8mQvHvQJqDjEsKYZx9BcR4sKnP2wL3tY8uN5qM9",
  
  // Mock connection
  connection: {
    getBalance: async (publicKey: string) => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return Math.random() * 5 + 0.1; // 0.1-5 SOL
    }
  },

  // Mock transaction functions
  transferSOL: async (from: string, to: string, amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock transaction signature
    const txSignature = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    return {
      signature: txSignature,
      success: Math.random() > 0.1, // 90% success rate
      amount,
      from,
      to,
      timestamp: new Date(),
      fee: 0.000005 // SOL fee
    };
  },

  claimPrize: async (winnerAddress: string, amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      signature: `prize_${Math.random().toString(36).substring(2, 20)}`,
      success: true,
      amount,
      winner: winnerAddress,
      timestamp: new Date()
    };
  }
};

interface BattleUser {
  id: string;
  name: string;
  avatar: string;
  solBalance: number;
  walletAddress: string;
  wins: number;
  losses: number;
  totalWinnings: number;
}

interface BattleRoom {
  id: string;
  name: string;
  wager: number; // SOL amount
  players: BattleUser[];
  maxPlayers: number;
  status: 'waiting' | 'escrow' | 'battle' | 'finished';
  escrowTxId?: string;
  createdBy: string;
}

interface WinningsData {
  totalWinnings: number;
  totalLosses: number;
  netProfit: number;
  winStreak: number;
  bestWin: number;
  recentBattles: Array<{
    id: string;
    opponent: string;
    wager: number;
    result: 'win' | 'loss';
    profit: number;
    timestamp: Date;
    txHash: string;
  }>;
}

interface SolanaBattleSystemProps {
  currentUser: BattleUser;
  onBattleEnd?: (result: any) => void;
}

const SolanaBattleSystem: React.FC<SolanaBattleSystemProps> = ({ 
  currentUser, 
  onBattleEnd 
}) => {
  const [view, setView] = useState<'lobby' | 'room' | 'battle' | 'winnings'>('lobby');
  const [rooms, setRooms] = useState<BattleRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<BattleRoom | null>(null);
  const [wagerAmount, setWagerAmount] = useState(0.1);
  const [battleTimer, setBattleTimer] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [battleResult, setBattleResult] = useState<any>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [winningsData, setWinningsData] = useState<WinningsData | null>(null);

  // Initialize mock data
  useEffect(() => {
    // Mock rooms
    setRooms([
      {
        id: '1',
        name: 'Quick SOL Battle',
        wager: 0.05,
        players: [{
          id: '2',
          name: 'SolanaWarrior',
          avatar: '/public/assets/Fit-male/fit-male-icon.png',
          solBalance: 2.4,
          walletAddress: 'Dt4k8mQvHvQJqDjEsKYZx9BcR4sKnP2wL3tY8uN5qM9',
          wins: 15,
          losses: 3,
          totalWinnings: 5.2
        }],
        maxPlayers: 2,
        status: 'waiting',
        createdBy: '2'
      }
    ]);

    // Mock winnings data
    setWinningsData({
      totalWinnings: 3.45,
      totalLosses: 1.2,
      netProfit: 2.25,
      winStreak: 4,
      bestWin: 0.8,
      recentBattles: [
        {
          id: '1',
          opponent: 'FitCrypto99',
          wager: 0.2,
          result: 'win',
          profit: 0.4,
          timestamp: new Date(Date.now() - 3600000),
          txHash: '5KJdnML7ZQwKpBgKrVB...'
        },
        {
          id: '2', 
          opponent: 'SolFighter',
          wager: 0.15,
          result: 'loss',
          profit: -0.15,
          timestamp: new Date(Date.now() - 7200000),
          txHash: '3HKmkLP9XSwJpCgLrVF...'
        },
        {
          id: '3',
          opponent: 'CryptoGym',
          wager: 0.3,
          result: 'win',
          profit: 0.6,
          timestamp: new Date(Date.now() - 86400000),
          txHash: '8NLprQR5YTwMpFgPrXG...'
        }
      ]
    });
  }, []);

  // Create Room with Escrow
  const createRoom = async () => {
    if (wagerAmount > currentUser.solBalance || wagerAmount < 0.01) return;

    try {
      // Mock escrow transaction
      const escrowTx = await SolanaGameContract.transferSOL(
        currentUser.walletAddress,
        SolanaGameContract.programId,
        wagerAmount
      );

      if (escrowTx.success) {
        const newRoom: BattleRoom = {
          id: Date.now().toString(),
          name: `${currentUser.name}'s Battle`,
          wager: wagerAmount,
          players: [currentUser],
          maxPlayers: 2,
          status: 'escrow',
          escrowTxId: escrowTx.signature,
          createdBy: currentUser.id
        };

        setRooms(prev => [...prev, newRoom]);
        setCurrentRoom(newRoom);
        setView('room');
        
        // Update user balance (mock)
        currentUser.solBalance -= wagerAmount;
      }
    } catch (error) {
      alert('Failed to create escrow. Please try again.');
    }
  };

  // Join Room
  const joinRoom = async (room: BattleRoom) => {
    if (room.wager > currentUser.solBalance) {
      alert('Insufficient SOL balance!');
      return;
    }
    
    try {
      // Mock escrow transaction for joining player
      const escrowTx = await SolanaGameContract.transferSOL(
        currentUser.walletAddress,
        SolanaGameContract.programId,
        room.wager
      );

      if (escrowTx.success) {
        const updatedRoom = {
          ...room,
          players: [...room.players, currentUser],
          status: 'waiting' as const
        };
        
        setCurrentRoom(updatedRoom);
        setView('room');
        
        // Update user balance (mock)
        currentUser.solBalance -= room.wager;
      }
    } catch (error) {
      alert('Failed to join battle. Please try again.');
    }
  };

  // Start Battle
  const startBattle = () => {
    if (!currentRoom || currentRoom.players.length !== 2) return;
    
    setView('battle');
    setBattleTimer(45); // 45 second battle
    
    const timer = setInterval(() => {
      setBattleTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endBattle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // End Battle
  const endBattle = () => {
    const isWinner = Math.random() > 0.5;
    const winner = isWinner ? currentUser : currentRoom?.players[1];
    const loser = isWinner ? currentRoom?.players[1] : currentUser;
    
    const result = {
      winner: winner?.id,
      winnerName: winner?.name,
      winnerAddress: winner?.walletAddress,
      loser: loser?.id,
      loserName: loser?.name,
      wager: currentRoom?.wager,
      totalPrize: (currentRoom?.wager || 0) * 2,
      room: currentRoom?.id,
      isCurrentUserWinner: winner?.id === currentUser.id
    };
    
    setBattleResult(result);
    
    if (result.isCurrentUserWinner) {
      setShowClaimModal(true);
    } else {
      // Auto-redirect after 3 seconds if lost
      setTimeout(() => {
        setView('lobby');
        setBattleResult(null);
        setCurrentRoom(null);
        setPlayerReady(false);
        onBattleEnd?.(result);
      }, 3000);
    }
  };

  // Claim Prize
  const claimPrize = async () => {
    if (!battleResult || claiming) return;
    
    setClaiming(true);
    
    try {
      const claimTx = await SolanaGameContract.claimPrize(
        battleResult.winnerAddress,
        battleResult.totalPrize
      );

      if (claimTx.success) {
        // Update user balance
        currentUser.solBalance += battleResult.totalPrize;
        currentUser.totalWinnings += battleResult.totalPrize;
        currentUser.wins += 1;
        
        alert(`Prize claimed! +${battleResult.totalPrize} SOL`);
        setShowClaimModal(false);
        
        setTimeout(() => {
          setView('lobby');
          setBattleResult(null);
          setCurrentRoom(null);
          setPlayerReady(false);
          onBattleEnd?.(battleResult);
        }, 1000);
      }
    } catch (error) {
      alert('Failed to claim prize. Please try again.');
    }
    
    setClaiming(false);
  };

  // Render Functions
  const renderLobby = () => (
    <div className="battle-lobby">
      <div className="lobby-header">
        <div className="user-info">
          <img src={currentUser.avatar || '/public/assets/Fit-male/fit-male-icon.png'} alt="Avatar" />
          <div>
            <h3>{currentUser.name}</h3>
            <div className="wallet-info">
              <span>💰 {currentUser.solBalance.toFixed(3)} SOL</span>
              <span>🏆 {currentUser.wins}W-{currentUser.losses}L</span>
              <span title={currentUser.walletAddress}>
                📍 {currentUser.walletAddress.substring(0, 6)}...
              </span>
            </div>
          </div>
        </div>
        
        <button 
          className="winnings-btn"
          onClick={() => setView('winnings')}
        >
          <TrendingUp size={16} />
          View Winnings
        </button>
      </div>

      <div className="create-room-section">
        <h3>🔥 Create SOL Battle</h3>
        <div className="wager-input">
          <label>Wager Amount (SOL):</label>
          <input
            type="number"
            min="0.01"
            max={currentUser.solBalance}
            step="0.01"
            value={wagerAmount}
            onChange={(e) => setWagerAmount(parseFloat(e.target.value))}
          />
          <button 
            className="create-btn"
            onClick={createRoom}
            disabled={wagerAmount > currentUser.solBalance || wagerAmount < 0.01}
          >
            Create Battle ({wagerAmount} SOL)
          </button>
        </div>
        <p className="escrow-info">
          💡 Your SOL will be escrowed in our smart contract until battle ends
        </p>
      </div>

      <div className="available-rooms">
        <h3>⚔️ Available Battles</h3>
        {rooms.length === 0 ? (
          <div className="no-rooms">No battles available. Create one!</div>
        ) : (
          <div className="rooms-list">
            {rooms.map(room => (
              <div key={room.id} className="room-card">
                <div className="room-info">
                  <h4>{room.name}</h4>
                  <div className="room-details">
                    <span>💰 {room.wager} SOL</span>
                    <span><Users size={16} /> {room.players.length}/{room.maxPlayers}</span>
                    <span className={`status-${room.status}`}>
                      {room.status === 'escrow' ? '🔒 Escrowed' : '⏳ Waiting'}
                    </span>
                  </div>
                </div>
                <button
                  className="join-btn"
                  onClick={() => joinRoom(room)}
                  disabled={room.wager > currentUser.solBalance || room.players.length >= 2}
                >
                  Join ({room.wager} SOL)
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderWinnings = () => (
    <div className="winnings-dashboard">
      <div className="winnings-header">
        <button className="back-btn" onClick={() => setView('lobby')}>
          ← Back to Battles
        </button>
        <h2>💰 Your Battle Winnings</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card positive">
          <TrendingUp size={24} />
          <div className="stat-info">
            <span className="stat-label">Total Winnings</span>
            <span className="stat-value">+{winningsData?.totalWinnings.toFixed(3)} SOL</span>
          </div>
        </div>

        <div className="stat-card negative">
          <TrendingDown size={24} />
          <div className="stat-info">
            <span className="stat-label">Total Losses</span>
            <span className="stat-value">-{winningsData?.totalLosses.toFixed(3)} SOL</span>
          </div>
        </div>

        <div className="stat-card net-profit">
          <Trophy size={24} />
          <div className="stat-info">
            <span className="stat-label">Net Profit</span>
            <span className="stat-value">
              {winningsData?.netProfit && winningsData.netProfit > 0 ? '+' : ''}
              {winningsData?.netProfit.toFixed(3)} SOL
            </span>
          </div>
        </div>

        <div className="stat-card streak">
          <Zap size={24} />
          <div className="stat-info">
            <span className="stat-label">Win Streak</span>
            <span className="stat-value">{winningsData?.winStreak}</span>
          </div>
        </div>
      </div>

      <div className="recent-battles">
        <h3>🕓 Recent Battle History</h3>
        <div className="battles-list">
          {winningsData?.recentBattles.map((battle, index) => (
            <div key={battle.id} className={`battle-record ${battle.result}`}>
              <div className="battle-info">
                <span className="opponent">vs {battle.opponent}</span>
                <span className="wager">{battle.wager} SOL wager</span>
                <span className="timestamp">
                  {battle.timestamp.toLocaleString()}
                </span>
              </div>
              
              <div className="battle-result">
                <span className={`result-badge ${battle.result}`}>
                  {battle.result === 'win' ? '🏆 WIN' : '💀 LOSS'}
                </span>
                <span className={`profit ${battle.result}`}>
                  {battle.result === 'win' ? '+' : ''}{battle.profit.toFixed(3)} SOL
                </span>
              </div>
              
              <a 
                href={`https://solscan.io/tx/${battle.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-link"
              >
                <ExternalLink size={16} />
                View TX
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoom = () => (
    <div className="battle-room">
      <div className="room-header">
        <h2>{currentRoom?.name}</h2>
        <div className="prize-pool">
          <Coins size={20} />
          Prize Pool: {((currentRoom?.wager || 0) * 2).toFixed(3)} SOL
        </div>
        {currentRoom?.escrowTxId && (
          <div className="escrow-info">
            🔒 Escrowed | TX: {currentRoom.escrowTxId.substring(0, 8)}...
          </div>
        )}
      </div>

      <div className="players-section">
        <h3>Players ({currentRoom?.players.length}/2)</h3>
        <div className="players-grid">
          {currentRoom?.players.map((player) => (
            <div key={player.id} className="player-card">
              <img src={player.avatar} alt={player.name} />
              <h4>{player.name}</h4>
              <div className="player-stats">
                <span>{player.wins}W - {player.losses}L</span>
                <span>💰 {player.solBalance.toFixed(3)} SOL</span>
                {player.id === currentUser.id && (
                  <button 
                    className={`ready-btn ${playerReady ? 'ready' : ''}`}
                    onClick={() => setPlayerReady(!playerReady)}
                  >
                    {playerReady ? '✅ Ready!' : '⏳ Not Ready'}
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {currentRoom && currentRoom.players.length < 2 && (
            <div className="empty-slot">
              <Users size={48} />
              <p>Waiting for opponent...</p>
            </div>
          )}
        </div>
      </div>

      <div className="room-actions">
        <button 
          className="leave-btn"
          onClick={() => setView('lobby')}
        >
          Leave Room
        </button>
        
        {currentRoom?.players.length === 2 && (
          <button 
            className="start-battle-btn"
            onClick={startBattle}
            disabled={!playerReady}
          >
            <Swords size={20} />
            Start Battle!
          </button>
        )}
      </div>
    </div>
  );

  const renderBattle = () => (
    <div className="battle-arena">
      {!battleResult ? (
        <>
          <div className="battle-header">
            <h2>🔥 Solana Battle in Progress!</h2>
            <div className="battle-timer">
              <Clock size={20} />
              {Math.floor(battleTimer / 60)}:{(battleTimer % 60).toString().padStart(2, '0')}
            </div>
            <div className="prize-info">
              Winner takes {((currentRoom?.wager || 0) * 2).toFixed(3)} SOL
            </div>
          </div>

          <div className="battle-field">
            <div className="fighters">
              {currentRoom?.players.map((player, index) => (
                <div key={player.id} className={`fighter fighter-${index}`}>
                  <img src={player.avatar} alt={player.name} />
                  <h3>{player.name}</h3>
                  <div className="health-bar">
                    <div className="health-fill" style={{width: '100%'}}></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="battle-animation">
              <Zap size={64} className="battle-spark" />
              <p>Epic fitness battle on Solana blockchain...</p>
            </div>
          </div>
        </>
      ) : (
        <div className="battle-result">
          <Trophy size={64} />
          <h2>{battleResult.isCurrentUserWinner ? '🎉 You Won!' : '💀 You Lost!'}</h2>
          <p>
            {battleResult.isCurrentUserWinner 
              ? `Prize: ${battleResult.totalPrize.toFixed(3)} SOL` 
              : `Lost: ${battleResult.wager.toFixed(3)} SOL`
            }
          </p>
          
          {battleResult.isCurrentUserWinner && (
            <div className="winner-actions">
              <button 
                className="claim-btn"
                onClick={claimPrize}
                disabled={claiming}
              >
                {claiming ? 'Claiming...' : `Claim ${battleResult.totalPrize.toFixed(3)} SOL`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Claim Prize Modal */}
      {showClaimModal && (
        <div className="modal-overlay">
          <div className="claim-modal">
            <h3>🏆 Claim Your Prize!</h3>
            <p>You won {battleResult?.totalPrize.toFixed(3)} SOL</p>
            <div className="modal-actions">
              <button 
                className="claim-prize-btn"
                onClick={claimPrize}
                disabled={claiming}
              >
                {claiming ? 'Processing...' : 'Claim Prize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="solana-battle-system">
      <style>{`
        .solana-battle-system {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #14101d 0%, #2a1b3d 50%, #44337a 100%);
          min-height: 100vh;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        /* Lobby Styles */
        .battle-lobby {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(147, 51, 234, 0.1);
          padding: 16px;
          border-radius: 12px;
          border: 1px solid rgba(147, 51, 234, 0.3);
        }

        .user-info img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        .wallet-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          color: #c084fc;
        }

        .winnings-btn {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .create-room-section {
          background: rgba(147, 51, 234, 0.1);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(147, 51, 234, 0.3);
        }

        .wager-input {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 12px 0;
          flex-wrap: wrap;
        }

        .wager-input input {
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #6b46c1;
          background: #1f1535;
          color: white;
          width: 120px;
        }

        .create-btn {
          background: linear-gradient(45deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .create-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        .escrow-info {
          font-size: 12px;
          color: #c084fc;
          margin-top: 8px;
        }

        /* Room Cards */
        .rooms-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .room-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(147, 51, 234, 0.2);
        }

        .room-details {
          display: flex;
          gap: 16px;
          align-items: center;
          color: #c084fc;
          font-size: 14px;
        }

        .status-escrow {
          color: #f59e0b !important;
        }

        .join-btn {
          background: linear-gradient(45deg, #06b6d4, #0891b2);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .join-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        /* Winnings Dashboard */
        .winnings-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .winnings-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-btn {
          background: none;
          border: none;
          color: #c084fc;
          font-size: 16px;
          cursor: pointer;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-card.positive {
          border: 1px solid #10b981;
          color: #10b981;
        }

        .stat-card.negative {
          border: 1px solid #ef4444;
          color: #ef4444;
        }

        .stat-card.net-profit {
          border: 1px solid #f59e0b;
          color: #f59e0b;
        }

        .stat-card.streak {
          border: 1px solid #8b5cf6;
          color: #8b5cf6;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.7;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
        }

        /* Battle History */
        .battles-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .battle-record {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 8px;
        }

        .battle-record.win {
          border-left: 4px solid #10b981;
        }

        .battle-record.loss {
          border-left: 4px solid #ef4444;
        }

        .battle-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .opponent {
          font-weight: bold;
        }

        .wager, .timestamp {
          font-size: 12px;
          color: #9ca3af;
        }

        .battle-result {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .result-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }

        .result-badge.win {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .result-badge.loss {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .profit {
          font-weight: bold;
        }

        .profit.win {
          color: #10b981;
        }

        .profit.loss {
          color: #ef4444;
        }

        .tx-link {
          color: #06b6d4;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }

        .tx-link:hover {
          text-decoration: underline;
        }

        /* Battle Room */
        .battle-room {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .room-header {
          text-align: center;
          background: rgba(147, 51, 234, 0.1);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(147, 51, 234, 0.3);
        }

        .prize-pool {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #f59e0b;
          font-size: 18px;
          font-weight: 600;
          margin-top: 8px;
        }

        .escrow-info {
          font-size: 12px;
          color: #c084fc;
          margin-top: 8px;
        }

        .players-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .player-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }

        .player-card img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin-bottom: 12px;
        }

        .player-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          color: #c084fc;
        }

        .ready-btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          margin-top: 8px;
        }

        .ready-btn:not(.ready) {
          background: #ef4444;
          color: white;
        }

        .ready-btn.ready {
          background: #10b981;
          color: white;
        }

        .empty-slot {
          background: rgba(255, 255, 255, 0.02);
          border: 2px dashed #6b46c1;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          color: #9ca3af;
        }

        .room-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .leave-btn {
          background: #6b7280;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
        }

        .start-battle-btn {
          background: linear-gradient(45deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .start-battle-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        /* Battle Arena */
        .battle-arena {
          text-align: center;
          padding: 40px;
        }

        .battle-header {
          margin-bottom: 40px;
        }

        .battle-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 32px;
          font-weight: bold;
          color: #ef4444;
          margin: 16px 0;
        }

        .prize-info {
          color: #f59e0b;
          font-size: 18px;
          font-weight: 600;
        }

        .fighters {
          display: flex;
          justify-content: space-around;
          margin-bottom: 40px;
        }

        .fighter img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin-bottom: 12px;
        }

        .health-bar {
          width: 120px;
          height: 12px;
          background: #374151;
          border-radius: 6px;
          overflow: hidden;
          margin: 0 auto;
        }

        .health-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.3s ease;
        }

        .battle-animation {
          color: #f59e0b;
          font-size: 18px;
        }

        .battle-spark {
          animation: spark 2s infinite alternate;
          color: #9333ea;
        }

        .battle-result {
          color: #10b981;
          padding: 40px;
        }

        .winner-actions {
          margin-top: 24px;
        }

        .claim-btn {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
        }

        .claim-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .claim-modal {
          background: #1f1535;
          padding: 32px;
          border-radius: 16px;
          text-align: center;
          border: 1px solid #9333ea;
        }

        .claim-prize-btn {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          margin-top: 16px;
        }

        .claim-prize-btn:disabled {
          background: #6b7280;
          cursor: not-allowed;
        }

        /* Animations */
        @keyframes spark {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1.3) rotate(360deg); }
        }

        .no-rooms {
          text-align: center;
          color: #9ca3af;
          padding: 40px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .players-grid {
            grid-template-columns: 1fr;
          }
          
          .room-actions {
            flex-direction: column;
            gap: 12px;
          }
          
          .wager-input {
            flex-direction: column;
            align-items: flex-start;
          }

          .lobby-header {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .battle-record {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>

      {view === 'lobby' && renderLobby()}
      {view === 'room' && renderRoom()}
      {view === 'battle' && renderBattle()}
      {view === 'winnings' && renderWinnings()}
    </div>
  );
};

export default SolanaBattleSystem;