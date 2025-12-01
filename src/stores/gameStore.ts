import { create } from 'zustand';
import type { Cell, GameStatus, Position } from '@/utils/tauri';

interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface GameState {
  board: Cell[][];
  currentPlayer: 'black' | 'white';
  gameStatus: GameStatus;
  moveHistory: Array<{ x: number; y: number }>;
  winningLine: Position[] | null;
  isProcessing: boolean;
  toast: ToastMessage | null;

  // Actions
  placeStone: (x: number, y: number) => void;
  newGame: () => void;
  undoMove: () => void;
  checkWinner: (board: Cell[][], x: number, y: number) => { hasWon: boolean; line?: Position[] };
  showToast: (message: string, type?: ToastMessage['type']) => void;
  clearToast: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  board: Array(15).fill(null).map(() => Array(15).fill(null)),
  currentPlayer: 'black',
  gameStatus: 'idle',
  moveHistory: [],
  winningLine: null,
  isProcessing: false,
  toast: null,

  checkWinner: (board: Cell[][], x: number, y: number) => {
    const player = board[x][y];
    if (!player) return { hasWon: false };

    const directions = [
      [[0, 1], [0, -1]], // 水平
      [[1, 0], [-1, 0]], // 垂直
      [[1, 1], [-1, -1]], // 对角线
      [[1, -1], [-1, 1]]  // 反对角线
    ];

    for (const direction of directions) {
      const line: Position[] = [{ x, y }];

      for (const [dx, dy] of direction) {
        let i = 1;
        while (true) {
          const nx = x + dx * i;
          const ny = y + dy * i;

          if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[nx][ny] !== player) {
            break;
          }

          line.push({ x: nx, y: ny });
          i++;
        }
      }

      if (line.length >= 5) {
        return { hasWon: true, line };
      }
    }

    return { hasWon: false };
  },

  placeStone: (x: number, y: number) => {
    const { isProcessing, gameStatus, board, showToast } = get();

    if (isProcessing) {
      showToast('请等待当前操作完成', 'error');
      return;
    }

    if (gameStatus !== 'playing') {
      showToast('游戏已结束，请开始新游戏', 'error');
      return;
    }

    if (board[x][y] !== null) {
      showToast('该位置已有棋子', 'error');
      return;
    }

    const newBoard = board.map(row => [...row]);
    newBoard[x][y] = get().currentPlayer;

    const { hasWon, line } = get().checkWinner(newBoard, x, y);

    const isBoardFull = newBoard.every(row => row.every(cell => cell !== null));

    let newGameStatus: GameStatus = 'playing';
    if (hasWon) {
      newGameStatus = get().currentPlayer === 'black' ? 'black_win' : 'white_win';
      showToast(`${get().currentPlayer === 'black' ? '黑棋' : '白棋'}获胜！`, 'success');
    } else if (isBoardFull) {
      newGameStatus = 'draw';
      showToast('平局！', 'info');
    }

    set({
      board: newBoard,
      currentPlayer: get().currentPlayer === 'black' ? 'white' : 'black',
      gameStatus: newGameStatus,
      winningLine: line || null,
      moveHistory: [...get().moveHistory, { x, y }],
    });
  },

  newGame: () => {
    set({
      board: Array(15).fill(null).map(() => Array(15).fill(null)),
      currentPlayer: 'black',
      gameStatus: 'playing',
      moveHistory: [],
      winningLine: null,
    });
    get().showToast('新游戏已开始', 'success');
  },

  undoMove: () => {
    const { moveHistory, board, showToast } = get();
    if (moveHistory.length === 0) {
      showToast('没有可悔棋的步骤', 'error');
      return;
    }

    const lastMove = moveHistory[moveHistory.length - 1];
    const newBoard = board.map(row => [...row]);
    newBoard[lastMove.x][lastMove.y] = null;

    set({
      board: newBoard,
      currentPlayer: get().currentPlayer === 'black' ? 'white' : 'black',
      gameStatus: 'playing',
      moveHistory: moveHistory.slice(0, -1),
      winningLine: null,
    });
    showToast('悔棋成功', 'success');
  },

  showToast: (message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    set({ toast: { id, message, type } });

    // Auto-clear toast after 3 seconds
    setTimeout(() => {
      const currentToast = get().toast;
      if (currentToast?.id === id) {
        set({ toast: null });
      }
    }, 3000);
  },

  clearToast: () => set({ toast: null }),
}));