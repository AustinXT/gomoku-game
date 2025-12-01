import { invoke } from '@tauri-apps/api/core';

export type Player = 'black' | 'white';
export type Cell = null | Player;
export type GameStatus = 'idle' | 'playing' | 'black_win' | 'white_win' | 'draw';

export interface Position {
  x: number;
  y: number;
}

export interface MoveResult {
  success: boolean;
  game_status: GameStatus;
  winning_line?: Position[];
}

export const tauriApi = {
  async placeStone(x: number, y: number): Promise<MoveResult> {
    return await invoke<MoveResult>('place_stone', { x, y });
  },

  async newGame(): Promise<void> {
    return await invoke('new_game');
  },

  async undoMove(): Promise<void> {
    return await invoke('undo_move');
  },

  async getBoardState(): Promise<string[][]> {
    return await invoke<string[][]>('get_board_state');
  },
};