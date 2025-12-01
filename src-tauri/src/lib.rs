pub mod ai;
pub mod commands;
pub mod game;
pub mod storage;

use std::sync::{Arc, Mutex};
use std::path::PathBuf;
pub use game::{Board, Player, GameStatus, Position, Cell, GameMode};
pub use ai::{AIEngine, Difficulty, PatternEvaluator, MinimaxSolver, Pattern};
pub use storage::{Database, SavedGame, SavedMove};

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

    // 新增：数据库连接
    pub database: Arc<Mutex<Database>>,
}

impl GameState {
    pub fn new(database: Database) -> Self {
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

impl Default for GameState {
    fn default() -> Self {
        Self::new()
    }
}

// Run function for Tauri app
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
        .plugin(tauri_plugin_shell::init())
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