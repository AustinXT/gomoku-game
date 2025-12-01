import { create } from 'zustand';

interface GameState {
  currentPlayer: 'black' | 'white';
  board: (null | 'black' | 'white')[][];
  moveHistory: Array<{ x: number; y: number; player: 'black' | 'white' }>;
  gameStatus: 'idle' | 'playing' | 'finished';

  // Actions
  initBoard: () => void;
  placeStone: (x: number, y: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentPlayer: 'black',
  board: Array(15).fill(null).map(() => Array(15).fill(null)),
  moveHistory: [],
  gameStatus: 'idle',

  initBoard: () => set({
    board: Array(15).fill(null).map(() => Array(15).fill(null)),
    moveHistory: [],
    currentPlayer: 'black',
    gameStatus: 'playing',
  }),

  placeStone: (x: number, y: number) => {
    // 临时实现，后续替换为 Tauri Command
    set((state) => {
      const newBoard = state.board.map(row => [...row]);
      newBoard[x][y] = state.currentPlayer;

      return {
        board: newBoard,
        moveHistory: [...state.moveHistory, { x, y, player: state.currentPlayer }],
        currentPlayer: state.currentPlayer === 'black' ? 'white' : 'black',
      };
    });
  },

  resetGame: () => {
    set({
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      moveHistory: [],
      currentPlayer: 'black',
      gameStatus: 'playing',
    });
  },
}));