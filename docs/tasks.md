# 五子棋 MVP 开发任务清单

## 项目信息

- **项目名称**: 五子棋 Mac Desktop App
- **技术栈**: Tauri 2.0 + React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **开发顺序**: 项目初始化 → 后端实现 → 前端 UI
- **目标**: 完成 MVP（最小可行产品），支持双人对弈和基础功能

---

## 开发阶段划分

### 阶段一：项目初始化与环境配置（预计 2-3 小时）
### 阶段二：Rust 后端实现（预计 1-2 天）
### 阶段三：React 前端 UI 实现（预计 2-3 天）
### 阶段四：集成与测试（预计 0.5-1 天）

---

## 阶段一：项目初始化与环境配置

### 任务 1.1：创建 Vite + React 项目

**优先级**: 🔴 最高

**执行步骤**:
```bash
# 1. 创建项目目录
mkdir gomoku-game
cd gomoku-game

# 2. 使用 Vite 创建 React + TypeScript 项目
pnpm create vite . --template react-ts

# 3. 安装依赖
pnpm install
```

**验证标准**:
- [ ] 项目目录创建成功
- [ ] `package.json` 包含 React 18+ 和 TypeScript
- [ ] 运行 `pnpm dev` 能启动开发服务器

**注意事项**:
- 选择 `react-ts` 模板（React + TypeScript）
- 确保 Node.js 版本 >= 18.0.0
- 使用 pnpm 作为包管理器（比 npm 更快）

---

### 任务 1.2：初始化 Tauri 2.0

**优先级**: 🔴 最高

**前置条件**: 完成任务 1.1

**执行步骤**:
```bash
# 1. 安装 Tauri CLI
pnpm add -D @tauri-apps/cli@2

# 2. 初始化 Tauri
pnpm tauri init

# 交互式配置（重要）:
# ✔ App name: gomoku-game
# ✔ Window title: 五子棋
# ✔ Web assets location: ../dist
# ✔ Dev server URL: http://localhost:5173
# ✔ Frontend dev command: pnpm dev
# ✔ Frontend build command: pnpm build
```

**验证标准**:
- [ ] `src-tauri/` 目录已创建
- [ ] `src-tauri/Cargo.toml` 存在
- [ ] `src-tauri/tauri.conf.json` 配置正确
- [ ] 运行 `pnpm tauri dev` 能打开桌面窗口

**注意事项**:
- 确保 Rust 环境已安装（`rustc --version`）
- macOS 需要安装 Xcode Command Line Tools
- Dev server URL 必须与 Vite 端口一致（5173）

---

### 任务 1.3：安装 Tailwind CSS

**优先级**: 🔴 最高

**前置条件**: 完成任务 1.1

**执行步骤**:
```bash
# 1. 安装 Tailwind CSS 及依赖
pnpm add -D tailwindcss postcss autoprefixer

# 2. 初始化 Tailwind 配置
npx tailwindcss init -p
```

**配置文件修改**:

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**验证标准**:
- [ ] `tailwind.config.js` 配置正确
- [ ] `postcss.config.js` 存在
- [ ] `src/index.css` 包含 Tailwind 指令
- [ ] 在组件中使用 `className="text-blue-500"` 能生效

**注意事项**:
- content 路径必须包含所有 React 组件文件
- 确保 `index.css` 被 `main.tsx` 导入

---

### 任务 1.4：配置 shadcn/ui

**优先级**: 🟡 高

**前置条件**: 完成任务 1.3

**执行步骤**:
```bash
# 1. 初始化 shadcn/ui
npx shadcn@latest init

# 交互式配置:
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Slate
# ✔ Would you like to use CSS variables for colors? › yes
```

**自动生成的配置**:
- `components.json` - shadcn/ui 配置
- `src/lib/utils.ts` - 工具函数
- `tsconfig.json` 更新 - 添加路径别名 `@/*`

**安装常用组件**:
```bash
# 安装 Button 组件（用于测试）
npx shadcn@latest add button
```

**验证标准**:
- [ ] `components.json` 文件存在
- [ ] `src/components/ui/button.tsx` 创建成功
- [ ] `tsconfig.json` 包含 `@/*` 路径别名
- [ ] 在 App 中导入并使用 Button 组件能正常渲染

**注意事项**:
- 选择 CSS 变量模式以便动态主题切换
- 路径别名 `@/` 指向 `src/` 目录

---

### 任务 1.5：配置项目结构

**优先级**: 🟡 高

**前置条件**: 完成任务 1.1-1.4

**创建目录结构**:
```bash
src/
├── components/          # React 组件
│   ├── Board/          # 棋盘相关组件
│   ├── Game/           # 游戏控制组件
│   └── ui/             # shadcn/ui 组件（自动生成）
├── hooks/              # 自定义 Hooks
├── stores/             # 状态管理（Zustand）
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── App.tsx
├── main.tsx
└── index.css

src-tauri/
└── src/
    ├── commands/       # Tauri Commands（后端 API）
    ├── game/          # 游戏逻辑
    ├── main.rs
    └── lib.rs
```

**执行步骤**:
```bash
# 前端目录
mkdir -p src/{components/{Board,Game},hooks,stores,types,utils}

# 后端目录
mkdir -p src-tauri/src/{commands,game}
```

**验证标准**:
- [ ] 所有目录创建成功
- [ ] 目录结构清晰，符合架构设计

---

### 任务 1.6：配置 Tauri 窗口和权限

**优先级**: 🟡 高

**前置条件**: 完成任务 1.2

**修改 `src-tauri/tauri.conf.json`**:
```json
{
  "productName": "五子棋",
  "version": "0.1.0",
  "identifier": "com.gomoku.game",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "五子棋",
        "width": 900,
        "height": 700,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": null
    }
  }
}
```

**验证标准**:
- [ ] 窗口标题显示"五子棋"
- [ ] 窗口尺寸符合设计要求（900x700）
- [ ] 窗口居中显示
- [ ] 最小尺寸限制生效（800x600）

**注意事项**:
- CSP 设置为 null 用于开发环境，生产环境需要配置
- 窗口尺寸考虑 15x15 棋盘 + 侧边栏

---

### 任务 1.7：安装状态管理库（Zustand）

**优先级**: 🟡 高

**执行步骤**:
```bash
pnpm add zustand
```

**创建初始 Store**:

`src/stores/gameStore.ts`:
```typescript
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

  resetGame: () => set((state) => {
    state.initBoard();
  }),
}));
```

**验证标准**:
- [ ] Zustand 安装成功
- [ ] `gameStore.ts` 创建并编译通过
- [ ] 在组件中能成功导入和使用 store

---

## 阶段二：Rust 后端实现

### 任务 2.1：定义数据模型

**优先级**: 🔴 最高

**前置条件**: 完成阶段一

**创建 `src-tauri/src/game/mod.rs`**:
```rust
pub mod board;
pub mod rules;
pub mod types;

pub use board::Board;
pub use rules::RulesValidator;
pub use types::*;
```

**创建 `src-tauri/src/game/types.rs`**:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Player {
    Black,
    White,
}

impl Player {
    pub fn opponent(&self) -> Player {
        match self {
            Player::Black => Player::White,
            Player::White => Player::Black,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Cell {
    Empty,
    Black,
    White,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: usize,
    pub y: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Move {
    pub position: Position,
    pub player: Player,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GameStatus {
    InProgress,
    BlackWin,
    WhiteWin,
    Draw,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MoveResult {
    pub success: bool,
    pub game_status: GameStatus,
    pub winning_line: Option<Vec<Position>>,
}
```

**验证标准**:
- [ ] 所有类型编译通过
- [ ] 使用 `#[derive(Serialize, Deserialize)]` 支持 JSON 序列化
- [ ] Player 有 `opponent()` 辅助方法

**注意事项**:
- 所有需要在前后端传递的类型都要实现 `Serialize` 和 `Deserialize`
- Position 使用 `usize` 因为是数组索引

---

### 任务 2.2：实现棋盘逻辑

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.1

**创建 `src-tauri/src/game/board.rs`**:
```rust
use super::types::{Cell, Player, Position};

pub struct Board {
    grid: [[Cell; 15]; 15],
    size: usize,
}

impl Board {
    pub fn new() -> Self {
        Board {
            grid: [[Cell::Empty; 15]; 15],
            size: 15,
        }
    }

    pub fn get(&self, x: usize, y: usize) -> Result<Cell, String> {
        if x >= self.size || y >= self.size {
            return Err("Position out of bounds".to_string());
        }
        Ok(self.grid[x][y])
    }

    pub fn set(&mut self, x: usize, y: usize, player: Player) -> Result<(), String> {
        if x >= self.size || y >= self.size {
            return Err("Position out of bounds".to_string());
        }

        if self.grid[x][y] != Cell::Empty {
            return Err("Position already occupied".to_string());
        }

        self.grid[x][y] = match player {
            Player::Black => Cell::Black,
            Player::White => Cell::White,
        };

        Ok(())
    }

    pub fn is_empty(&self, x: usize, y: usize) -> bool {
        matches!(self.get(x, y), Ok(Cell::Empty))
    }

    pub fn clear(&mut self) {
        self.grid = [[Cell::Empty; 15]; 15];
    }

    pub fn count_pieces(&self) -> usize {
        let mut count = 0;
        for row in &self.grid {
            for cell in row {
                if *cell != Cell::Empty {
                    count += 1;
                }
            }
        }
        count
    }

    pub fn is_full(&self) -> bool {
        self.count_pieces() == self.size * self.size
    }
}

impl Default for Board {
    fn default() -> Self {
        Self::new()
    }
}
```

**验证标准**:
- [ ] 代码编译通过
- [ ] 所有方法都有错误处理
- [ ] 实现了 `Default` trait

**注意事项**:
- 使用 `Result<T, String>` 进行错误处理
- 确保边界检查和占用检查

---

### 任务 2.3：实现规则验证（五子连珠）

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.2

**创建 `src-tauri/src/game/rules.rs`**:
```rust
use super::types::{Cell, Player, Position};
use super::board::Board;

pub struct RulesValidator;

impl RulesValidator {
    /// 检查五子连珠（核心算法）
    pub fn check_five_in_row(
        board: &Board,
        last_pos: &Position,
    ) -> Option<Vec<Position>> {
        let player_cell = board.get(last_pos.x, last_pos.y).ok()?;
        if player_cell == Cell::Empty {
            return None;
        }

        // 四个方向：横、竖、斜右下、斜左下
        let directions = [
            (0, 1),   // 横向 →
            (1, 0),   // 纵向 ↓
            (1, 1),   // 斜向 ↘
            (1, -1),  // 斜向 ↙
        ];

        for (dx, dy) in directions {
            let line = Self::count_direction(board, last_pos, dx, dy, player_cell);
            if line.len() >= 5 {
                return Some(line);
            }
        }

        None
    }

    /// 沿指定方向统计连续同色棋子
    fn count_direction(
        board: &Board,
        pos: &Position,
        dx: isize,
        dy: isize,
        target_cell: Cell,
    ) -> Vec<Position> {
        let mut line = vec![Position { x: pos.x, y: pos.y }];

        // 正向搜索
        let mut x = pos.x as isize + dx;
        let mut y = pos.y as isize + dy;
        while x >= 0 && x < 15 && y >= 0 && y < 15 {
            let ux = x as usize;
            let uy = y as usize;
            if board.get(ux, uy).ok() == Some(target_cell) {
                line.push(Position { x: ux, y: uy });
                x += dx;
                y += dy;
            } else {
                break;
            }
        }

        // 反向搜索
        let mut x = pos.x as isize - dx;
        let mut y = pos.y as isize - dy;
        while x >= 0 && x < 15 && y >= 0 && y < 15 {
            let ux = x as usize;
            let uy = y as usize;
            if board.get(ux, uy).ok() == Some(target_cell) {
                line.insert(0, Position { x: ux, y: uy });
                x -= dx;
                y -= dy;
            } else {
                break;
            }
        }

        line
    }

    /// 检查是否和棋
    pub fn is_draw(board: &Board) -> bool {
        board.is_full()
    }
}
```

**验证标准**:
- [ ] 代码编译通过
- [ ] 四个方向的检测逻辑正确
- [ ] 返回完整的获胜连线位置

**注意事项**:
- 使用 `isize` 处理负数坐标（反向搜索）
- 边界检查：`0 <= x < 15 && 0 <= y < 15`
- 正向和反向搜索都要实现

---

### 任务 2.4：实现游戏引擎（状态管理）

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.1-2.3

**在 `src-tauri/src/main.rs` 中添加状态管理**:
```rust
use std::sync::Mutex;
use tauri::State;

mod commands;
mod game;

use game::{Board, Player, Position, GameStatus};

pub struct GameState {
    board: Mutex<Board>,
    current_player: Mutex<Player>,
    game_status: Mutex<GameStatus>,
    move_history: Mutex<Vec<Position>>,
}

impl GameState {
    fn new() -> Self {
        GameState {
            board: Mutex::new(Board::new()),
            current_player: Mutex::new(Player::Black),
            game_status: Mutex::new(GameStatus::InProgress),
            move_history: Mutex::new(Vec::new()),
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(GameState::new())
        .invoke_handler(tauri::generate_handler![
            commands::place_stone,
            commands::new_game,
            commands::undo_move,
            commands::get_board_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**验证标准**:
- [ ] GameState 使用 Mutex 保证线程安全
- [ ] 所有命令注册到 invoke_handler
- [ ] 代码编译通过

**注意事项**:
- Tauri 命令是多线程的，必须使用 `Mutex` 包装共享状态
- `move_history` 用于实现悔棋功能

---

### 任务 2.5：实现 Tauri Commands

**优先级**: 🔴 最高

**前置条件**: 完成任务 2.4

**创建 `src-tauri/src/commands/mod.rs`**:
```rust
use tauri::State;
use crate::{GameState, game::{Position, MoveResult, GameStatus, RulesValidator, Player}};

#[tauri::command]
pub async fn place_stone(
    state: State<'_, GameState>,
    x: usize,
    y: usize,
) -> Result<MoveResult, String> {
    // 1. 获取当前玩家
    let current_player = {
        let player = state.current_player.lock().unwrap();
        *player
    };

    // 2. 尝试落子
    {
        let mut board = state.board.lock().unwrap();
        board.set(x, y, current_player)?;
    }

    // 3. 检查游戏状态
    let position = Position { x, y };
    let winning_line = {
        let board = state.board.lock().unwrap();
        RulesValidator::check_five_in_row(&board, &position)
    };

    let game_status = if winning_line.is_some() {
        match current_player {
            Player::Black => GameStatus::BlackWin,
            Player::White => GameStatus::WhiteWin,
        }
    } else {
        let board = state.board.lock().unwrap();
        if RulesValidator::is_draw(&board) {
            GameStatus::Draw
        } else {
            GameStatus::InProgress
        }
    };

    // 4. 更新状态
    {
        let mut status = state.game_status.lock().unwrap();
        *status = game_status.clone();
    }

    {
        let mut history = state.move_history.lock().unwrap();
        history.push(position);
    }

    {
        let mut player = state.current_player.lock().unwrap();
        *player = current_player.opponent();
    }

    Ok(MoveResult {
        success: true,
        game_status,
        winning_line,
    })
}

#[tauri::command]
pub async fn new_game(state: State<'_, GameState>) -> Result<(), String> {
    let mut board = state.board.lock().unwrap();
    board.clear();

    let mut player = state.current_player.lock().unwrap();
    *player = Player::Black;

    let mut status = state.game_status.lock().unwrap();
    *status = GameStatus::InProgress;

    let mut history = state.move_history.lock().unwrap();
    history.clear();

    Ok(())
}

#[tauri::command]
pub async fn undo_move(state: State<'_, GameState>) -> Result<(), String> {
    let last_pos = {
        let mut history = state.move_history.lock().unwrap();
        history.pop().ok_or("No moves to undo")?
    };

    let mut board = state.board.lock().unwrap();
    board.set(last_pos.x, last_pos.y, Player::Black)?; // 临时清空
    // TODO: 改进为直接设置为 Empty

    let mut player = state.current_player.lock().unwrap();
    *player = player.opponent();

    let mut status = state.game_status.lock().unwrap();
    *status = GameStatus::InProgress;

    Ok(())
}

#[tauri::command]
pub async fn get_board_state(
    state: State<'_, GameState>,
) -> Result<Vec<Vec<String>>, String> {
    let board = state.board.lock().unwrap();
    let mut result = Vec::new();

    for x in 0..15 {
        let mut row = Vec::new();
        for y in 0..15 {
            let cell = board.get(x, y).unwrap();
            row.push(match cell {
                crate::game::Cell::Empty => "empty".to_string(),
                crate::game::Cell::Black => "black".to_string(),
                crate::game::Cell::White => "white".to_string(),
            });
        }
        result.push(row);
    }

    Ok(result)
}
```

**验证标准**:
- [ ] 所有命令编译通过
- [ ] 错误处理完善（使用 `Result<T, String>`）
- [ ] Mutex 使用正确（避免死锁）

**注意事项**:
- 每次 lock 后尽快 unlock（使用代码块作用域）
- async 函数需要 `#[tauri::command]` 属性
- 返回的数据结构需要实现 `Serialize`

---

### 任务 2.6：修改 `src-tauri/src/lib.rs`

**优先级**: 🟡 高

**前置条件**: 完成任务 2.5

**创建 `src-tauri/src/lib.rs`**:
```rust
pub mod commands;
pub mod game;

pub use game::{Board, Player, GameStatus, Position, Cell};
```

**在 `src-tauri/Cargo.toml` 中添加依赖**:
```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**验证标准**:
- [ ] 代码编译通过
- [ ] 没有未使用的警告

---

## 阶段三：React 前端 UI 实现

### 任务 3.1：定义 TypeScript 类型

**优先级**: 🔴 最高

**前置条件**: 完成阶段二

**创建 `src/types/game.ts`**:
```typescript
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
```

**验证标准**:
- [ ] 类型定义与 Rust 后端一致
- [ ] 所有类型导出正确

---

### 任务 3.2：实现 Tauri API 封装

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.1

**创建 `src/utils/tauri.ts`**:
```typescript
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
```

**安装依赖**:
```bash
pnpm add @tauri-apps/api
```

**验证标准**:
- [ ] 所有 API 方法有正确的类型签名
- [ ] 错误处理使用 Promise rejection

**注意事项**:
- `invoke` 的第一个参数必须与 Rust command 名称完全一致
- 使用泛型 `invoke<T>` 指定返回类型

---

### 任务 3.3：更新 Zustand Store（集成 Tauri）

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.2

**更新 `src/stores/gameStore.ts`**:
```typescript
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
```

**验证标准**:
- [ ] 所有异步操作有错误处理
- [ ] isProcessing 防止重复点击
- [ ] 乐观更新 + 错误回滚

**注意事项**:
- 使用 `try-catch-finally` 处理异步错误
- `isProcessing` 标志防止用户快速点击

---

### 任务 3.4：实现棋盘组件（Board）

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.3

**创建 `src/components/Board/Board.tsx`**:
```typescript
import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import Cell from './Cell';

const Board: React.FC = () => {
  const { board, placeStone, winningLine, gameStatus } = useGameStore();

  const isWinningCell = (x: number, y: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some(pos => pos.x === x && pos.y === y);
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="inline-block bg-amber-700 p-4 rounded-lg shadow-2xl">
        <div
          className="grid gap-0 bg-amber-600"
          style={{
            gridTemplateColumns: `repeat(15, 32px)`,
            gridTemplateRows: `repeat(15, 32px)`,
          }}
        >
          {board.map((row, x) =>
            row.map((cell, y) => (
              <Cell
                key={`${x}-${y}`}
                x={x}
                y={y}
                value={cell}
                isWinning={isWinningCell(x, y)}
                onClick={() => placeStone(x, y)}
                disabled={gameStatus !== 'playing'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;
```

**验证标准**:
- [ ] 15x15 网格渲染正确
- [ ] 点击事件绑定正确
- [ ] 获胜连线高亮

**注意事项**:
- 使用 CSS Grid 布局
- 单元格尺寸 32px（可调整）
- 背景色模拟木质棋盘

---

### 任务 3.5：实现单元格组件（Cell）

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.4

**创建 `src/components/Board/Cell.tsx`**:
```typescript
import React from 'react';
import { Cell as CellType } from '@/types/game';
import { cn } from '@/lib/utils';

interface CellProps {
  x: number;
  y: number;
  value: CellType;
  isWinning: boolean;
  onClick: () => void;
  disabled: boolean;
}

const Cell: React.FC<CellProps> = ({ x, y, value, isWinning, onClick, disabled }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // 绘制星位（天元和四个角点）
  const isStarPoint = () => {
    const starPoints = [
      [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
    ];
    return starPoints.some(([sx, sy]) => sx === x && sy === y);
  };

  return (
    <div
      className={cn(
        "relative w-8 h-8 border-r border-b border-gray-800 cursor-pointer",
        "hover:bg-amber-500/20 transition-colors",
        disabled && "cursor-not-allowed",
        isWinning && "bg-red-500/30"
      )}
      onClick={!disabled && !value ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 星位标记 */}
      {isStarPoint() && !value && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gray-800 rounded-full" />
        </div>
      )}

      {/* 棋子 */}
      {value && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "w-7 h-7 rounded-full shadow-lg",
              value === 'black' ? "bg-gray-900" : "bg-gray-50",
              isWinning && "ring-4 ring-red-500"
            )}
          />
        </div>
      )}

      {/* 悬停预览 */}
      {!value && isHovered && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-gray-400/40" />
        </div>
      )}
    </div>
  );
};

export default Cell;
```

**验证标准**:
- [ ] 棋子渲染正确（黑/白）
- [ ] 悬停预览显示
- [ ] 星位标记显示
- [ ] 获胜棋子有红色边框

**注意事项**:
- 使用 Tailwind CSS 类名
- `cn()` 工具函数用于条件类名
- 空白格子才能点击

---

### 任务 3.6：实现游戏控制面板（GameControls）

**优先级**: 🟡 高

**前置条件**: 完成任务 3.3

**创建 `src/components/Game/GameControls.tsx`**:
```typescript
import React from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { RotateCcw, Play, Undo2 } from 'lucide-react';

const GameControls: React.FC = () => {
  const { gameStatus, moveHistory, newGame, undoMove, isProcessing } = useGameStore();

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800">游戏控制</h2>

      <div className="flex flex-col gap-2">
        <Button
          onClick={newGame}
          disabled={isProcessing}
          className="w-full"
          variant="default"
        >
          <Play className="w-4 h-4 mr-2" />
          {gameStatus === 'idle' ? '开始游戏' : '新游戏'}
        </Button>

        <Button
          onClick={undoMove}
          disabled={isProcessing || moveHistory.length === 0 || gameStatus !== 'playing'}
          className="w-full"
          variant="outline"
        >
          <Undo2 className="w-4 h-4 mr-2" />
          悔棋
        </Button>

        <Button
          onClick={() => window.location.reload()}
          className="w-full"
          variant="ghost"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置应用
        </Button>
      </div>
    </div>
  );
};

export default GameControls;
```

**安装图标库**:
```bash
pnpm add lucide-react
```

**验证标准**:
- [ ] 按钮禁用逻辑正确
- [ ] 图标显示正确
- [ ] 按钮样式美观

---

### 任务 3.7：实现游戏状态显示（GameStatus）

**优先级**: 🟡 高

**前置条件**: 完成任务 3.3

**创建 `src/components/Game/GameStatus.tsx`**:
```typescript
import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/lib/utils';

const GameStatus: React.FC = () => {
  const { currentPlayer, gameStatus, moveHistory } = useGameStore();

  const getStatusText = () => {
    switch (gameStatus) {
      case 'idle':
        return '点击"开始游戏"开始对弈';
      case 'playing':
        return `当前玩家: ${currentPlayer === 'black' ? '黑方' : '白方'}`;
      case 'black_win':
        return '🎉 黑方获胜！';
      case 'white_win':
        return '🎉 白方获胜！';
      case 'draw':
        return '平局！棋盘已满';
      default:
        return '';
    }
  };

  const getPlayerIndicator = () => {
    if (gameStatus !== 'playing') return null;

    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-6 h-6 rounded-full shadow-md",
            currentPlayer === 'black' ? 'bg-gray-900' : 'bg-gray-50'
          )}
        />
        <span className="text-sm text-gray-600">
          {currentPlayer === 'black' ? '黑方' : '白方'}回合
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800">游戏状态</h2>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </div>

        {getPlayerIndicator()}

        <div className="text-xs text-gray-500 pt-2 border-t">
          已走步数: {moveHistory.length}
        </div>
      </div>
    </div>
  );
};

export default GameStatus;
```

**验证标准**:
- [ ] 状态文本显示正确
- [ ] 当前玩家指示器显示
- [ ] 步数统计正确

---

### 任务 3.8：实现历史记录组件（MoveHistory）

**优先级**: 🟢 中

**前置条件**: 完成任务 3.3

**创建 `src/components/Game/MoveHistory.tsx`**:
```typescript
import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { ScrollArea } from '@/components/ui/scroll-area';

const MoveHistory: React.FC = () => {
  const { moveHistory } = useGameStore();

  return (
    <div className="flex flex-col gap-2 p-4 bg-white rounded-lg shadow-md h-64">
      <h2 className="text-lg font-semibold text-gray-800">落子记录</h2>

      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {moveHistory.length === 0 ? (
            <p className="text-sm text-gray-400">暂无记录</p>
          ) : (
            moveHistory.map((move, index) => {
              const player = index % 2 === 0 ? '⚫' : '⚪';
              const position = `(${move.x + 1}, ${move.y + 1})`;
              return (
                <div
                  key={index}
                  className="text-sm text-gray-700 flex items-center gap-2"
                >
                  <span className="text-gray-500 w-8">{index + 1}.</span>
                  <span>{player}</span>
                  <span className="font-mono">{position}</span>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MoveHistory;
```

**安装 shadcn/ui ScrollArea**:
```bash
npx shadcn@latest add scroll-area
```

**验证标准**:
- [ ] 历史记录滚动正常
- [ ] 显示步数、玩家、位置
- [ ] 空状态提示正确

---

### 任务 3.9：组合主界面（App.tsx）

**优先级**: 🔴 最高

**前置条件**: 完成任务 3.4-3.8

**更新 `src/App.tsx`**:
```typescript
import React from 'react';
import Board from '@/components/Board/Board';
import GameControls from '@/components/Game/GameControls';
import GameStatus from '@/components/Game/GameStatus';
import MoveHistory from '@/components/Game/MoveHistory';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="container mx-auto py-8">
        {/* 标题 */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">五子棋</h1>
          <p className="text-gray-600 mt-2">双人对弈 · 五子连珠</p>
        </header>

        {/* 主内容区 */}
        <div className="flex gap-8 items-start justify-center">
          {/* 左侧：棋盘 */}
          <div className="flex-shrink-0">
            <Board />
          </div>

          {/* 右侧：信息面板 */}
          <div className="flex flex-col gap-4 w-64">
            <GameStatus />
            <GameControls />
            <MoveHistory />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
```

**验证标准**:
- [ ] 布局合理（棋盘在左，面板在右）
- [ ] 响应式设计良好
- [ ] 所有组件正常显示

**注意事项**:
- 使用 Flexbox 布局
- 渐变背景提升视觉效果
- 容器居中显示

---

## 阶段四：集成与测试

### 任务 4.1：端到端测试

**优先级**: 🔴 最高

**测试清单**:

- [ ] **项目启动**
  ```bash
  pnpm tauri dev
  ```
  - 窗口正常打开
  - 标题显示"五子棋"
  - UI 完整渲染

- [ ] **新游戏流程**
  - 点击"开始游戏"按钮
  - 棋盘初始化（所有格子为空）
  - 状态显示"当前玩家: 黑方"

- [ ] **落子功能**
  - 点击空白格子能成功落子
  - 黑白交替显示正确
  - 已占用格子无法再次落子
  - 步数统计正确增加

- [ ] **五子连珠判定**
  - 横向五子连珠能正确判定
  - 纵向五子连珠能正确判定
  - 斜向（↘）五子连珠能正确判定
  - 斜向（↙）五子连珠能正确判定
  - 获胜连线高亮显示

- [ ] **悔棋功能**
  - 点击"悔棋"按钮
  - 最后一步棋子移除
  - 玩家切换回上一方
  - 步数减少

- [ ] **边界情况**
  - 棋盘已满判定为平局
  - 游戏结束后无法继续落子
  - 快速点击不会导致重复落子（isProcessing 生效）

---

### 任务 4.2：修复已知问题

**优先级**: 🔴 最高

**已知问题列表**:

1. **悔棋清空格子问题**
   - 当前 `undo_move` 中使用 `board.set()` 会设置为对手棋子
   - 需要在 `Board` 中添加 `clear_cell()` 方法

   **修复方案**:
   ```rust
   // src-tauri/src/game/board.rs
   impl Board {
       pub fn clear_cell(&mut self, x: usize, y: usize) -> Result<(), String> {
           if x >= self.size || y >= self.size {
               return Err("Position out of bounds".to_string());
           }
           self.grid[x][y] = Cell::Empty;
           Ok(())
       }
   }
   ```

   ```rust
   // src-tauri/src/commands/mod.rs
   #[tauri::command]
   pub async fn undo_move(state: State<'_, GameState>) -> Result<(), String> {
       let last_pos = {
           let mut history = state.move_history.lock().unwrap();
           history.pop().ok_or("No moves to undo")?
       };

       let mut board = state.board.lock().unwrap();
       board.clear_cell(last_pos.x, last_pos.y)?; // 修复

       // ... 其他逻辑
   }
   ```

2. **错误提示用户体验差**
   - 当前使用 `alert()` 弹窗
   - 改用 shadcn/ui Toast 组件

   **改进方案**:
   ```bash
   npx shadcn@latest add toast
   ```

3. **状态同步问题**
   - 如果前端状态与后端不一致，需要手动同步
   - 在组件挂载时调用 `syncBoardState()`

   **修复方案**:
   ```typescript
   // src/App.tsx
   import { useEffect } from 'react';
   import { useGameStore } from '@/stores/gameStore';

   function App() {
     const syncBoardState = useGameStore(state => state.syncBoardState);

     useEffect(() => {
       syncBoardState();
     }, []);

     // ...
   }
   ```

---

### 任务 4.3：构建生产版本

**优先级**: 🟡 高

**执行步骤**:
```bash
# 构建应用
pnpm tauri build

# 输出位置（macOS）:
# src-tauri/target/release/bundle/dmg/五子棋_0.1.0_universal.dmg
# src-tauri/target/release/bundle/macos/五子棋.app
```

**验证标准**:
- [ ] 构建成功完成
- [ ] .dmg 文件可以安装
- [ ] .app 可以正常运行
- [ ] 应用图标显示正确（如果已配置）

**注意事项**:
- 首次构建时间较长（Rust 编译）
- 需要配置代码签名（生产环境）
- 检查打包体积（预期 5-10 MB）

---

## 开发注意事项总结

### 🔴 关键注意事项

1. **Tauri Command 命名**
   - Rust: `snake_case` (例如: `place_stone`)
   - TypeScript: `camelCase` 调用时自动转换
   - 命令名必须完全匹配

2. **Mutex 死锁防范**
   - 每次 `lock()` 后尽快释放
   - 使用代码块限制作用域
   - 避免嵌套锁定

3. **前后端类型一致**
   - Position: `{ x: number, y: number }`
   - Player: `"black" | "white"` (前端) vs `Player::Black | Player::White` (后端)
   - GameStatus 枚举值必须一致

4. **错误处理**
   - Rust: 使用 `Result<T, String>`
   - TypeScript: 使用 `try-catch` 捕获 Promise rejection
   - 用户友好的错误提示

5. **Vite 路径别名**
   - 确保 `tsconfig.json` 和 `vite.config.ts` 都配置了 `@/*`
   - 路径: `"@/*": ["./src/*"]`

### 🟡 常见问题

1. **端口冲突**
   - Vite 默认端口 5173，如被占用需修改
   - 修改 `vite.config.ts` 和 `tauri.conf.json`

2. **热重载不生效**
   - Rust 代码修改需要重启 `pnpm tauri dev`
   - 前端代码支持 HMR

3. **棋盘坐标系**
   - 数组索引从 0 开始
   - 显示时可能需要 `+1` (用户友好)

4. **性能优化**
   - 使用 `React.memo` 避免不必要的重渲染
   - Cell 组件应该被 memo 化

### 🟢 最佳实践

1. **代码组织**
   - 前端: 按功能模块划分组件
   - 后端: 按领域模型划分模块

2. **状态管理**
   - 单一数据源（Rust 后端）
   - 前端只做展示和事件触发

3. **样式规范**
   - 优先使用 Tailwind 实用类
   - 避免内联样式
   - 使用 `cn()` 处理条件类名

4. **Git 提交**
   - 小步提交，每完成一个任务就提交
   - 提交信息清晰（中文或英文）

---

## 时间估算

| 阶段 | 预计时间 | 备注 |
|------|---------|------|
| 阶段一：项目初始化 | 2-3 小时 | 首次配置较慢，熟悉后可缩短 |
| 阶段二：后端实现 | 1-2 天 | Rust 语法学习曲线 |
| 阶段三：前端实现 | 2-3 天 | 包含组件开发和调试 |
| 阶段四：测试优化 | 0.5-1 天 | Bug 修复和优化 |
| **总计** | **4-7 天** | 根据经验调整 |

---

## 下一步扩展（超出 MVP 范围）

完成 MVP 后，可以考虑以下增强功能：

1. **AI 对手** - 实现 Minimax 算法
2. **游戏保存/加载** - 使用 SQLite 持久化
3. **棋谱导出** - 导出为 SGF 格式
4. **音效** - 落子、获胜音效
5. **主题切换** - 暗色/亮色模式
6. **动画效果** - 落子动画、获胜动画
7. **统计数据** - 胜率、对局历史

---

## 参考资源

### 官方文档
- [Tauri v2 文档](https://v2.tauri.app/)
- [React 官方文档](https://react.dev/)
- [Vite 文档](https://vite.dev/)
- [Tailwind CSS v3](https://v3.tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)

### 技术要点
- Tauri Commands: https://v2.tauri.app/develop/calling-rust
- React Hooks: https://react.dev/reference/react
- Vite + React: https://vitejs.dev/guide/
- Tailwind + Vite: https://v3.tailwindcss.com/docs/guides/vite

---

## 开发检查清单

在开始开发前，确保以下环境已就绪：

- [ ] Node.js >= 18.0.0
- [ ] Rust >= 1.70
- [ ] pnpm >= 8.0
- [ ] Xcode Command Line Tools (macOS)
- [ ] 文本编辑器（推荐 VS Code + Rust Analyzer + ESLint）

---

**祝开发顺利！如遇到问题，参考架构文档或查阅官方文档。** 🎉
