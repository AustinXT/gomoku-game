export type Player = 'black' | 'white';

export type Cell = null | Player;

export interface Position {
  x: number;
  y: number;
}

export interface Move {
  position: Position;
  player: Player;
}

export type GameStatus = 'idle' | 'playing' | 'black_win' | 'white_win' | 'draw';

export interface MoveResult {
  success: boolean;
  game_status: GameStatus;
  winning_line?: Position[];
}

export interface BoardState {
  grid: Cell[][];
  currentPlayer: Player;
  gameStatus: GameStatus;
  moveHistory: Move[];
}