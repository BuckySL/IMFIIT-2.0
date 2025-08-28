// Game Types for IM FIIT Battle System

// Game Types for IM FIIT Battle System
import type { UserProfile } from './user';

export type GameStatus = 'waiting' | 'ready' | 'active' | 'paused' | 'finished' | 'cancelled';
export type AttackType = 'basic' | 'special';
export type TurnPhase = 'select' | 'attack' | 'damage' | 'end';

export interface Player {
  profile: UserProfile;
  character: Character;
  health: number;
  maxHealth: number;
  energy: number; // For special attacks
  maxEnergy: number;
  position: 'left' | 'right';
  isReady: boolean;
}

export interface Character {
  bodyType: string;
  sprites: CharacterSprites;
  animations: CharacterAnimations;
  stats: CharacterStats;
}

export interface CharacterSprites {
  idle: string;
  attack1: string;
  attack2: string;
  special: string;
  hurt: string;
  victory: string;
  defeat: string;
}

export interface CharacterAnimations {
  idle: Animation;
  attack: Animation;
  special: Animation;
  hurt: Animation;
  victory: Animation;
}

export interface Animation {
  frames: number;
  duration: number; // in milliseconds
  loop: boolean;
}

export interface CharacterStats {
  baseAttack: number;
  baseDefense: number;
  speed: number;
  criticalChance: number; // 0-1
  specialAttackMultiplier: number;
}

export interface GameState {
  gameId: string;
  players: [Player, Player];
  currentTurn: number; // 0 or 1
  turnCount: number;
  phase: TurnPhase;
  status: GameStatus;
  betAmount: number;
  winner?: number; // 0 or 1
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
}

export interface Attack {
  type: AttackType;
  damage: number;
  critical: boolean;
  blocked: boolean;
  attacker: number; // player index
  target: number; // player index
  timestamp: Date;
}

export interface GameAction {
  type: 'join' | 'ready' | 'attack' | 'special' | 'forfeit';
  playerId: string;
  data?: any;
  timestamp: Date;
}

export interface CombatResult {
  damage: number;
  critical: boolean;
  blocked: boolean;
  healthRemaining: number;
  effects?: string[]; // Visual effect names
}

export interface MatchmakingPreferences {
  levelRange: number; // +/- level difference allowed
  betRange: [number, number]; // min/max bet amount
  region?: string;
  friendsOnly: boolean;
}

export interface GameRoom {
  roomId: string;
  hostId: string;
  guestId?: string;
  isPrivate: boolean;
  betAmount: number;
  maxPlayers: 2;
  currentPlayers: number;
  status: 'open' | 'full' | 'playing' | 'closed';
  createdAt: Date;
}