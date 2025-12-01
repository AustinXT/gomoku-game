pub mod ai;
pub mod commands;
pub mod game;

use std::sync::Mutex;
pub use game::{Board, Player, GameStatus, Position, Cell, GameMode};
pub use ai::{AIEngine, Difficulty, PatternEvaluator, MinimaxSolver, Pattern};

// GameState for managing game state across Tauri commands
pub struct GameState {
    pub board: Mutex<Board>,
    pub current_player: Mutex<Player>,
    pub game_status: Mutex<GameStatus>,
    pub move_history: Mutex<Vec<Position>>,

    // 新增字段
    pub game_mode: Mutex<GameMode>,
    pub ai_difficulty: Mutex<Difficulty>,
    pub ai_engine: Mutex<Option<AIEngine>>,
}

impl GameState {
    pub fn new() -> Self {
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

impl Default for GameState {
    fn default() -> Self {
        Self::new()
    }
}

// Run function for Tauri app
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(GameState::new())
        .invoke_handler(tauri::generate_handler![
            commands::place_stone,
            commands::new_game,
            commands::new_game_with_mode,
            commands::get_ai_move,
            commands::get_game_config,
            commands::undo_move,
            commands::get_board_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}