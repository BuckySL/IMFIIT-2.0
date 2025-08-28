interface BattleRoom {
  id: string;
  hostId: string;
  guestId?: string;
  status: 'waiting' | 'ready' | 'fighting' | 'finished';
  betAmount: number;
  isPrivate: boolean;
  createdAt: Date;
  gameState: MultiplayerGameState;
}

interface MultiplayerGameState {
  currentTurn: string; // userId
  turnTimeLeft: number;
  turnHistory: TurnAction[];
  battleLog: BattleEvent[];
}

interface TurnAction {
  playerId: string;
  action: 'punch' | 'kick' | 'special' | 'timeout';
  timestamp: Date;
  damage?: number;
  hit: boolean;
}