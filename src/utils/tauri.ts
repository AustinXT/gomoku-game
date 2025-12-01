import { invoke } from '@tauri-apps/api/core';
import { MoveResult } from '@/types/game';

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