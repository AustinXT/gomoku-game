# 五子棋 Mac Desktop App 架构方案

## 项目概述

基于 Tauri 2.0 框架开发的自由五子棋（无禁手限制）Mac 桌面应用。采用前后端分离架构，前端使用现代 Web 技术实现 UI 和交互，后端使用 Rust 实现核心游戏逻辑和系统集成。

### 技术栈选型

- **框架**: Tauri 2.0
- **前端**: React 18 + TypeScript
- **状态管理**: Zustand
- **样式**: Tailwind CSS + shadcn/ui
- **后端**: Rust (Tauri Core)
- **构建工具**: Vite
- **包管理**: pnpm

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────┐
│                  Presentation Layer                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │  Game     │  │  Setting  │  │  History  │      │
│  │  Board    │  │  Panel    │  │  Panel    │      │
│  └───────────┘  └───────────┘  └───────────┘      │
│         React Components (TypeScript)               │
└─────────────────────────────────────────────────────┘
                        │
                        ├─── Tauri IPC (Command/Event)
                        │
┌─────────────────────────────────────────────────────┐
│                   Business Layer                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │  Game     │  │  AI       │  │  Record   │      │
│  │  Engine   │  │  Engine   │  │  Manager  │      │
│  └───────────┘  └───────────┘  └───────────┘      │
│              Rust Backend Logic                     │
└─────────────────────────────────────────────────────┘
                        │
                        ├─── File System / Storage
                        │
┌─────────────────────────────────────────────────────┐
│                   Data Layer                         │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐      │
│  │  Game     │  │  User     │  │  History  │      │
│  │  State    │  │  Settings │  │  Records  │      │
│  └───────────┘  └───────────┘  └───────────┘      │
│            SQLite / JSON Files                      │
└─────────────────────────────────────────────────────┘
```

## 核心模块设计

### 1. 前端架构 (Frontend)

#### 1.1 目录结构

```
src/
├── components/          # React 组件
│   ├── Board/          # 棋盘组件
│   │   ├── Board.tsx
│   │   ├── Cell.tsx
│   │   └── Piece.tsx
│   ├── Game/           # 游戏控制组件
│   │   ├── GameHeader.tsx
│   │   ├── GameStatus.tsx
│   │   └── GameControls.tsx
│   ├── History/        # 历史记录组件
│   │   ├── MoveHistory.tsx
│   │   └── GameList.tsx
│   └── Settings/       # 设置组件
│       ├── GameSettings.tsx
│       └── AISettings.tsx
├── stores/             # 状态管理
│   ├── gameStore.ts    # 游戏状态
│   ├── settingsStore.ts # 设置状态
│   └── historyStore.ts # 历史记录状态
├── hooks/              # 自定义 Hooks
│   ├── useGame.ts
│   ├── useAI.ts
│   └── useSound.ts
├── types/              # TypeScript 类型定义
│   ├── game.ts
│   ├── board.ts
│   └── player.ts
├── utils/              # 工具函数
│   ├── boardUtils.ts
│   └── validation.ts
└── App.tsx             # 应用入口
```

#### 1.2 核心组件设计

##### Board 组件（棋盘）
```typescript
interface BoardProps {
  size: number;              // 棋盘大小 (15x15)
  pieces: PiecePosition[];   // 棋子位置
  onCellClick: (x: number, y: number) => void;
  lastMove?: Position;       // 最后一步位置
  winningLine?: Position[];  // 获胜连线
}

// 功能特性:
// - 15x15 网格渲染
// - 响应式棋盘缩放
// - 鼠标悬停预览
// - 落子动画
// - 获胜连线高亮
```

##### GameControls 组件（游戏控制）
```typescript
interface GameControlsProps {
  gameMode: 'pvp' | 'pve';   // 游戏模式
  onNewGame: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// 功能特性:
// - 新游戏
// - 悔棋/重做
// - 保存/加载
// - 认输/求和
```

#### 1.3 状态管理 (Zustand)

```typescript
// gameStore.ts
interface GameState {
  // 游戏状态
  board: Board;                    // 棋盘状态
  currentPlayer: Player;           // 当前玩家
  gameStatus: GameStatus;          // 游戏状态
  moveHistory: Move[];             // 落子历史

  // 游戏配置
  gameMode: 'pvp' | 'pve';        // 游戏模式
  aiDifficulty: 'easy' | 'medium' | 'hard';

  // Actions
  placeStone: (x: number, y: number) => Promise<void>;
  undo: () => void;
  redo: () => void;
  newGame: () => void;
  saveGame: () => void;
  loadGame: (gameId: string) => void;
}
```

### 2. 后端架构 (Rust)

#### 2.1 目录结构

```
src-tauri/
├── src/
│   ├── main.rs              # 入口文件
│   ├── commands/            # Tauri Commands
│   │   ├── game.rs
│   │   ├── ai.rs
│   │   └── storage.rs
│   ├── game/                # 游戏逻辑
│   │   ├── board.rs         # 棋盘逻辑
│   │   ├── rules.rs         # 规则判定
│   │   ├── engine.rs        # 游戏引擎
│   │   └── validator.rs     # 合法性验证
│   ├── ai/                  # AI 引擎
│   │   ├── minimax.rs       # Minimax 算法
│   │   ├── alphabeta.rs     # Alpha-Beta 剪枝
│   │   ├── evaluator.rs     # 局面评估
│   │   └── pattern.rs       # 棋型识别
│   ├── storage/             # 数据存储
│   │   ├── database.rs      # 数据库操作
│   │   └── models.rs        # 数据模型
│   └── utils/               # 工具模块
│       └── error.rs         # 错误处理
├── Cargo.toml
└── tauri.conf.json
```

#### 2.2 核心模块实现

##### 2.2.1 Game Engine (游戏引擎)

```rust
// game/engine.rs
pub struct GameEngine {
    board: Board,
    current_player: Player,
    move_history: Vec<Move>,
    game_status: GameStatus,
}

impl GameEngine {
    // 核心方法
    pub fn new() -> Self;
    pub fn place_stone(&mut self, x: usize, y: usize) -> Result<MoveResult>;
    pub fn undo(&mut self) -> Result<()>;
    pub fn check_winner(&self) -> Option<Player>;
    pub fn is_valid_move(&self, x: usize, y: usize) -> bool;
}
```

##### 2.2.2 Board (棋盘)

```rust
// game/board.rs
pub struct Board {
    grid: [[Cell; 15]; 15],
    size: usize,
}

pub enum Cell {
    Empty,
    Black,
    White,
}

impl Board {
    pub fn new(size: usize) -> Self;
    pub fn get(&self, x: usize, y: usize) -> Cell;
    pub fn set(&mut self, x: usize, y: usize, cell: Cell);
    pub fn clear(&mut self);
    pub fn count_pieces(&self) -> usize;
}
```

##### 2.2.3 Rules Validator (规则验证)

```rust
// game/rules.rs
pub struct RulesValidator;

impl RulesValidator {
    // 检查五子连珠（横/竖/斜）
    pub fn check_five_in_row(board: &Board, last_move: &Move) -> Option<WinningLine>;

    // 检查是否和棋（棋盘已满）
    pub fn is_draw(board: &Board) -> bool;

    // 验证落子合法性
    pub fn is_valid_position(board: &Board, x: usize, y: usize) -> bool;
}

// 五子连珠检测算法
fn check_direction(
    board: &Board,
    x: usize,
    y: usize,
    dx: isize,
    dy: isize
) -> usize {
    // 沿指定方向统计连续同色棋子数量
}
```

##### 2.2.4 AI Engine (AI 引擎)

```rust
// ai/engine.rs
pub struct AIEngine {
    difficulty: Difficulty,
    evaluator: PatternEvaluator,
}

pub enum Difficulty {
    Easy,    // 深度 2, 简单评估
    Medium,  // 深度 4, 标准评估
    Hard,    // 深度 6, 完整评估
}

impl AIEngine {
    pub fn get_best_move(&self, board: &Board) -> Move;

    // Minimax with Alpha-Beta Pruning
    fn minimax(
        &self,
        board: &Board,
        depth: u8,
        alpha: i32,
        beta: i32,
        maximizing: bool
    ) -> i32;
}
```

##### 2.2.5 Pattern Evaluator (棋型评估)

```rust
// ai/evaluator.rs
pub struct PatternEvaluator;

pub enum Pattern {
    Five,         // 连五      10000分
    LiveFour,     // 活四      5000分
    DeadFour,     // 冲四      500分
    LiveThree,    // 活三      200分
    DeadThree,    // 眠三      50分
    LiveTwo,      // 活二      20分
    DeadTwo,      // 眠二      5分
}

impl PatternEvaluator {
    // 评估整个棋盘局面
    pub fn evaluate_board(board: &Board, player: Player) -> i32;

    // 识别特定位置的棋型
    pub fn detect_patterns(board: &Board, x: usize, y: usize) -> Vec<Pattern>;

    // 计算棋型得分
    pub fn pattern_score(pattern: &Pattern) -> i32;
}
```

#### 2.3 Tauri Commands

```rust
// commands/game.rs
#[tauri::command]
async fn place_stone(
    state: State<'_, GameState>,
    x: usize,
    y: usize
) -> Result<MoveResult, String> {
    // 处理落子逻辑
}

#[tauri::command]
async fn get_ai_move(
    state: State<'_, GameState>,
    difficulty: String
) -> Result<Move, String> {
    // 获取 AI 落子
}

#[tauri::command]
async fn new_game(
    state: State<'_, GameState>,
    mode: String
) -> Result<(), String> {
    // 开始新游戏
}

#[tauri::command]
async fn undo_move(
    state: State<'_, GameState>
) -> Result<(), String> {
    // 悔棋
}

#[tauri::command]
async fn save_game(
    state: State<'_, GameState>,
    name: String
) -> Result<String, String> {
    // 保存游戏
}

#[tauri::command]
async fn load_game(
    state: State<'_, GameState>,
    game_id: String
) -> Result<GameData, String> {
    // 加载游戏
}
```

### 3. 数据模型

#### 3.1 核心数据结构

```rust
// 棋盘位置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: usize,
    pub y: usize,
}

// 落子记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Move {
    pub position: Position,
    pub player: Player,
    pub timestamp: i64,
    pub move_number: usize,
}

// 玩家
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Player {
    Black,
    White,
}

// 游戏状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameStatus {
    InProgress,
    BlackWin(WinningLine),
    WhiteWin(WinningLine),
    Draw,
}

// 获胜连线
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WinningLine {
    pub positions: Vec<Position>,
    pub direction: Direction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Direction {
    Horizontal,
    Vertical,
    DiagonalRight,  // ↘
    DiagonalLeft,   // ↙
}
```

#### 3.2 数据库 Schema (SQLite)

```sql
-- 游戏记录表
CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mode TEXT NOT NULL,        -- 'pvp' or 'pve'
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    status TEXT NOT NULL,       -- 'in_progress', 'black_win', 'white_win', 'draw'
    winner TEXT,                -- 'black', 'white', or NULL
    total_moves INTEGER DEFAULT 0
);

-- 落子记录表
CREATE TABLE moves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    move_number INTEGER NOT NULL,
    player TEXT NOT NULL,       -- 'black' or 'white'
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- 用户设置表
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 索引
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_moves_game_id ON moves(game_id);
```

### 4. 用户界面设计

#### 4.1 主界面布局

```
┌────────────────────────────────────────────────────┐
│  File  Game  View  Help                        ⚙️  │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────┐  ┌─────────────────────┐   │
│  │                  │  │  Game Info          │   │
│  │                  │  │  ─────────────      │   │
│  │                  │  │  Black: Player 1    │   │
│  │    15x15 Board   │  │  White: AI (Hard)   │   │
│  │                  │  │                     │   │
│  │                  │  │  Current: ⚫        │   │
│  │                  │  │  Moves: 24          │   │
│  │                  │  │                     │   │
│  └──────────────────┘  │  Controls           │   │
│                        │  ─────────────      │   │
│                        │  [New Game]         │   │
│                        │  [Undo] [Redo]      │   │
│                        │  [Save] [Load]      │   │
│                        │                     │   │
│                        │  History            │   │
│                        │  ─────────────      │   │
│                        │  24. ⚪ H8          │   │
│                        │  23. ⚫ G7          │   │
│                        │  22. ⚪ F6          │   │
│                        │  ...                │   │
│                        └─────────────────────┘   │
└────────────────────────────────────────────────────┘
```

#### 4.2 UI 特性

1. **棋盘渲染**
   - 15x15 标准网格
   - 天元标记（中心点）
   - 星位标记（3-3, 3-11, 11-3, 11-11）
   - 最后一步红框高亮
   - 获胜连线动画

2. **交互体验**
   - 鼠标悬停显示半透明预览
   - 落子音效
   - 获胜音效和动画
   - 悔棋/重做按钮状态管理
   - 快捷键支持（Cmd+Z 悔棋，Cmd+Shift+Z 重做）

3. **响应式设计**
   - 支持窗口缩放
   - 棋盘自适应大小
   - 最小窗口尺寸 800x600

### 5. AI 算法设计

#### 5.1 Minimax with Alpha-Beta Pruning

```rust
fn minimax(
    board: &Board,
    depth: u8,
    alpha: i32,
    beta: i32,
    maximizing: bool,
    player: Player
) -> (i32, Option<Move>) {
    // 终止条件
    if depth == 0 || game_over(board) {
        return (evaluate_board(board, player), None);
    }

    let mut best_move = None;

    if maximizing {
        let mut max_eval = i32::MIN;
        let mut alpha = alpha;

        for candidate_move in generate_moves(board) {
            let mut new_board = board.clone();
            new_board.apply_move(&candidate_move);

            let (eval, _) = minimax(&new_board, depth - 1, alpha, beta, false, player);

            if eval > max_eval {
                max_eval = eval;
                best_move = Some(candidate_move);
            }

            alpha = alpha.max(eval);
            if beta <= alpha {
                break; // Beta cutoff
            }
        }
        (max_eval, best_move)
    } else {
        let mut min_eval = i32::MAX;
        let mut beta = beta;

        for candidate_move in generate_moves(board) {
            let mut new_board = board.clone();
            new_board.apply_move(&candidate_move);

            let (eval, _) = minimax(&new_board, depth - 1, alpha, beta, true, player);

            if eval < min_eval {
                min_eval = eval;
                best_move = Some(candidate_move);
            }

            beta = beta.min(eval);
            if beta <= alpha {
                break; // Alpha cutoff
            }
        }
        (min_eval, best_move)
    }
}
```

#### 5.2 启发式搜索优化

```rust
// 候选落子生成（减少搜索空间）
fn generate_moves(board: &Board) -> Vec<Move> {
    let mut candidates = Vec::new();

    // 策略1: 只考虑已有棋子周围2格内的位置
    for x in 0..15 {
        for y in 0..15 {
            if board.is_empty(x, y) && has_neighbor_within(board, x, y, 2) {
                let score = evaluate_position(board, x, y);
                candidates.push((Move::new(x, y), score));
            }
        }
    }

    // 策略2: 按评估分数排序，优先搜索好的位置
    candidates.sort_by(|a, b| b.1.cmp(&a.1));

    // 策略3: 只保留前20个候选位置
    candidates.into_iter()
        .take(20)
        .map(|(m, _)| m)
        .collect()
}
```

#### 5.3 局面评估函数

```rust
fn evaluate_board(board: &Board, player: Player) -> i32 {
    let mut score = 0;

    // 遍历所有已下棋子
    for x in 0..15 {
        for y in 0..15 {
            if let Some(p) = board.get_piece(x, y) {
                let patterns = detect_patterns(board, x, y);
                let piece_score: i32 = patterns.iter()
                    .map(|p| pattern_score(p))
                    .sum();

                // 己方棋型加分，对方棋型减分
                if p == player {
                    score += piece_score;
                } else {
                    score -= piece_score * 1.1; // 防守稍微重要一点
                }
            }
        }
    }

    score
}

fn pattern_score(pattern: &Pattern) -> i32 {
    match pattern {
        Pattern::Five => 100000,        // 连五，立即获胜
        Pattern::LiveFour => 10000,     // 活四，必胜
        Pattern::DeadFour => 1000,      // 冲四
        Pattern::LiveThree => 500,      // 活三
        Pattern::DeadThree => 100,      // 眠三
        Pattern::LiveTwo => 50,         // 活二
        Pattern::DeadTwo => 10,         // 眠二
    }
}
```

### 6. 性能优化

#### 6.1 前端优化

1. **React 性能优化**
   ```typescript
   // 使用 memo 避免不必要的重渲染
   const Cell = React.memo(({ x, y, piece, onClick }: CellProps) => {
     // ...
   });

   // 使用 useMemo 缓存计算结果
   const boardGrid = useMemo(() =>
     generateBoardGrid(size), [size]
   );
   ```

2. **Canvas 渲染**
   - 考虑使用 Canvas 代替 DOM 元素渲染棋盘
   - 减少 DOM 节点数量（225个格子 vs 1个Canvas）
   - 提升渲染性能

#### 6.2 后端优化

1. **AI 计算优化**
   ```rust
   // 使用多线程并行计算
   use rayon::prelude::*;

   fn generate_moves_parallel(board: &Board) -> Vec<Move> {
       (0..15).into_par_iter()
           .flat_map(|x| {
               (0..15).into_par_iter()
                   .filter_map(move |y| {
                       if board.is_empty(x, y) {
                           Some(Move::new(x, y))
                       } else {
                           None
                       }
                   })
           })
           .collect()
   }
   ```

2. **缓存优化**
   ```rust
   use lru::LruCache;

   struct AIEngine {
       cache: LruCache<BoardHash, (i32, Move)>,
       // ...
   }

   // Zobrist Hashing for board state
   type BoardHash = u64;
   ```

### 7. 功能清单

#### 7.1 MVP 功能（第一版）

- [x] 基础棋盘渲染（15x15）
- [x] 双人对弈（PvP）
- [x] 落子合法性验证
- [x] 五子连珠判定
- [x] 游戏状态管理
- [x] 悔棋/重做
- [x] 新游戏/重新开始
- [x] 简单 UI 界面

#### 7.2 增强功能（第二版）

- [x] 人机对弈（PvE）
- [x] AI 难度选择（简单/中等/困难）
- [x] 落子音效
- [x] 获胜动画
- [x] 游戏保存/加载
- [x] 历史记录查看
- [x] 棋谱回放

<!--#### 7.3 高级功能（第三版）

- [ ] 在线对弈（需要服务器）
- [ ] 棋局分析（AI 评估）
- [ ] 开局库
- [ ] 主题切换
- [ ] 自定义棋盘大小
- [ ] 统计数据
- [ ] 排行榜-->

### 8. 开发计划

#### Phase 1: 核心功能（1-2周）

1. **搭建项目框架**
   - 初始化 Tauri 2.0 项目
   - 配置 React + TypeScript + Vite
   - 集成 Tailwind CSS 和 shadcn/ui

2. **实现游戏核心**
   - Board 组件和棋盘渲染
   - 游戏引擎（Rust 后端）
   - 规则验证和获胜判定
   - 基础 UI 交互

#### Phase 2: AI 引擎（2-3周）

1. **实现 AI 算法**
   - Minimax with Alpha-Beta
   - 棋型识别和评估
   - 难度等级实现

2. **优化性能**
   - 启发式搜索
   - 缓存机制
   - 多线程优化

#### Phase 3: 完善功能（1-2周）

1. **用户体验**
   - 音效和动画
   - 游戏保存/加载
   - 历史记录和回放
   - 设置界面

2. **测试和优化**
   - 单元测试
   - 集成测试
   - 性能测试
   - Bug 修复

### 9. 技术难点与解决方案

#### 9.1 AI 性能问题

**问题**: Minimax 算法搜索空间巨大（15x15=225 个位置）

**解决方案**:
1. Alpha-Beta 剪枝减少搜索节点
2. 限制搜索深度（2-6层）
3. 候选位置过滤（只搜索有棋子周围的位置）
4. Zobrist Hashing 缓存已评估局面
5. 多线程并行计算

#### 9.2 前端渲染性能

**问题**: 225 个 DOM 元素可能影响性能

**解决方案**:
1. 使用 Canvas 渲染代替 DOM
2. React.memo 避免不必要的重渲染
3. 事件委托减少事件监听器
4. 虚拟滚动优化历史记录列表

#### 9.3 状态同步

**问题**: 前后端状态一致性

**解决方案**:
1. 单一数据源（Rust 后端为主）
2. 前端通过 Tauri Command 与后端通信
3. 后端通过 Event 向前端推送状态更新
4. 乐观更新 + 错误回滚

### 10. 安全性考虑

1. **输入验证**
   - 所有前端输入在后端重新验证
   - 防止非法坐标和作弊行为

2. **数据持久化**
   - 使用 Tauri 提供的安全路径
   - 数据库加密（可选）

3. **代码签名**
   - Mac App Store 发布需要签名
   - 配置 entitlements

### 11. 部署方案

#### 11.1 开发环境

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm tauri dev

# 构建
pnpm tauri build
```

#### 11.2 生产构建

```bash
# 构建 macOS .dmg 和 .app
pnpm tauri build --target universal-apple-darwin

# 输出路径
# src-tauri/target/release/bundle/dmg/
# src-tauri/target/release/bundle/macos/
```

#### 11.3 发布渠道

1. **直接发布** - 提供 .dmg 下载
2. **Mac App Store** - 需要 Apple Developer 账号
3. **Homebrew Cask** - 适合开发者用户

## 总结

本架构方案采用 Tauri 2.0 框架，前端使用 React + TypeScript 构建现代化 UI，后端使用 Rust 实现高性能游戏引擎和 AI。通过模块化设计、清晰的职责划分和优化策略，确保应用具有良好的性能、可维护性和扩展性。

核心优势：
- ✅ 原生性能（Rust 后端）
- ✅ 现代化 UI（React + Tailwind）
- ✅ 小体积打包（相比 Electron）
- ✅ 类型安全（TypeScript + Rust）
- ✅ 强大 AI（Minimax + 优化）

适合作为学习 Tauri 开发和游戏 AI 实现的优秀项目。
