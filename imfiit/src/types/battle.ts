// Battle System Types for IM FIIT

import type { Attack } from "./game";

export interface BattleConfig {
  maxTurns: number;
  turnTimeLimit: number; // seconds
  healthPoints: number;
  energyPoints: number;
  criticalMultiplier: number;
  levelAdvantageBonus: number; // bonus per level difference
}

export interface DamageCalculation {
  baseDamage: number;
  strengthBonus: number;
  levelBonus: number;
  criticalMultiplier: number;
  defenseReduction: number;
  finalDamage: number;
}

export interface TurnResult {
  attackerId: string;
  defenderId: string;
  attack: Attack;
  damage: DamageCalculation;
  effects: BattleEffect[];
  newHealths: [number, number];
  gameEnded: boolean;
  winner?: string;
}

export interface BattleEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'stun';
  value: number;
  duration?: number; // turns
  visual: string; // effect animation name
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  effect: BattleEffect;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  cost: number; // energy cost
}

export interface CombatLog {
  turn: number;
  playerId: string;
  action: string;
  result: string;
  damage?: number;
  timestamp: Date;
}

export interface BattleHistory {
  gameId: string;
  players: string[]; // user IDs
  winner: string;
  loser: string;
  turns: number;
  duration: number; // seconds
  betAmount: number;
  date: Date;
  combatLog: CombatLog[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  wins: number;
  losses: number;
  winRate: number;
  totalEarnings: number;
  currentStreak: number;
  maxStreak: number;
}

export interface Tournament {
  id: string;
  name: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  currentParticipants: number;
  status: 'registration' | 'active' | 'finished';
  startDate: Date;
  endDate: Date;
  brackets: TournamentBracket[];
}

export interface TournamentBracket {
  round: number;
  matches: TournamentMatch[];
}

export interface TournamentMatch {
  matchId: string;
  player1: string;
  player2: string;
  winner?: string;
  gameId?: string;
  scheduledTime: Date;
  status: 'pending' | 'active' | 'completed';
}