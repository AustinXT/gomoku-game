import { invoke } from '@tauri-apps/api/core';

export type Player = 'black' | 'white';
export type Cell = null | Player;
export type GameStatus = 'idle' | 'playing' | 'black_win' | 'white_win' | 'draw';
export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';

// 检测是否在 Tauri 环境中
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

// 安全调用 invoke
async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    throw new Error(`Tauri API not available for command: ${command}`);
  }
  return invoke<T>(command, args);
}

export interface Position {
  x: number;
  y: number;
}

export interface MoveResult {
  success: boolean;
  game_status: GameStatus;
  winning_line?: Position[];
  next_player: Player;
}

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
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

export const tauriApi = {
  async placeStone(x: number, y: number): Promise<MoveResult> {
    return await safeInvoke<MoveResult>('place_stone', { x, y });
  },

  async newGame(): Promise<void> {
    return await safeInvoke('new_game');
  },

  async newGameWithMode(mode: GameMode, difficulty?: Difficulty): Promise<void> {
    return await safeInvoke('new_game_with_mode', { mode, difficulty });
  },

  async getAIMove(): Promise<Position> {
    return await safeInvoke<Position>('get_ai_move');
  },

  async getGameConfig(): Promise<GameConfig> {
    return await safeInvoke<GameConfig>('get_game_config');
  },

  async undoMove(): Promise<void> {
    return await safeInvoke('undo_move');
  },

  async getBoardState(): Promise<string[][]> {
    return await safeInvoke<string[][]>('get_board_state');
  },

  async saveGame(gameName: string): Promise<number> {
    return await safeInvoke<number>('save_game', { gameName });
  },

  async loadGame(gameId: number): Promise<void> {
    return await safeInvoke('load_game', { gameId });
  },

  async listSavedGames(): Promise<SavedGame[]> {
    return await safeInvoke<SavedGame[]>('list_saved_games');
  },

  async deleteSavedGame(gameId: number): Promise<void> {
    return await safeInvoke('delete_saved_game', { gameId });
  },
};