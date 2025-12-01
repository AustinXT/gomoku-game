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

  // ==================== 棋型分数常量 ====================
  static readonly SCORES = {
    FIVE: 1000000,        // 连五 - 必胜
    LIVE_FOUR: 100000,    // 活四 - 必胜
    RUSH_FOUR: 10000,     // 冲四 - 高威胁
    LIVE_THREE: 5000,     // 活三 - 高价值
    SLEEP_THREE: 500,     // 眠三
    LIVE_TWO: 200,        // 活二
    SLEEP_TWO: 50,        // 眠二
    LIVE_ONE: 10,         // 活一
  };

  // AI 决策入口
  getAIMove(): Position | null {
    const emptyCells = this.getEmptyCells();
    if (emptyCells.length === 0) return null;

    // 如果是第一步，走天元
    if (this.moveHistory.length === 0) {
      return { x: 7, y: 7 };
    }
    
    // 如果是第二步（AI后手第一步），走靠近对方的位置
    if (this.moveHistory.length === 1) {
      const lastMove = this.moveHistory[0];
      const offsets = [[1, 0], [0, 1], [1, 1], [-1, 1]];
      const offset = offsets[Math.floor(Math.random() * offsets.length)];
      const x = Math.max(0, Math.min(14, lastMove.x + offset[0]));
      const y = Math.max(0, Math.min(14, lastMove.y + offset[1]));
      return { x, y };
    }

    switch (this.difficulty) {
      case 'easy':
        return this.getEasyMove(emptyCells);
      case 'medium':
        return this.getMediumMove(emptyCells);
      case 'hard':
        return this.getHardMove(emptyCells);
      default:
        return this.getMediumMove(emptyCells);
    }
  }

  getEmptyCells(): Position[] {
    const emptyCells: Position[] = [];
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (this.board[i][j] === null) {
          emptyCells.push({ x: i, y: j });
        }
      }
    }
    return emptyCells;
  }

  // ==================== 简单模式 ====================
  // 有基本防守意识，但会犯错
  getEasyMove(emptyCells: Position[]): Position {
    // 30% 概率随机走
    if (Math.random() < 0.3) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    // 检查是否能赢
    for (const pos of emptyCells) {
      if (this.wouldWin(pos.x, pos.y, 'white')) {
        return pos;
      }
    }

    // 检查是否需要防守（对方活四/冲四）
    for (const pos of emptyCells) {
      if (this.wouldWin(pos.x, pos.y, 'black')) {
        // 50% 概率防守
        if (Math.random() < 0.5) {
          return pos;
        }
      }
    }

    // 简单评估
    const scored = emptyCells.map(pos => ({
      pos,
      score: this.simpleEvaluate(pos.x, pos.y)
    }));
    scored.sort((a, b) => b.score - a.score);

    // 在前10个中随机选
    const topN = Math.min(10, scored.length);
    return scored[Math.floor(Math.random() * topN)].pos;
  }

  // ==================== 中等模式 ====================
  // 正确识别棋型，有攻防意识，但没有深度搜索
  getMediumMove(emptyCells: Position[]): Position {
    // 1. 检查是否能直接获胜（连五）
    for (const pos of emptyCells) {
      if (this.wouldWin(pos.x, pos.y, 'white')) {
        return pos;
      }
    }

    // 2. 防守对方的连五
    for (const pos of emptyCells) {
      if (this.wouldWin(pos.x, pos.y, 'black')) {
        return pos;
      }
    }

    // 3. 检查活四
    for (const pos of emptyCells) {
      if (this.hasPattern(pos.x, pos.y, 'white', 'LIVE_FOUR')) {
        return pos;
      }
    }

    // 4. 防守对方活四
    for (const pos of emptyCells) {
      if (this.hasPattern(pos.x, pos.y, 'black', 'LIVE_FOUR')) {
        return pos;
      }
    }

    // 5. 检查冲四活三
    for (const pos of emptyCells) {
      if (this.hasPattern(pos.x, pos.y, 'white', 'RUSH_FOUR')) {
        return pos;
      }
    }

    // 6. 防守对方冲四
    for (const pos of emptyCells) {
      if (this.hasPattern(pos.x, pos.y, 'black', 'RUSH_FOUR')) {
        return pos;
      }
    }

    // 7. 使用评估函数选择最佳位置
    const candidates = this.getCandidateMoves(emptyCells);
    const scored = candidates.map(pos => ({
      pos,
      score: this.evaluatePosition(pos.x, pos.y)
    }));
    scored.sort((a, b) => b.score - a.score);

    // 在最佳的前3个中选择（加一点随机性）
    const topN = Math.min(3, scored.length);
    const idx = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * topN);
    return scored[idx].pos;
  }

  // ==================== 困难模式 ====================
  // 使用 Minimax + Alpha-Beta 剪枝
  getHardMove(emptyCells: Position[]): Position {
    // 1. 必杀检测
    const killMove = this.findKillerMove('white');
    if (killMove) return killMove;

    // 2. 紧急防守检测
    const defenseMove = this.findKillerMove('black');
    if (defenseMove) return defenseMove;

    // 3. 使用 Minimax 搜索
    const candidates = this.getCandidateMoves(emptyCells);
    const depth = candidates.length > 15 ? 4 : 6; // 动态调整深度

    let bestMove = candidates[0];
    let bestScore = -Infinity;

    for (const pos of candidates) {
      this.board[pos.x][pos.y] = 'white';
      const score = this.minimax(depth - 1, -Infinity, Infinity, false);
      this.board[pos.x][pos.y] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = pos;
      }
    }

    return bestMove;
  }

  // Minimax with Alpha-Beta Pruning
  minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    // 检查游戏结束
    const winner = this.quickCheckWinner();
    if (winner === 'white') return BrowserGameState.SCORES.FIVE;
    if (winner === 'black') return -BrowserGameState.SCORES.FIVE;
    if (depth === 0) return this.evaluateBoard();

    const candidates = this.getCandidateMoves(this.getEmptyCells());
    if (candidates.length === 0) return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (const pos of candidates.slice(0, 10)) { // 限制分支
        this.board[pos.x][pos.y] = 'white';
        const score = this.minimax(depth - 1, alpha, beta, false);
        this.board[pos.x][pos.y] = null;

        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);
        if (beta <= alpha) break;
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const pos of candidates.slice(0, 10)) {
        this.board[pos.x][pos.y] = 'black';
        const score = this.minimax(depth - 1, alpha, beta, true);
        this.board[pos.x][pos.y] = null;

        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);
        if (beta <= alpha) break;
      }
      return minScore;
    }
  }

  // 获取候选落子点（只考虑现有棋子周围）
  getCandidateMoves(emptyCells: Position[]): Position[] {
    const candidates: Position[] = [];
    const checked = new Set<string>();

    // 先添加所有棋子周围2格内的空位
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (this.board[i][j] !== null) {
          for (let di = -2; di <= 2; di++) {
            for (let dj = -2; dj <= 2; dj++) {
              const ni = i + di;
              const nj = j + dj;
              const key = `${ni},${nj}`;
              if (ni >= 0 && ni < 15 && nj >= 0 && nj < 15 &&
                  this.board[ni][nj] === null && !checked.has(key)) {
                checked.add(key);
                candidates.push({ x: ni, y: nj });
              }
            }
          }
        }
      }
    }

    if (candidates.length === 0) {
      return emptyCells;
    }

    // 按评估分数排序
    candidates.sort((a, b) => 
      this.evaluatePosition(b.x, b.y) - this.evaluatePosition(a.x, a.y)
    );

    return candidates;
  }

  // 寻找必杀着法
  findKillerMove(player: Player): Position | null {
    const candidates = this.getCandidateMoves(this.getEmptyCells());

    // 连五
    for (const pos of candidates) {
      if (this.wouldWin(pos.x, pos.y, player)) {
        return pos;
      }
    }

    // 活四
    for (const pos of candidates) {
      if (this.hasPattern(pos.x, pos.y, player, 'LIVE_FOUR')) {
        return pos;
      }
    }

    // 双活三或活三冲四
    for (const pos of candidates) {
      const patterns = this.countPatterns(pos.x, pos.y, player);
      if (patterns.LIVE_THREE >= 2 || 
          (patterns.LIVE_THREE >= 1 && patterns.RUSH_FOUR >= 1)) {
        return pos;
      }
    }

    return null;
  }

  // 检查落子是否能赢
  wouldWin(x: number, y: number, player: Player): boolean {
    this.board[x][y] = player;
    const { hasWon } = this.checkWinner(x, y);
    this.board[x][y] = null;
    return hasWon;
  }

  // 快速检测是否有人获胜
  quickCheckWinner(): Player | null {
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (this.board[i][j] !== null) {
          const { hasWon } = this.checkWinner(i, j);
          if (hasWon) return this.board[i][j];
        }
      }
    }
    return null;
  }

  // 检查是否形成特定棋型
  hasPattern(x: number, y: number, player: Player, patternType: string): boolean {
    const patterns = this.countPatterns(x, y, player);
    return patterns[patternType as keyof typeof patterns] > 0;
  }

  // 统计所有棋型
  countPatterns(x: number, y: number, player: Player): Record<string, number> {
    const patterns: Record<string, number> = {
      FIVE: 0,
      LIVE_FOUR: 0,
      RUSH_FOUR: 0,
      LIVE_THREE: 0,
      SLEEP_THREE: 0,
      LIVE_TWO: 0,
      SLEEP_TWO: 0,
    };

    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    this.board[x][y] = player;

    for (const [dx, dy] of directions) {
      const pattern = this.analyzeLinePattern(x, y, dx, dy, player);
      if (pattern) {
        patterns[pattern]++;
      }
    }

    this.board[x][y] = null;
    return patterns;
  }

  // 分析一条线上的棋型
  analyzeLinePattern(x: number, y: number, dx: number, dy: number, player: Player): string | null {
    const opponent = player === 'black' ? 'white' : 'black';

    // 获取这条线上的棋子情况 [-4, 4]
    const line: (Cell | 'out')[] = [];
    for (let i = -4; i <= 4; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15) {
        line.push('out');
      } else {
        line.push(this.board[nx][ny]);
      }
    }

    // 计算连子数和两端情况
    let count = 1; // 当前位置
    let leftSpace = 0;
    let rightSpace = 0;
    let leftBlocked = false;
    let rightBlocked = false;

    // 向左数
    for (let i = 3; i >= 0; i--) {
      if (line[i] === player) {
        count++;
      } else if (line[i] === null) {
        leftSpace++;
        break;
      } else {
        leftBlocked = true;
        break;
      }
    }

    // 向右数
    for (let i = 5; i <= 8; i++) {
      if (line[i] === player) {
        count++;
      } else if (line[i] === null) {
        rightSpace++;
        break;
      } else {
        rightBlocked = true;
        break;
      }
    }

    // 判断棋型
    if (count >= 5) return 'FIVE';

    const openEnds = (leftSpace > 0 ? 1 : 0) + (rightSpace > 0 ? 1 : 0);
    const blocked = leftBlocked || rightBlocked;

    if (count === 4) {
      if (openEnds === 2) return 'LIVE_FOUR';
      if (openEnds === 1) return 'RUSH_FOUR';
    }

    if (count === 3) {
      if (openEnds === 2) return 'LIVE_THREE';
      if (openEnds === 1 && !blocked) return 'SLEEP_THREE';
    }

    if (count === 2) {
      if (openEnds === 2) return 'LIVE_TWO';
      if (openEnds === 1) return 'SLEEP_TWO';
    }

    return null;
  }

  // 评估单个位置
  evaluatePosition(x: number, y: number): number {
    let score = 0;

    // 中心位置加分
    const centerDist = Math.abs(x - 7) + Math.abs(y - 7);
    score += (14 - centerDist) * 5;

    // AI 的棋型分数（进攻）
    const aiPatterns = this.countPatterns(x, y, 'white');
    score += aiPatterns.FIVE * BrowserGameState.SCORES.FIVE;
    score += aiPatterns.LIVE_FOUR * BrowserGameState.SCORES.LIVE_FOUR;
    score += aiPatterns.RUSH_FOUR * BrowserGameState.SCORES.RUSH_FOUR;
    score += aiPatterns.LIVE_THREE * BrowserGameState.SCORES.LIVE_THREE;
    score += aiPatterns.SLEEP_THREE * BrowserGameState.SCORES.SLEEP_THREE;
    score += aiPatterns.LIVE_TWO * BrowserGameState.SCORES.LIVE_TWO;
    score += aiPatterns.SLEEP_TWO * BrowserGameState.SCORES.SLEEP_TWO;

    // 玩家的棋型分数（防守）- 权重稍低
    const playerPatterns = this.countPatterns(x, y, 'black');
    score += playerPatterns.FIVE * BrowserGameState.SCORES.FIVE * 0.9;
    score += playerPatterns.LIVE_FOUR * BrowserGameState.SCORES.LIVE_FOUR * 0.9;
    score += playerPatterns.RUSH_FOUR * BrowserGameState.SCORES.RUSH_FOUR * 0.85;
    score += playerPatterns.LIVE_THREE * BrowserGameState.SCORES.LIVE_THREE * 0.8;
    score += playerPatterns.SLEEP_THREE * BrowserGameState.SCORES.SLEEP_THREE * 0.7;
    score += playerPatterns.LIVE_TWO * BrowserGameState.SCORES.LIVE_TWO * 0.6;

    return score;
  }

  // 评估整个棋盘
  evaluateBoard(): number {
    let score = 0;
    
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if (this.board[i][j] === 'white') {
          score += this.evaluatePieceAt(i, j, 'white');
        } else if (this.board[i][j] === 'black') {
          score -= this.evaluatePieceAt(i, j, 'black');
        }
      }
    }

    return score;
  }

  // 评估某个位置的棋子价值
  evaluatePieceAt(x: number, y: number, player: Player): number {
    let score = 0;
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

    for (const [dx, dy] of directions) {
      const pattern = this.analyzeLinePattern(x, y, dx, dy, player);
      if (pattern && pattern in BrowserGameState.SCORES) {
        score += BrowserGameState.SCORES[pattern as keyof typeof BrowserGameState.SCORES];
      }
    }

    // 中心加分
    const centerDist = Math.abs(x - 7) + Math.abs(y - 7);
    score += (14 - centerDist);

    return score;
  }

  // 简单评估（用于简单模式）
  simpleEvaluate(x: number, y: number): number {
    let score = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    const centerDist = Math.abs(x - 7) + Math.abs(y - 7);
    score += (14 - centerDist) * 2;

    for (const [dx, dy] of directions) {
      score += this.countLine(x, y, dx, dy, 'white') * 10;
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

export interface LoadGameResult {
  board: string[][];
  current_player: 'black' | 'white';
  game_status: GameStatus;
  game_mode: GameMode;
  ai_difficulty: Difficulty;
  move_history: Position[];
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