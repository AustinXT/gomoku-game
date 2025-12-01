export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameStatus = 'idle' | 'playing' | 'black_win' | 'white_win' | 'draw';

export interface Position {
  x: number;
  y: number;
}

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
}

export interface MoveResult {
  success: boolean;
  game_status: GameStatus;
  winning_line: Position[] | null;
}

export interface SavedGame {
  id?: number;
  name: string;
  mode: GameMode;
  difficulty?: Difficulty;
  created_at: number;
  updated_at: number;
  status: GameStatus;
  winner?: 'black' | 'white' | 'draw';
  total_moves: number;
}

export interface SavedMove {
  id?: number;
  game_id: number;
  move_number: number;
  player: 'black' | 'white';
  position_x: number;
  position_y: number;
  timestamp: number;
}