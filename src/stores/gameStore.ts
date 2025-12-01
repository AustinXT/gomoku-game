import { create } from 'zustand';
import type { Cell, GameStatus, Position, GameMode, Difficulty } from '@/utils/tauri';
import { tauriApi } from '@/utils/tauri';

interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface GameState {
  board: Cell[][];
  currentPlayer: 'black' | 'white';
  gameStatus: GameStatus;
  gameMode: GameMode;
  aiDifficulty: Difficulty;
  moveHistory: Array<{ x: number; y: number }>;
  winningLine: Position[] | null;
  isProcessing: boolean;
  toast: ToastMessage | null;

  // Actions
  placeStone: (x: number, y: number) => void;
  newGame: () => void;
  newGameWithMode: (mode: GameMode, difficulty?: Difficulty) => Promise<void>;
  undoMove: () => void;
  handleAIMove: () => Promise<void>;
  loadGameConfig: () => Promise<void>;
  checkWinner: (board: Cell[][], x: number, y: number) => { hasWon: boolean; line?: Position[] };
  showToast: (message: string, type?: ToastMessage['type']) => void;
  clearToast: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  board: Array(15).fill(null).map(() => Array(15).fill(null)),
  currentPlayer: 'black',
  gameStatus: 'playing',
  gameMode: 'pvp',
  aiDifficulty: 'medium',
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

  placeStone: async (x: number, y: number) => {
    const { isProcessing, gameStatus, board, showToast, gameMode, currentPlayer } = get();

    console.log('placeStone called:', { x, y, currentPlayer, gameMode, isProcessing, gameStatus });
    console.log('Board state before move:', board.map(row => row.map(cell => cell || 'empty')));

    if (isProcessing) {
      console.log('Processing - blocking move');
      showToast('请等待当前操作完成', 'error');
      return;
    }

    if (gameStatus !== 'playing') {
      console.log('Game not playing - blocking move');
      showToast('游戏已结束，请开始新游戏', 'error');
      return;
    }

    if (board[x][y] !== null) {
      console.log('Cell occupied - blocking move');
      showToast('该位置已有棋子', 'error');
      return;
    }

    set({ isProcessing: true });

    try {
      const result = await tauriApi.placeStone(x, y);

      if (!result.success) {
        showToast('落子失败', 'error');
        return;
      }

      // Update board state - 使用当前落子的玩家
      const newBoard = board.map(row => [...row]);
      newBoard[x][y] = currentPlayer;

      let newGameStatus: GameStatus = result.game_status;
      if (result.game_status === 'black_win' || result.game_status === 'white_win') {
        showToast(`${get().currentPlayer === 'black' ? '黑棋' : '白棋'}获胜！`, 'success');
      } else if (result.game_status === 'draw') {
        showToast('平局！', 'info');
      }

      set({
        board: newBoard,
        currentPlayer: result.next_player,
        gameStatus: newGameStatus,
        winningLine: result.winning_line || null,
        moveHistory: [...get().moveHistory, { x, y }],
      });

      // Trigger AI move if in PvE mode and game is still ongoing and it's AI's turn
      if (gameMode === 'pve' && newGameStatus === 'playing') {
        setTimeout(() => get().handleAIMove(), 500);
      }

    } catch (error) {
      console.error('Failed to place stone:', error);
      showToast('落子失败', 'error');
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
      get().showToast('新游戏已开始', 'success');
    } catch (error) {
      console.error('Failed to start new game:', error);
      get().showToast('新游戏启动失败', 'error');
    } finally {
      set({ isProcessing: false });
    }
  },

  newGameWithMode: async (mode: GameMode, difficulty?: Difficulty) => {
    set({ isProcessing: true });
    try {
      await tauriApi.newGameWithMode(mode, difficulty);
      set({
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        currentPlayer: 'black',
        gameStatus: 'playing',
        gameMode: mode,
        aiDifficulty: difficulty || 'medium',
        moveHistory: [],
        winningLine: null,
      });
      get().showToast(`新游戏已开始 (${mode === 'pvp' ? '双人对战' : '人机对战'})`, 'success');
    } catch (error) {
      console.error('Failed to start new game with mode:', error);
      get().showToast('新游戏启动失败', 'error');
    } finally {
      set({ isProcessing: false });
    }
  },

  handleAIMove: async () => {
    const { isProcessing, gameStatus, gameMode, currentPlayer } = get();

    if (isProcessing || gameStatus !== 'playing' || gameMode !== 'pve' || currentPlayer !== 'white') {
      return;
    }

    set({ isProcessing: true });

    try {
      const aiMove = await tauriApi.getAIMove();
      if (!aiMove) {
        get().showToast('AI无法找到有效落子位置', 'error');
        return;
      }

      const result = await tauriApi.placeStone(aiMove.x, aiMove.y);
      if (!result.success) {
        get().showToast('AI落子失败', 'error');
        return;
      }

      const { board } = get();
      const newBoard = board.map(row => [...row]);
      newBoard[aiMove.x][aiMove.y] = 'white';

      let newGameStatus: GameStatus = result.game_status;
      if (result.game_status === 'black_win' || result.game_status === 'white_win') {
        get().showToast('AI获胜！', 'success');
      } else if (result.game_status === 'draw') {
        get().showToast('平局！', 'info');
      }

      set({
        board: newBoard,
        currentPlayer: result.next_player,
        gameStatus: newGameStatus,
        winningLine: result.winning_line || null,
        moveHistory: [...get().moveHistory, { x: aiMove.x, y: aiMove.y }],
      });

    } catch (error) {
      console.error('Failed to handle AI move:', error);
      get().showToast('AI落子失败', 'error');
    } finally {
      set({ isProcessing: false });
    }
  },

  loadGameConfig: async () => {
    try {
      const config = await tauriApi.getGameConfig();
      set({
        gameMode: config.mode as GameMode,
        aiDifficulty: config.difficulty as Difficulty,
      });
    } catch (error) {
      console.error('Failed to load game config:', error);
      // 使用默认配置
      set({
        gameMode: 'pvp',
        aiDifficulty: 'medium',
      });
    }
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