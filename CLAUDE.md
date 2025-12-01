# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **cross-platform Gomoku (Five in a Row) game** built with a hybrid architecture combining React frontend with Rust backend via Tauri. The game supports both Player vs Player (PvP) and Player vs AI (PvE) modes with intelligent AI opponents.

## Technology Stack

### Frontend
- **React 19.2.0** with TypeScript for UI
- **Vite 7.2.4** for development and build tooling
- **Zustand** for lightweight state management (3.2kB vs Redux's 3.3kB)
- **Tailwind CSS** for utility-first styling
- **Radix UI** components for accessibility
- **Lucide React** for icons

### Backend
- **Rust** for game logic and AI engine
- **Tauri 2** for cross-platform desktop deployment
- **Custom AI** with Minimax algorithm and alpha-beta pruning
- **Pattern evaluation** for intelligent move selection

## Development Commands

### Frontend Development
```bash
# Start development server (web only)
pnpm dev

# Build frontend for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint
```

### Full Application Development
```bash
# Start desktop app with hot reload (recommended)
pnpm tauri:dev

# Build desktop binaries for distribution
pnpm tauri:build

# Start new game with specific mode
# Use gameStore.newGameWithMode('pvp' | 'pve', 'easy' | 'medium' | 'hard')
```

## Architecture

### Hybrid Application Pattern
- **Frontend**: React handles UI, user interactions, and display logic
- **Backend**: Rust manages game state, AI engine, and core game logic
- **IPC Communication**: Tauri commands bridge frontend and backend

### Key Architectural Components

#### 1. Game State Management
- **Frontend**: Zustand store (`src/stores/gameStore.ts`) manages reactive UI state
- **Backend**: `GameState` struct (`src-tauri/src/lib.rs`) maintains authoritative game state
- **Sync**: Tauri commands ensure state consistency between frontend and backend

#### 2. AI System Architecture (`src-tauri/src/ai/`)
- **Engine**: Coordinates AI decision making (`engine.rs`)
- **Minimax**: Core algorithm with alpha-beta pruning (`minimax.rs`)
- **Pattern Evaluator**: Board position evaluation (`evaluator.rs`)
- **Pattern Recognition**: Game-specific pattern detection (`pattern.rs`)

#### 3. Game Logic (`src-tauri/src/game/`)
- **Board**: 15x15 grid representation (`board.rs`)
- **Rules**: Win detection and move validation (`rules.rs`)
- **Types**: Core game data structures (`types.rs`)

#### 4. Tauri Commands (`src-tauri/src/commands/mod.rs`)
- `place_stone(x, y)`: Execute a move and return result
- `new_game()`: Reset game state
- `new_game_with_mode(mode, difficulty)`: Start new game with configuration
- `get_ai_move()`: Get AI's best move
- `undo_move()`: Revert last move
- `get_game_config()`: Get current game configuration

### Data Flow
```
UI Interaction → Zustand Store → Tauri Command → Rust Backend → Game State Update → Frontend State Update → UI Re-render
```

## Key Implementation Details

### Game Rules
- **Board**: 15x15 grid for traditional Gomoku gameplay
- **Win Condition**: 5 consecutive stones in any direction (horizontal, vertical, diagonal)
- **Draw Detection**: Board full with no winner

### AI Difficulty Levels
- **Easy**: Shallow search depth (2-3 moves ahead)
- **Medium**: Moderate search depth (4-5 moves ahead)
- **Hard**: Deep search with advanced pattern recognition (6+ moves ahead)

### State Synchronization
- Frontend maintains optimistic updates for immediate UI feedback
- Backend provides authoritative game state validation
- Conflict resolution handled through Tauri command responses

## File Structure Notes

### Frontend (`src/`)
- `types/game.ts`: TypeScript type definitions
- `stores/gameStore.ts`: Zustand state management
- `utils/tauri.ts`: Tauri API wrapper functions
- `lib/utils.ts`: Utility functions for UI

### Backend (`src-tauri/src/`)
- `lib.rs`: Main entry point and GameState management
- `main.rs`: Application bootstrap
- `commands/`: Tauri command handlers
- `game/`: Core game logic and rules
- `ai/`: AI engine and algorithms

## Development Guidelines

### Code Style
- **Frontend**: TypeScript with strict mode enabled
- **Backend**: idiomatic Rust with proper error handling
- **State Management**: Unidirectional data flow through Zustand
- **IPC**: All game operations go through Tauri commands

### Error Handling
- Frontend displays user-friendly toast notifications
- Backend returns `Result<T, String>` for proper error propagation
- Invalid moves and game state errors are handled gracefully

### Performance Considerations
- AI calculations run on Rust thread pool to avoid blocking UI
- React optimized with proper state updates and minimal re-renders
- Board state is efficiently cloned only when necessary

## Testing and Quality

### Linting
```bash
# Run ESLint for frontend code
pnpm lint

# Rust code formatting and linting handled by cargo fmt/clippy
```

### Debugging
- Use `pnpm tauri:dev` for full-stack debugging
- Frontend: React DevTools and browser dev tools
- Backend: Rust debugger and println! statements
- Tauri logs available in development console

## Configuration

### Tauri Configuration (`src-tauri/tauri.conf.json`)
- **Window**: 900x700px, resizable, minimum 800x600px
- **Development**: Frontend served at localhost:5173
- **Production**: Frontend built to `../dist`
- **Bundle**: Targets all platforms (Windows, macOS, Linux)

### Build Configuration
- **Vite**: React plugin with path aliases (`@/` → `src/`)
- **TypeScript**: Strict mode enabled
- **ESLint**: React hooks, TypeScript, and React refresh rules