import { create } from 'zustand';
import { tauriApi } from '@/utils/tauri';
import { Cell, GameStatus, Position } from '@/types/game';

interface GameState {
  board: Cell[][];
  currentPlayer: 'black' | 'white';
  gameStatus: GameStatus;
  moveHistory: Array<{ x: number; y: number }>;
  winningLine: Position[] | null;
  isProcessing: boolean;

  // Actions
  placeStone: (x: number, y: number) => Promise<void>;
  newGame: () => Promise<void>;
  undoMove: () => Promise<void>;
  syncBoardState: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  board: Array(15).fill(null).map(() => Array(15).fill(null)),
  currentPlayer: 'black',
  gameStatus: 'idle',
  moveHistory: [],
  winningLine: null,
  isProcessing: false,

  placeStone: async (x: number, y: number) => {
    const { isProcessing, gameStatus } = get();

    if (isProcessing || gameStatus !== 'playing') {
      return;
    }

    set({ isProcessing: true });

    try {
      const result = await tauriApi.placeStone(x, y);

      // 更新本地状态
      const newBoard = get().board.map(row => [...row]);
      newBoard[x][y] = get().currentPlayer;

      set({
        board: newBoard,
        currentPlayer: get().currentPlayer === 'black' ? 'white' : 'black',
        gameStatus: result.game_status,
        winningLine: result.winning_line || null,
        moveHistory: [...get().moveHistory, { x, y }],
      });
    } catch (error) {
      console.error('Failed to place stone:', error);
      alert(`落子失败: ${error}`);
    } finally {
      set({ isProcessing: false });
    }
  },

  newGame: async () => {
    set({ isProcessing: true });

    try {
      await tauriApi.newGame();
      set({
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        currentPlayer: 'black',
        gameStatus: 'playing',
        moveHistory: [],
        winningLine: null,
      });
    } catch (error) {
      console.error('Failed to start new game:', error);
    } finally {
      set({ isProcessing: false });
    }
  },

  undoMove: async () => {
    const { moveHistory } = get();
    if (moveHistory.length === 0) return;

    set({ isProcessing: true });

    try {
      await tauriApi.undoMove();

      const lastMove = moveHistory[moveHistory.length - 1];
      const newBoard = get().board.map(row => [...row]);
      newBoard[lastMove.x][lastMove.y] = null;

      set({
        board: newBoard,
        currentPlayer: get().currentPlayer === 'black' ? 'white' : 'black',
        gameStatus: 'playing',
        moveHistory: moveHistory.slice(0, -1),
        winningLine: null,
      });
    } catch (error) {
      console.error('Failed to undo move:', error);
      alert(`悔棋失败: ${error}`);
    } finally {
      set({ isProcessing: false });
    }
  },

  syncBoardState: async () => {
    try {
      const boardData = await tauriApi.getBoardState();
      const board: Cell[][] = boardData.map(row =>
        row.map(cell => {
          if (cell === 'black') return 'black';
          if (cell === 'white') return 'white';
          return null;
        })
      );
      set({ board });
    } catch (error) {
      console.error('Failed to sync board state:', error);
    }
  },
}));