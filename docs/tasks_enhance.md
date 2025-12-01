# 五子棋增强功能开发任务清单

## 项目信息

- **项目名称**: 五子棋 Mac Desktop App - 增强版
- **技术栈**: Tauri 2.0 + React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **前置条件**: MVP 版本已完成（双人对弈和基础功能）
- **目标**: 实现架构文档中的第二版增强功能

---

## 增强功能清单（根据架构文档 7.2 节）

按照架构文档 `architecture.md` 的 7.2 节规划，本阶段需要实现：

- [x] 人机对弈（PvE）
- [x] AI 难度选择（简单/中等/困难）
- [x] 落子音效
- [x] 获胜动画
- [x] 游戏保存/加载
- [x] 历史记录查看
- [x] 棋谱回放

---

## 开发阶段划分

### 阶段一：AI 引擎实现（预计 3-5 天）
核心算法开发，包括 Minimax、Alpha-Beta 剪枝、棋型评估

### 阶段二：AI 集成与人机对弈（预计 2-3 天）
前后端集成，实现模式选择和 AI 对手

### 阶段三：数据持久化（预计 2-3 天）
SQLite 数据库，游戏保存/加载功能

### 阶段四：用户体验增强（预计 2-3 天）
音效、动画、历史记录、棋谱回放

### 阶段五：性能优化与测试（预计 1-2 天）
性能调优、完整测试、Bug 修复

---

## 阶段一：AI 引擎实现（Rust 后端）

### 任务 1.1：创建 AI 模块结构

**优先级**: 🔴 最高

**执行步骤**:
```bash
# 创建 AI 模块目录
mkdir -p src-tauri/src/ai
```

**创建 `src-tauri/src/ai/mod.rs`**:
```rust
pub mod engine;
pub mod evaluator;
pub mod minimax;
pub mod pattern;

pub use engine::{AIEngine, Difficulty};
pub use evaluator::PatternEvaluator;
pub use minimax::MinimaxSolver;
pub use pattern::Pattern;
```

**在 `src-tauri/src/main.rs` 中添加模块声明**:
```rust
mod ai;
```

**验证标准**:
- [ ] AI 模块目录创建成功
- [ ] `mod.rs` 编译通过
- [ ] 模块在 `main.rs` 中正确声明

---

### 任务 1.2：定义 AI 数据类型

**优先级**: 🔴 最高

**前置条件**: 完成任务 1.1

**创建 `src-tauri/src/ai/pattern.rs`**:
```rust
use serde::{Deserialize, Serialize};

/// 棋型定义
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Pattern {
    Five,        // 连五 (赢)
    LiveFour,    // 活四 (必胜)
    DeadFour,    // 冲四
    LiveThree,   // 活三
    DeadThree,   // 眠三
    LiveTwo,     // 活二
    DeadTwo,     // 眠二
}

impl Pattern {
    /// 获取棋型分数
    pub fn score(&self) -> i32 {
        match self {
            Pattern::Five => 100000,
            Pattern::LiveFour => 10000,
            Pattern::DeadFour => 1000,
            Pattern::LiveThree => 500,
            Pattern::DeadThree => 100,
            Pattern::LiveTwo => 50,
            Pattern::DeadTwo => 10,
        }
    }
}

/// AI 难度等级
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Difficulty {
    Easy,    // 深度 2
    Medium,  // 深度 4
    Hard,    // 深度 6
}

impl Difficulty {
    pub fn search_depth(&self) -> u8 {
        match self {
            Difficulty::Easy => 2,
            Difficulty::Medium => 4,
            Difficulty::Hard => 6,
        }
    }

    pub fn max_candidates(&self) -> usize {
        match self {
            Difficulty::Easy => 10,
            Difficulty::Medium => 15,
            Difficulty::Hard => 20,
        }
    }
}
```

**验证标准**:
- [ ] 所有类型定义编译通过
- [ ] Pattern 有 score() 方法
- [ ] Difficulty 有辅助方法

**注意事项**:
- 棋型分数基于五子棋标准估值
- 难度等级决定搜索深度和候选位置数量

---

### 任务 1.3：实现棋型评估器

**优先级**: 🔴 最高

**前置条件**: 完成任务 1.2

**创建 `src-tauri/src/ai/evaluator.rs`**:
```rust
use crate::game::{Board, Cell, Player};
use super::pattern::Pattern;

pub struct PatternEvaluator;

impl PatternEvaluator {
    /// 评估整个棋盘局面（从某个玩家视角）
    pub fn evaluate_board(board: &Board, player: Player) -> i32 {
        let mut score = 0;

        // 遍历所有位置
        for x in 0..15 {
            for y in 0..15 {
                if let Ok(cell) = board.get(x, y) {
                    if cell == Cell::Empty {
                        continue;
                    }

                    let cell_player = match cell {
                        Cell::Black => Player::Black,
                        Cell::White => Player::White,
                        Cell::Empty => continue,
                    };

                    // 检测该位置的所有棋型
                    let patterns = Self::detect_patterns_at(board, x, y, cell_player);
                    let position_score: i32 = patterns.iter().map(|p| p.score()).sum();

                    // 己方加分，对方减分（防守权重稍高）
                    if cell_player == player {
                        score += position_score;
                    } else {
                        score -= (position_score as f32 * 1.1) as i32;
                    }
                }
            }
        }

        score
    }

    /// 检测指定位置的所有棋型
    fn detect_patterns_at(board: &Board, x: usize, y: usize, player: Player) -> Vec<Pattern> {
        let cell = match player {
            Player::Black => Cell::Black,
            Player::White => Cell::White,
        };

        let mut patterns = Vec::new();

        // 四个方向：横、竖、斜右下、斜左下
        let directions = [
            (0, 1),   // 横向 →
            (1, 0),   // 纵向 ↓
            (1, 1),   // 斜向 ↘
            (1, -1),  // 斜向 ↙
        ];

        for (dx, dy) in directions {
            if let Some(pattern) = Self::analyze_line(board, x, y, dx, dy, cell) {
                patterns.push(pattern);
            }
        }

        patterns
    }

    /// 分析一条线上的棋型
    fn analyze_line(
        board: &Board,
        x: usize,
        y: usize,
        dx: isize,
        dy: isize,
        target_cell: Cell,
    ) -> Option<Pattern> {
        let (count, left_open, right_open) = Self::count_line(board, x, y, dx, dy, target_cell);

        // 根据连续数量和开口情况判定棋型
        match count {
            5.. => Some(Pattern::Five),
            4 => {
                if left_open && right_open {
                    Some(Pattern::LiveFour)
                } else if left_open || right_open {
                    Some(Pattern::DeadFour)
                } else {
                    None
                }
            }
            3 => {
                if left_open && right_open {
                    Some(Pattern::LiveThree)
                } else if left_open || right_open {
                    Some(Pattern::DeadThree)
                } else {
                    None
                }
            }
            2 => {
                if left_open && right_open {
                    Some(Pattern::LiveTwo)
                } else if left_open || right_open {
                    Some(Pattern::DeadTwo)
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    /// 统计一条线上的连续棋子数量和开口情况
    fn count_line(
        board: &Board,
        x: usize,
        y: usize,
        dx: isize,
        dy: isize,
        target_cell: Cell,
    ) -> (usize, bool, bool) {
        let mut count = 1; // 包含当前位置

        // 正向统计
        let mut nx = x as isize + dx;
        let mut ny = y as isize + dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if board.get(nx as usize, ny as usize).ok() == Some(target_cell) {
                count += 1;
                nx += dx;
                ny += dy;
            } else {
                break;
            }
        }
        let right_open = nx >= 0 && nx < 15 && ny >= 0 && ny < 15
            && board.get(nx as usize, ny as usize).ok() == Some(Cell::Empty);

        // 反向统计
        let mut nx = x as isize - dx;
        let mut ny = y as isize - dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if board.get(nx as usize, ny as usize).ok() == Some(target_cell) {
                count += 1;
                nx -= dx;
                ny -= dy;
            } else {
                break;
            }
        }
        let left_open = nx >= 0 && nx < 15 && ny >= 0 && ny < 15
            && board.get(nx as usize, ny as usize).ok() == Some(Cell::Empty);

        (count, left_open, right_open)
    }
}
```

**验证标准**:
- [ ] 代码编译通过
- [ ] 能正确识别各种棋型
- [ ] 评估分数合理

**注意事项**:
- 棋型识别需要考虑开口情况（活棋 vs 死棋）
- 防守权重略高于进攻（乘以 1.1）

---

### 任务 1.4：实现 Minimax 算法

**优先级**: 🔴 最高

**前置条件**: 完成任务 1.3

**创建 `src-tauri/src/ai/minimax.rs`**:
```rust
use crate::game::{Board, Player, Position};
use super::evaluator::PatternEvaluator;

pub struct MinimaxSolver;

impl MinimaxSolver {
    /// Minimax 算法 with Alpha-Beta 剪枝
    pub fn minimax(
        board: &Board,
        depth: u8,
        mut alpha: i32,
        mut beta: i32,
        maximizing: bool,
        player: Player,
    ) -> (i32, Option<Position>) {
        // 终止条件：达到最大深度或游戏结束
        if depth == 0 || Self::is_game_over(board) {
            let score = PatternEvaluator::evaluate_board(board, player);
            return (score, None);
        }

        let candidates = Self::generate_candidate_moves(board, 20);
        if candidates.is_empty() {
            return (0, None);
        }

        let mut best_move = None;

        if maximizing {
            let mut max_eval = i32::MIN;

            for pos in candidates {
                // 模拟落子
                let mut new_board = board.clone();
                if new_board.set(pos.x, pos.y, player).is_err() {
                    continue;
                }

                let (eval, _) = Self::minimax(
                    &new_board,
                    depth - 1,
                    alpha,
                    beta,
                    false,
                    player,
                );

                if eval > max_eval {
                    max_eval = eval;
                    best_move = Some(pos);
                }

                alpha = alpha.max(eval);
                if beta <= alpha {
                    break; // Beta 剪枝
                }
            }

            (max_eval, best_move)
        } else {
            let mut min_eval = i32::MAX;

            for pos in candidates {
                // 模拟对手落子
                let mut new_board = board.clone();
                let opponent = player.opponent();
                if new_board.set(pos.x, pos.y, opponent).is_err() {
                    continue;
                }

                let (eval, _) = Self::minimax(
                    &new_board,
                    depth - 1,
                    alpha,
                    beta,
                    true,
                    player,
                );

                if eval < min_eval {
                    min_eval = eval;
                    best_move = Some(pos);
                }

                beta = beta.min(eval);
                if beta <= alpha {
                    break; // Alpha 剪枝
                }
            }

            (min_eval, best_move)
        }
    }

    /// 生成候选落子位置（启发式搜索）
    fn generate_candidate_moves(board: &Board, max_count: usize) -> Vec<Position> {
        let mut candidates = Vec::new();

        for x in 0..15 {
            for y in 0..15 {
                if board.is_empty(x, y) && Self::has_neighbor_within(board, x, y, 2) {
                    // 只考虑已有棋子周围 2 格内的位置
                    let score = Self::evaluate_position(board, x, y);
                    candidates.push((Position { x, y }, score));
                }
            }
        }

        // 按评估分数排序（降序）
        candidates.sort_by(|a, b| b.1.cmp(&a.1));

        // 返回前 N 个候选位置
        candidates
            .into_iter()
            .take(max_count)
            .map(|(pos, _)| pos)
            .collect()
    }

    /// 检查周围是否有邻居棋子
    fn has_neighbor_within(board: &Board, x: usize, y: usize, distance: usize) -> bool {
        let start_x = x.saturating_sub(distance);
        let end_x = (x + distance).min(14);
        let start_y = y.saturating_sub(distance);
        let end_y = (y + distance).min(14);

        for nx in start_x..=end_x {
            for ny in start_y..=end_y {
                if nx == x && ny == y {
                    continue;
                }
                if !board.is_empty(nx, ny) {
                    return true;
                }
            }
        }

        false
    }

    /// 快速评估某个位置的重要性
    fn evaluate_position(board: &Board, x: usize, y: usize) -> i32 {
        // 简化版评估：检查四个方向的连续棋子
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        let mut score = 0;

        for (dx, dy) in directions {
            score += Self::count_neighbors(board, x, y, dx, dy);
        }

        // 中心位置略微加分
        let center_bonus = 7 - (x as i32 - 7).abs() - (y as i32 - 7).abs();
        score + center_bonus * 2
    }

    /// 统计某个方向的邻居棋子数量
    fn count_neighbors(board: &Board, x: usize, y: usize, dx: isize, dy: isize) -> i32 {
        let mut count = 0;

        // 正向
        let mut nx = x as isize + dx;
        let mut ny = y as isize + dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if !board.is_empty(nx as usize, ny as usize) {
                count += 1;
                nx += dx;
                ny += dy;
            } else {
                break;
            }
        }

        // 反向
        let mut nx = x as isize - dx;
        let mut ny = y as isize - dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if !board.is_empty(nx as usize, ny as usize) {
                count += 1;
                nx -= dx;
                ny -= dy;
            } else {
                break;
            }
        }

        count
    }

    /// 检查游戏是否结束
    fn is_game_over(board: &Board) -> bool {
        // 简化判断：棋盘已满
        board.is_full()
    }
}
```

**验证标准**:
- [ ] Minimax 算法编译通过
- [ ] Alpha-Beta 剪枝正确实现
- [ ] 候选位置生成合理

**注意事项**:
- 使用 `board.clone()` 模拟落子（需要为 Board 实现 Clone trait）
- 候选位置过滤减少搜索空间
- 按评估分数排序优先搜索好位置

---

### 任务 1.5：实现 AI 引擎接口

**优先级**: 🔴 最高

**前置条件**: 完成任务 1.4

**创建 `src-tauri/src/ai/engine.rs`**:
```rust
use crate::game::{Board, Player, Position};
use super::minimax::MinimaxSolver;
use super::pattern::Difficulty;

pub struct AIEngine {
    difficulty: Difficulty,
}

impl AIEngine {
    pub fn new(difficulty: Difficulty) -> Self {
        AIEngine { difficulty }
    }

    /// 获取 AI 的最佳落子位置
    pub fn get_best_move(&self, board: &Board, player: Player) -> Option<Position> {
        let depth = self.difficulty.search_depth();
        let (_, best_move) = MinimaxSolver::minimax(
            board,
            depth,
            i32::MIN,
            i32::MAX,
            true,
            player,
        );

        best_move
    }

    /// 更改难度
    pub fn set_difficulty(&mut self, difficulty: Difficulty) {
        self.difficulty = difficulty;
    }
}
```

**验证标准**:
- [ ] AIEngine 编译通过
- [ ] 可以获取最佳落子
- [ ] 难度可调整

---

### 任务 1.6：为 Board 实现 Clone trait

**优先级**: 🔴 最高

**前置条件**: 完成任务 1.4

**修改 `src-tauri/src/game/board.rs`**:
```rust
// 在 Board 结构体上方添加
#[derive(Clone)]
pub struct Board {
    grid: [[Cell; 15]; 15],
    size: usize,
}
```

**同时修改 `src-tauri/src/game/types.rs`**:
```rust
// 为 Cell 添加 Clone 和 Copy
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Cell {
    Empty,
    Black,
    White,
}
```

**验证标准**:
- [ ] Board 可以 clone
- [ ] Cell 可以 copy
- [ ] 代码编译通过

---

## 阶段二：AI 集成与人机对弈

### 任务 2.1：添加游戏模式到数据模型

**优先级**: 🔴 最高

**前置条件**: 完成阶段一

**修改 `src-tauri/src/game/types.rs`**:
```rust
/// 游戏模式
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum GameMode {
    PvP,  // 玩家 vs 玩家
    PvE,  // 玩家 vs AI
}

/// AI 难度（从 ai 模块导出）
pub use crate::ai::Difficulty;
```

**验证标准**:
- [ ] GameMode 枚举定义正确
- [ ] Difficulty 从 ai 模块导出

---

### 任务 2.2：更新 GameState 支持 AI

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.1

**修改 `src-tauri/src/main.rs` 中的 GameState**:
```rust
use crate::ai::{AIEngine, Difficulty};
use crate::game::GameMode;

pub struct GameState {
    board: Mutex<Board>,
    current_player: Mutex<Player>,
    game_status: Mutex<GameStatus>,
    move_history: Mutex<Vec<Position>>,

    // 新增字段
    game_mode: Mutex<GameMode>,
    ai_difficulty: Mutex<Difficulty>,
    ai_engine: Mutex<Option<AIEngine>>,
}

impl GameState {
    fn new() -> Self {
        GameState {
            board: Mutex::new(Board::new()),
            current_player: Mutex::new(Player::Black),
            game_status: Mutex::new(GameStatus::InProgress),
            move_history: Mutex::new(Vec::new()),
            game_mode: Mutex::new(GameMode::PvP),
            ai_difficulty: Mutex::new(Difficulty::Medium),
            ai_engine: Mutex::new(None),
        }
    }
}
```

**验证标准**:
- [ ] GameState 包含 AI 相关字段
- [ ] 编译通过

---

### 任务 2.3：实现 AI 相关 Tauri Commands

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.2

**在 `src-tauri/src/commands/mod.rs` 中添加新命令**:
```rust
use crate::ai::{AIEngine, Difficulty};
use crate::game::GameMode;

/// 开始新游戏（支持模式选择）
#[tauri::command]
pub async fn new_game_with_mode(
    state: State<'_, GameState>,
    mode: String,
    difficulty: Option<String>,
) -> Result<(), String> {
    // 解析游戏模式
    let game_mode = match mode.as_str() {
        "pvp" => GameMode::PvP,
        "pve" => GameMode::PvE,
        _ => return Err("Invalid game mode".to_string()),
    };

    // 解析 AI 难度
    let ai_difficulty = if let Some(diff) = difficulty {
        match diff.as_str() {
            "easy" => Difficulty::Easy,
            "medium" => Difficulty::Medium,
            "hard" => Difficulty::Hard,
            _ => Difficulty::Medium,
        }
    } else {
        Difficulty::Medium
    };

    // 重置游戏状态
    {
        let mut board = state.board.lock().unwrap();
        board.clear();
    }

    {
        let mut player = state.current_player.lock().unwrap();
        *player = Player::Black;
    }

    {
        let mut status = state.game_status.lock().unwrap();
        *status = GameStatus::InProgress;
    }

    {
        let mut history = state.move_history.lock().unwrap();
        history.clear();
    }

    {
        let mut mode_ref = state.game_mode.lock().unwrap();
        *mode_ref = game_mode;
    }

    {
        let mut difficulty_ref = state.ai_difficulty.lock().unwrap();
        *difficulty_ref = ai_difficulty;
    }

    // 如果是 PvE 模式，初始化 AI 引擎
    {
        let mut ai_engine = state.ai_engine.lock().unwrap();
        if game_mode == GameMode::PvE {
            *ai_engine = Some(AIEngine::new(ai_difficulty));
        } else {
            *ai_engine = None;
        }
    }

    Ok(())
}

/// 获取 AI 落子
#[tauri::command]
pub async fn get_ai_move(
    state: State<'_, GameState>,
) -> Result<Position, String> {
    let board = state.board.lock().unwrap().clone();
    let current_player = *state.current_player.lock().unwrap();
    let ai_engine = state.ai_engine.lock().unwrap();

    if let Some(engine) = ai_engine.as_ref() {
        engine
            .get_best_move(&board, current_player)
            .ok_or_else(|| "AI failed to find a move".to_string())
    } else {
        Err("AI engine not initialized".to_string())
    }
}

/// 获取当前游戏配置
#[tauri::command]
pub async fn get_game_config(
    state: State<'_, GameState>,
) -> Result<GameConfig, String> {
    let mode = *state.game_mode.lock().unwrap();
    let difficulty = *state.ai_difficulty.lock().unwrap();

    Ok(GameConfig {
        mode: match mode {
            GameMode::PvP => "pvp".to_string(),
            GameMode::PvE => "pve".to_string(),
        },
        difficulty: match difficulty {
            Difficulty::Easy => "easy".to_string(),
            Difficulty::Medium => "medium".to_string(),
            Difficulty::Hard => "hard".to_string(),
        },
    })
}

#[derive(Serialize)]
pub struct GameConfig {
    pub mode: String,
    pub difficulty: String,
}
```

**在 `main.rs` 的 invoke_handler 中注册新命令**:
```rust
.invoke_handler(tauri::generate_handler![
    commands::place_stone,
    commands::new_game,
    commands::new_game_with_mode,
    commands::get_ai_move,
    commands::get_game_config,
    commands::undo_move,
    commands::get_board_state,
])
```

**验证标准**:
- [ ] 新命令编译通过
- [ ] 命令在 invoke_handler 中注册
- [ ] AI 引擎正确初始化

---

### 任务 2.4：前端类型定义更新

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.3

**更新 `src/types/game.ts`**:
```typescript
export type GameMode = 'pvp' | 'pve';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
}
```

**验证标准**:
- [ ] 类型定义与后端一致

---

### 任务 2.5：前端 Tauri API 封装更新

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.4

**更新 `src/utils/tauri.ts`**:
```typescript
import { invoke } from '@tauri-apps/api/core';
import { MoveResult, Position, GameConfig, GameMode, Difficulty } from '@/types/game';

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
};
```

**验证标准**:
- [ ] 所有新 API 方法类型正确
- [ ] 编译通过

---

### 任务 2.6：更新 Zustand Store 支持 AI

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.5

**更新 `src/stores/gameStore.ts`**:
```typescript
import { create } from 'zustand';
import { tauriApi } from '@/utils/tauri';
import { Cell, GameStatus, Position, GameMode, Difficulty } from '@/types/game';

interface GameState {
  board: Cell[][];
  currentPlayer: 'black' | 'white';
  gameStatus: GameStatus;
  moveHistory: Array<{ x: number; y: number }>;
  winningLine: Position[] | null;
  isProcessing: boolean;

  // 新增字段
  gameMode: GameMode;
  aiDifficulty: Difficulty;

  // 更新的 Actions
  placeStone: (x: number, y: number) => Promise<void>;
  newGame: (mode: GameMode, difficulty?: Difficulty) => Promise<void>;
  undoMove: () => Promise<void>;
  syncBoardState: () => Promise<void>;
  loadGameConfig: () => Promise<void>;
}

export const useGameStore = create<GameState>((set, get) => ({
  board: Array(15).fill(null).map(() => Array(15).fill(null)),
  currentPlayer: 'black',
  gameStatus: 'idle',
  moveHistory: [],
  winningLine: null,
  isProcessing: false,
  gameMode: 'pvp',
  aiDifficulty: 'medium',

  placeStone: async (x: number, y: number) => {
    const { isProcessing, gameStatus, gameMode } = get();

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

      // 如果是 PvE 模式且轮到 AI（假设 AI 是白方）
      if (gameMode === 'pve' && result.game_status === 'playing' && get().currentPlayer === 'white') {
        // 延迟一小段时间让用户看到自己的落子
        setTimeout(() => {
          get().handleAIMove();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to place stone:', error);
      alert(`落子失败: ${error}`);
    } finally {
      set({ isProcessing: false });
    }
  },

  // 新增：处理 AI 落子
  handleAIMove: async () => {
    const { isProcessing, gameStatus } = get();

    if (isProcessing || gameStatus !== 'playing') {
      return;
    }

    set({ isProcessing: true });

    try {
      const aiMove = await tauriApi.getAIMove();
      const result = await tauriApi.placeStone(aiMove.x, aiMove.y);

      const newBoard = get().board.map(row => [...row]);
      newBoard[aiMove.x][aiMove.y] = 'white';

      set({
        board: newBoard,
        currentPlayer: 'black',
        gameStatus: result.game_status,
        winningLine: result.winning_line || null,
        moveHistory: [...get().moveHistory, { x: aiMove.x, y: aiMove.y }],
      });
    } catch (error) {
      console.error('AI move failed:', error);
      alert(`AI 落子失败: ${error}`);
    } finally {
      set({ isProcessing: false });
    }
  },

  newGame: async (mode: GameMode, difficulty?: Difficulty) => {
    set({ isProcessing: true });

    try {
      await tauriApi.newGameWithMode(mode, difficulty);
      set({
        board: Array(15).fill(null).map(() => Array(15).fill(null)),
        currentPlayer: 'black',
        gameStatus: 'playing',
        moveHistory: [],
        winningLine: null,
        gameMode: mode,
        aiDifficulty: difficulty || 'medium',
      });
    } catch (error) {
      console.error('Failed to start new game:', error);
    } finally {
      set({ isProcessing: false });
    }
  },

  undoMove: async () => {
    const { moveHistory, gameMode } = get();

    // PvE 模式下需要悔两步（玩家 + AI）
    const undoCount = gameMode === 'pve' ? 2 : 1;

    if (moveHistory.length < undoCount) return;

    set({ isProcessing: true });

    try {
      for (let i = 0; i < undoCount; i++) {
        await tauriApi.undoMove();

        const lastMove = get().moveHistory[get().moveHistory.length - 1];
        const newBoard = get().board.map(row => [...row]);
        newBoard[lastMove.x][lastMove.y] = null;

        set({
          board: newBoard,
          currentPlayer: get().currentPlayer === 'black' ? 'white' : 'black',
          gameStatus: 'playing',
          moveHistory: get().moveHistory.slice(0, -1),
          winningLine: null,
        });
      }
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

  loadGameConfig: async () => {
    try {
      const config = await tauriApi.getGameConfig();
      set({
        gameMode: config.mode,
        aiDifficulty: config.difficulty,
      });
    } catch (error) {
      console.error('Failed to load game config:', error);
    }
  },
}));
```

**验证标准**:
- [ ] AI 落子逻辑正确
- [ ] PvE 模式悔棋正确（悔两步）
- [ ] 编译通过

---

### 任务 2.7：创建游戏模式选择组件

**优先级**: 🟡 高

**前置条件**: 完成任务 2.6

**创建 `src/components/Game/GameModeSelector.tsx`**:
```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { GameMode, Difficulty } from '@/types/game';
import { Users, Bot, Zap, Brain, Trophy } from 'lucide-react';

const GameModeSelector: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('pvp');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const newGame = useGameStore(state => state.newGame);
  const isProcessing = useGameStore(state => state.isProcessing);

  const handleStartGame = () => {
    if (selectedMode === 'pve') {
      newGame(selectedMode, selectedDifficulty);
    } else {
      newGame(selectedMode);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800">游戏模式</h2>

      {/* 模式选择 */}
      <div className="flex gap-3">
        <button
          onClick={() => setSelectedMode('pvp')}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            selectedMode === 'pvp'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <div className="font-medium">双人对弈</div>
          <div className="text-xs text-gray-500 mt-1">PvP</div>
        </button>

        <button
          onClick={() => setSelectedMode('pve')}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            selectedMode === 'pve'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Bot className="w-6 h-6 mx-auto mb-2 text-purple-500" />
          <div className="font-medium">人机对战</div>
          <div className="text-xs text-gray-500 mt-1">PvE</div>
        </button>
      </div>

      {/* AI 难度选择（仅 PvE 模式） */}
      {selectedMode === 'pve' && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700">AI 难度</div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDifficulty('easy')}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                selectedDifficulty === 'easy'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Zap className="w-5 h-5 mx-auto mb-1 text-green-500" />
              <div className="text-sm font-medium">简单</div>
            </button>

            <button
              onClick={() => setSelectedDifficulty('medium')}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                selectedDifficulty === 'medium'
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Brain className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <div className="text-sm font-medium">中等</div>
            </button>

            <button
              onClick={() => setSelectedDifficulty('hard')}
              className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                selectedDifficulty === 'hard'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-5 h-5 mx-auto mb-1 text-red-500" />
              <div className="text-sm font-medium">困难</div>
            </button>
          </div>
        </div>
      )}

      {/* 开始游戏按钮 */}
      <Button
        onClick={handleStartGame}
        disabled={isProcessing}
        className="w-full"
        size="lg"
      >
        开始游戏
      </Button>
    </div>
  );
};

export default GameModeSelector;
```

**验证标准**:
- [ ] 模式选择 UI 正确
- [ ] 难度选择仅在 PvE 显示
- [ ] 开始游戏功能正常

---

### 任务 2.8：更新 App.tsx 集成模式选择器

**优先级**: 🟡 高

**前置条件**: 完成任务 2.7

**更新 `src/App.tsx`**:
```typescript
import React from 'react';
import Board from '@/components/Board/Board';
import GameModeSelector from '@/components/Game/GameModeSelector';
import GameStatus from '@/components/Game/GameStatus';
import GameControls from '@/components/Game/GameControls';
import { useGameStore } from '@/stores/gameStore';

function App() {
  const gameStatus = useGameStore(state => state.gameStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="container mx-auto py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">五子棋</h1>
          <p className="text-gray-600 mt-2">双人对弈 · 人机对战 · 五子连珠</p>
        </header>

        {gameStatus === 'idle' ? (
          // 游戏开始前：显示模式选择器
          <div className="flex justify-center">
            <div className="w-96">
              <GameModeSelector />
            </div>
          </div>
        ) : (
          // 游戏进行中：显示棋盘和控制面板
          <div className="flex gap-8 items-start justify-center">
            <div className="flex-shrink-0">
              <Board />
            </div>

            <div className="flex flex-col gap-4 w-64">
              <GameStatus />
              <GameControls />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

**验证标准**:
- [ ] 初始显示模式选择器
- [ ] 开始游戏后显示棋盘
- [ ] 布局合理

---

## 阶段二完成总结 ✅

完成此阶段后，应实现：
- ✅ AI 引擎（Minimax + Alpha-Beta 剪枝）
- ✅ 棋型评估系统
- ✅ 人机对弈模式（PvE）
- ✅ AI 难度选择（简单/中等/困难）
- ✅ 游戏模式选择 UI

---

## 阶段三：数据持久化（游戏保存/加载）

### 任务 3.1：添加 SQLite 依赖

**优先级**: 🔴 最高

**执行步骤**:

**修改 `src-tauri/Cargo.toml`**:
```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rusqlite = { version = "0.32", features = ["bundled"] }
chrono = "0.4"
```

**验证标准**:
- [ ] 依赖添加成功
- [ ] 编译通过

---

### 任务 3.2：创建数据库模块

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.1

**执行步骤**:
```bash
mkdir -p src-tauri/src/storage
```

**创建 `src-tauri/src/storage/mod.rs`**:
```rust
pub mod database;
pub mod models;

pub use database::Database;
pub use models::*;
```

**在 `src-tauri/src/main.rs` 中添加模块声明**:
```rust
mod storage;
```

**验证标准**:
- [ ] 目录创建成功
- [ ] 模块声明正确

---

### 任务 3.3：定义数据模型

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.2

**创建 `src-tauri/src/storage/models.rs`**:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedGame {
    pub id: Option<i64>,
    pub name: String,
    pub mode: String,        // "pvp" or "pve"
    pub difficulty: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub status: String,      // "in_progress", "black_win", "white_win", "draw"
    pub winner: Option<String>,
    pub total_moves: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedMove {
    pub id: Option<i64>,
    pub game_id: i64,
    pub move_number: i32,
    pub player: String,      // "black" or "white"
    pub position_x: i32,
    pub position_y: i32,
    pub timestamp: i64,
}
```

**验证标准**:
- [ ] 模型定义编译通过
- [ ] 所有字段有 Serialize/Deserialize

---

### 任务 3.4：实现数据库操作

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.3

**创建 `src-tauri/src/storage/database.rs`**:
```rust
use rusqlite::{Connection, Result};
use std::path::PathBuf;
use chrono::Utc;
use super::models::{SavedGame, SavedMove};

pub struct Database {
    conn: Connection,
}

impl Database {
    /// 初始化数据库
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.create_tables()?;
        Ok(db)
    }

    /// 创建表结构
    fn create_tables(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mode TEXT NOT NULL,
                difficulty TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                status TEXT NOT NULL,
                winner TEXT,
                total_moves INTEGER DEFAULT 0
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS moves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                move_number INTEGER NOT NULL,
                player TEXT NOT NULL,
                position_x INTEGER NOT NULL,
                position_y INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves(game_id)",
            [],
        )?;

        Ok(())
    }

    /// 保存游戏
    pub fn save_game(&self, game: &SavedGame) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO games (name, mode, difficulty, created_at, updated_at, status, winner, total_moves)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            (
                &game.name,
                &game.mode,
                &game.difficulty,
                game.created_at,
                game.updated_at,
                &game.status,
                &game.winner,
                game.total_moves,
            ),
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    /// 保存落子记录
    pub fn save_move(&self, move_data: &SavedMove) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO moves (game_id, move_number, player, position_x, position_y, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            (
                move_data.game_id,
                move_data.move_number,
                &move_data.player,
                move_data.position_x,
                move_data.position_y,
                move_data.timestamp,
            ),
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    /// 获取所有游戏列表
    pub fn list_games(&self) -> Result<Vec<SavedGame>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, mode, difficulty, created_at, updated_at, status, winner, total_moves
             FROM games ORDER BY updated_at DESC"
        )?;

        let games = stmt.query_map([], |row| {
            Ok(SavedGame {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                mode: row.get(2)?,
                difficulty: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                status: row.get(6)?,
                winner: row.get(7)?,
                total_moves: row.get(8)?,
            })
        })?;

        games.collect()
    }

    /// 获取游戏的所有落子记录
    pub fn get_moves(&self, game_id: i64) -> Result<Vec<SavedMove>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, game_id, move_number, player, position_x, position_y, timestamp
             FROM moves WHERE game_id = ?1 ORDER BY move_number ASC"
        )?;

        let moves = stmt.query_map([game_id], |row| {
            Ok(SavedMove {
                id: Some(row.get(0)?),
                game_id: row.get(1)?,
                move_number: row.get(2)?,
                player: row.get(3)?,
                position_x: row.get(4)?,
                position_y: row.get(5)?,
                timestamp: row.get(6)?,
            })
        })?;

        moves.collect()
    }

    /// 删除游戏
    pub fn delete_game(&self, game_id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM games WHERE id = ?1", [game_id])?;
        Ok(())
    }
}
```

**验证标准**:
- [ ] 数据库初始化正确
- [ ] CRUD 操作编译通过
- [ ] 外键和索引创建成功

---

### 任务 3.5：集成数据库到 GameState

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.4

**修改 `src-tauri/src/main.rs`**:
```rust
use crate::storage::Database;
use std::sync::Arc;

pub struct GameState {
    board: Mutex<Board>,
    current_player: Mutex<Player>,
    game_status: Mutex<GameStatus>,
    move_history: Mutex<Vec<Position>>,
    game_mode: Mutex<GameMode>,
    ai_difficulty: Mutex<Difficulty>,
    ai_engine: Mutex<Option<AIEngine>>,

    // 新增：数据库连接
    database: Arc<Mutex<Database>>,
}

impl GameState {
    fn new(database: Database) -> Self {
        GameState {
            board: Mutex::new(Board::new()),
            current_player: Mutex::new(Player::Black),
            game_status: Mutex::new(GameStatus::InProgress),
            move_history: Mutex::new(Vec::new()),
            game_mode: Mutex::new(GameMode::PvP),
            ai_difficulty: Mutex::new(Difficulty::Medium),
            ai_engine: Mutex::new(None),
            database: Arc::new(Mutex::new(database)),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 初始化数据库
    let app_data_dir = std::env::var("HOME")
        .map(|home| PathBuf::from(home).join(".gomoku"))
        .unwrap_or_else(|_| PathBuf::from(".gomoku"));

    std::fs::create_dir_all(&app_data_dir).ok();
    let db_path = app_data_dir.join("games.db");
    let database = Database::new(db_path).expect("Failed to initialize database");

    tauri::Builder::default()
        .manage(GameState::new(database))
        .invoke_handler(tauri::generate_handler![
            commands::place_stone,
            commands::new_game,
            commands::new_game_with_mode,
            commands::get_ai_move,
            commands::get_game_config,
            commands::undo_move,
            commands::get_board_state,
            commands::save_game,
            commands::load_game,
            commands::list_saved_games,
            commands::delete_saved_game,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**验证标准**:
- [ ] 数据库初始化成功
- [ ] GameState 包含数据库连接
- [ ] 编译通过

---

### 任务 3.6：实现游戏保存/加载 Commands

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.5

**在 `src-tauri/src/commands/mod.rs` 中添加**:
```rust
use crate::storage::{SavedGame, SavedMove};
use chrono::Utc;

/// 保存当前游戏
#[tauri::command]
pub async fn save_game(
    state: State<'_, GameState>,
    game_name: String,
) -> Result<i64, String> {
    let mode = *state.game_mode.lock().unwrap();
    let difficulty = *state.ai_difficulty.lock().unwrap();
    let game_status = state.game_status.lock().unwrap().clone();
    let move_history = state.move_history.lock().unwrap().clone();

    let status_str = match game_status {
        GameStatus::InProgress => "in_progress",
        GameStatus::BlackWin => "black_win",
        GameStatus::WhiteWin => "white_win",
        GameStatus::Draw => "draw",
    }.to_string();

    let winner = match game_status {
        GameStatus::BlackWin => Some("black".to_string()),
        GameStatus::WhiteWin => Some("white".to_string()),
        _ => None,
    };

    let saved_game = SavedGame {
        id: None,
        name: game_name,
        mode: match mode {
            GameMode::PvP => "pvp".to_string(),
            GameMode::PvE => "pve".to_string(),
        },
        difficulty: Some(match difficulty {
            Difficulty::Easy => "easy".to_string(),
            Difficulty::Medium => "medium".to_string(),
            Difficulty::Hard => "hard".to_string(),
        }),
        created_at: Utc::now().timestamp(),
        updated_at: Utc::now().timestamp(),
        status: status_str,
        winner,
        total_moves: move_history.len() as i32,
    };

    let db = state.database.lock().unwrap();
    let game_id = db.save_game(&saved_game)
        .map_err(|e| format!("Failed to save game: {}", e))?;

    // 保存所有落子记录
    for (index, pos) in move_history.iter().enumerate() {
        let player = if index % 2 == 0 { "black" } else { "white" };
        let saved_move = SavedMove {
            id: None,
            game_id,
            move_number: (index + 1) as i32,
            player: player.to_string(),
            position_x: pos.x as i32,
            position_y: pos.y as i32,
            timestamp: Utc::now().timestamp(),
        };
        db.save_move(&saved_move)
            .map_err(|e| format!("Failed to save move: {}", e))?;
    }

    Ok(game_id)
}

/// 加载游戏
#[tauri::command]
pub async fn load_game(
    state: State<'_, GameState>,
    game_id: i64,
) -> Result<(), String> {
    let db = state.database.lock().unwrap();

    // 获取游戏记录
    let games = db.list_games()
        .map_err(|e| format!("Failed to load games: {}", e))?;
    let game = games.into_iter()
        .find(|g| g.id == Some(game_id))
        .ok_or("Game not found")?;

    // 获取落子记录
    let moves = db.get_moves(game_id)
        .map_err(|e| format!("Failed to load moves: {}", e))?;

    // 重置棋盘
    {
        let mut board = state.board.lock().unwrap();
        board.clear();
    }

    // 重新下所有的棋
    for move_data in &moves {
        let player = match move_data.player.as_str() {
            "black" => Player::Black,
            "white" => Player::White,
            _ => continue,
        };

        let mut board = state.board.lock().unwrap();
        board.set(move_data.position_x as usize, move_data.position_y as usize, player)
            .map_err(|e| format!("Failed to replay move: {}", e))?;
    }

    // 恢复游戏状态
    {
        let mut current_player = state.current_player.lock().unwrap();
        *current_player = if moves.len() % 2 == 0 {
            Player::Black
        } else {
            Player::White
        };
    }

    {
        let mut game_status = state.game_status.lock().unwrap();
        *game_status = match game.status.as_str() {
            "in_progress" => GameStatus::InProgress,
            "black_win" => GameStatus::BlackWin,
            "white_win" => GameStatus::WhiteWin,
            "draw" => GameStatus::Draw,
            _ => GameStatus::InProgress,
        };
    }

    {
        let mut mode = state.game_mode.lock().unwrap();
        *mode = match game.mode.as_str() {
            "pvp" => GameMode::PvP,
            "pve" => GameMode::PvE,
            _ => GameMode::PvP,
        };
    }

    {
        let mut history = state.move_history.lock().unwrap();
        *history = moves.iter().map(|m| Position {
            x: m.position_x as usize,
            y: m.position_y as usize,
        }).collect();
    }

    Ok(())
}

/// 获取保存的游戏列表
#[tauri::command]
pub async fn list_saved_games(
    state: State<'_, GameState>,
) -> Result<Vec<SavedGame>, String> {
    let db = state.database.lock().unwrap();
    db.list_games()
        .map_err(|e| format!("Failed to list games: {}", e))
}

/// 删除保存的游戏
#[tauri::command]
pub async fn delete_saved_game(
    state: State<'_, GameState>,
    game_id: i64,
) -> Result<(), String> {
    let db = state.database.lock().unwrap();
    db.delete_game(game_id)
        .map_err(|e| format!("Failed to delete game: {}", e))
}
```

**验证标准**:
- [ ] 保存游戏功能正确
- [ ] 加载游戏能还原棋盘
- [ ] 列表和删除功能正常

---

### 任务 3.7：前端集成游戏保存/加载

（由于篇幅限制，此部分任务详情略，包括：前端类型定义、API 封装、UI 组件等）

**核心组件**:
- `GameSaveDialog.tsx` - 保存游戏对话框
- `GameLoadDialog.tsx` - 加载游戏对话框
- 在 `GameControls.tsx` 中添加保存/加载按钮

---

## 阶段四：用户体验增强

### 任务 4.1：添加落子音效

**优先级**: 🟡 高

**执行步骤**:
1. 准备音效文件（stone.mp3, win.mp3）
2. 放置到 `public/sounds/` 目录
3. 创建 `src/hooks/useSound.ts`
4. 在落子和获胜时播放音效

---

### 任务 4.2：实现获胜动画

**优先级**: 🟡 高

**执行步骤**:
1. 使用 CSS 动画或 Framer Motion
2. 获胜连线闪烁动画
3. 胜利提示弹窗动画

---

### 任务 4.3：历史记录查看与棋谱回放

**优先级**: 🟢 中

**执行步骤**:
1. 扩展 `MoveHistory` 组件
2. 添加回放控制（播放/暂停/前进/后退）
3. 实现棋盘状态回溯

---

## 阶段五：性能优化与测试

### 任务 5.1：AI 性能优化

**优先级**: 🟡 高

**优化项**:
1. 实现 Zobrist Hashing 缓存局面
2. 使用 Rayon 多线程并行搜索
3. 改进候选位置生成算法

---

### 任务 5.2：前端性能优化

**优先级**: 🟡 高

**优化项**:
1. 使用 React.memo 优化 Cell 组件
2. 考虑 Canvas 渲染替代 DOM
3. 虚拟滚动优化历史记录列表

---

### 任务 5.3：端到端测试

**优先级**: 🔴 最高

**测试清单**:
- [ ] PvP 模式完整流程
- [ ] PvE 模式各难度测试
- [ ] AI 落子合理性
- [ ] 游戏保存/加载
- [ ] 音效和动画
- [ ] 边界情况和错误处理

---

## 时间估算

| 阶段 | 预计时间 | 备注 |
|------|---------|------|
| 阶段一：AI 引擎 | 3-5 天 | 算法实现和调优 |
| 阶段二：AI 集成 | 2-3 天 | 前后端集成 |
| 阶段三：数据持久化 | 2-3 天 | 数据库和文件操作 |
| 阶段四：UX 增强 | 2-3 天 | 音效、动画、回放 |
| 阶段五：优化测试 | 1-2 天 | 性能调优和测试 |
| **总计** | **10-16 天** | 根据经验调整 |

---

## 开发注意事项

### 🔴 关键注意事项

1. **AI 计算性能**
   - 搜索深度不宜过大（最大 6 层）
   - 候选位置过滤至关重要
   - 考虑异步计算避免 UI 阻塞

2. **数据库事务**
   - 保存游戏和落子记录应使用事务
   - 错误时需要回滚

3. **前后端状态同步**
   - 加载游戏后需要同步前端状态
   - 使用 `syncBoardState()` 确保一致性

4. **PvE 模式悔棋**
   - 需要悔两步（玩家 + AI）
   - 注意边界情况处理

---

## 参考资源

### AI 算法
- [Minimax 算法详解](https://en.wikipedia.org/wiki/Minimax)
- [Alpha-Beta 剪枝](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning)
- [五子棋 AI 开发指南](https://github.com/topics/gomoku-ai)

### Rust SQLite
- [rusqlite 文档](https://docs.rs/rusqlite/)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)

### 性能优化
- [Rayon 并行计算](https://docs.rs/rayon/)
- [React 性能优化](https://react.dev/learn/rendering-lists#optimizing-with-keys)

---

## 总结

本增强版任务清单基于架构文档的第二版功能规划，完整覆盖：

✅ **核心增强**:
- AI 引擎（Minimax + Alpha-Beta + 棋型评估）
- 人机对弈（PvE 模式）
- AI 难度选择（简单/中等/困难）

✅ **数据持久化**:
- SQLite 数据库
- 游戏保存/加载
- 历史记录查看

✅ **用户体验**:
- 落子音效
- 获胜动画
- 棋谱回放

✅ **性能优化**:
- AI 搜索优化
- 前端渲染优化
- 多线程并行计算

---

**祝开发顺利！按照本任务清单逐步实现，可完成五子棋增强版的所有功能。** 🎉
