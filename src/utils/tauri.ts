import { invoke } from '@tauri-apps/api/core';

export type Player = 'black' | 'white';
export type Cell = null | Player;
export type GameStatus = 'idle' | 'playing' | 'black_win' | 'white_win' | 'draw';
export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Position {
  x: number;
  y: number;
}

export interface MoveResult {
  success: boolean;
  game_status: GameStatus;
  winning_line?: Position[];
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
    return await invoke<MoveResult>('place_stone', { x, y });
  },

  async newGame(): Promise<void> {
    return await invoke('new_game');
  },

  async newGameWithMode(mode: GameMode, difficulty?: Difficulty): Promise<void> {
    return await invoke('new_game_with_mode', { mode, difficulty });
  },

  async getAIMove(): Promise<Position> {
    return await invoke<Position>('get_ai_move');
  },

  async getGameConfig(): Promise<GameConfig> {
    return await invoke<GameConfig>('get_game_config');
  },

  async undoMove(): Promise<void> {
    return await invoke('undo_move');
  },

  async getBoardState(): Promise<string[][]> {
    return await invoke<string[][]>('get_board_state');
  },

  async saveGame(gameName: string): Promise<number> {
    return await invoke<number>('save_game', { gameName });
  },

  async loadGame(gameId: number): Promise<void> {
    return await invoke('load_game', { gameId });
  },

  async listSavedGames(): Promise<SavedGame[]> {
    return await invoke<SavedGame[]>('list_saved_games');
  },

  async deleteSavedGame(gameId: number): Promise<void> {
    return await invoke('delete_saved_game', { gameId });
  },
};