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

// ==================== 浏览器 Fallback 模式 ====================
// 当不在 Tauri 环境中时，使用纯前端逻辑

class BrowserGameState {
  board: Cell[][] = Array(15).fill(null).map(() => Array(15).fill(null));
  currentPlayer: Player = 'black';
  gameStatus: GameStatus = 'playing';
  gameMode: GameMode = 'pvp';
  difficulty: Difficulty = 'medium';
  moveHistory: { x: number; y: number; player: Player }[] = [];

  reset() {
    this.board = Array(15).fill(null).map(() => Array(15).fill(null));
    this.currentPlayer = 'black';
    this.gameStatus = 'playing';
    this.moveHistory = [];
  }

  checkWinner(x: number, y: number): { hasWon: boolean; line?: Position[] } {
    const player = this.board[x][y];
    if (!player) return { hasWon: false };

    const directions = [
      [[0, 1], [0, -1]],
      [[1, 0], [-1, 0]],
      [[1, 1], [-1, -1]],
      [[1, -1], [-1, 1]]
    ];

    for (const direction of directions) {
      const line: Position[] = [{ x, y }];

      for (const [dx, dy] of direction) {
        let i = 1;
        while (true) {
          const nx = x + dx * i;
          const ny = y + dy * i;
          if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || this.board[nx][ny] !== player) {
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
  }

  isBoardFull(): boolean {
    return this.board.every(row => row.every(cell => cell !== null));
  }

  // 简单 AI：随机选择空位，稍微优化版本会考虑威胁和机会
  getAIMove(): Position | null {
    const emptyCells: Position[] = [];
    
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (this.board[i][j] === null) {
          emptyCells.push({ x: i, y: j });
        }
      }
    }

    if (emptyCells.length === 0) return null;

    // 根据难度调整 AI 策略
    if (this.difficulty === 'easy') {
      // 简单模式：随机选择
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // 中等/困难模式：优先考虑威胁和机会
    const scoredMoves = emptyCells.map(pos => ({
      pos,
      score: this.evaluatePosition(pos.x, pos.y)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);

    // 困难模式选最佳，中等模式在前几个中随机
    if (this.difficulty === 'hard') {
      return scoredMoves[0].pos;
    } else {
      const topMoves = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
      return topMoves[Math.floor(Math.random() * topMoves.length)].pos;
    }
  }

  evaluatePosition(x: number, y: number): number {
    let score = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    // 中心位置加分
    const centerDist = Math.abs(x - 7) + Math.abs(y - 7);
    score += (14 - centerDist) * 2;

    for (const [dx, dy] of directions) {
      // 检查 AI (white) 的连子
      score += this.countLine(x, y, dx, dy, 'white') * 10;
      // 检查玩家 (black) 的威胁，需要防守
      score += this.countLine(x, y, dx, dy, 'black') * 8;
    }

    return score;
  }

  countLine(x: number, y: number, dx: number, dy: number, player: Player): number {
    let count = 0;
    
    for (let dir = -1; dir <= 1; dir += 2) {
      for (let i = 1; i <= 4; i++) {
        const nx = x + dx * i * dir;
        const ny = y + dy * i * dir;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15) break;
        if (this.board[nx][ny] === player) count++;
        else if (this.board[nx][ny] !== null) break;
      }
    }
    
    return count;
  }
}

const browserState = new BrowserGameState();

// 安全调用 invoke（支持 fallback）
async function safeInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    return invoke<T>(command, args);
  }
  
  // 浏览器 Fallback 模式
  console.log(`[Browser Mode] Command: ${command}`, args);
  return browserFallback<T>(command, args);
}

function browserFallback<T>(command: string, args?: Record<string, unknown>): T {
  switch (command) {
    case 'get_game_config':
      return {
        mode: browserState.gameMode,
        difficulty: browserState.difficulty
      } as T;

    case 'new_game':
      browserState.reset();
      return undefined as T;

    case 'new_game_with_mode': {
      browserState.reset();
      browserState.gameMode = (args?.mode as GameMode) || 'pvp';
      browserState.difficulty = (args?.difficulty as Difficulty) || 'medium';
      return undefined as T;
    }

    case 'place_stone': {
      const x = args?.x as number;
      const y = args?.y as number;
      
      if (browserState.board[x][y] !== null || browserState.gameStatus !== 'playing') {
        return {
          success: false,
          game_status: browserState.gameStatus,
          next_player: browserState.currentPlayer
        } as T;
      }

      browserState.board[x][y] = browserState.currentPlayer;
      browserState.moveHistory.push({ x, y, player: browserState.currentPlayer });

      const { hasWon, line } = browserState.checkWinner(x, y);
      
      if (hasWon) {
        browserState.gameStatus = browserState.currentPlayer === 'black' ? 'black_win' : 'white_win';
        return {
          success: true,
          game_status: browserState.gameStatus,
          winning_line: line,
          next_player: browserState.currentPlayer
        } as T;
      }

      if (browserState.isBoardFull()) {
        browserState.gameStatus = 'draw';
        return {
          success: true,
          game_status: 'draw',
          next_player: browserState.currentPlayer
        } as T;
      }

      browserState.currentPlayer = browserState.currentPlayer === 'black' ? 'white' : 'black';
      
      return {
        success: true,
        game_status: 'playing',
        next_player: browserState.currentPlayer
      } as T;
    }

    case 'get_ai_move': {
      const move = browserState.getAIMove();
      if (!move) throw new Error('No valid move available');
      return move as T;
    }

    case 'undo_move': {
      if (browserState.moveHistory.length > 0) {
        const lastMove = browserState.moveHistory.pop()!;
        browserState.board[lastMove.x][lastMove.y] = null;
        browserState.currentPlayer = lastMove.player;
        browserState.gameStatus = 'playing';
      }
      return undefined as T;
    }

    case 'get_board_state':
      return browserState.board.map(row => 
        row.map(cell => cell || '')
      ) as T;

    case 'save_game':
    case 'load_game':
    case 'list_saved_games':
    case 'delete_saved_game':
      console.warn(`[Browser Mode] ${command} 功能在浏览器模式下不可用`);
      if (command === 'list_saved_games') return [] as T;
      return undefined as T;

    default:
      throw new Error(`Unknown command: ${command}`);
  }
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