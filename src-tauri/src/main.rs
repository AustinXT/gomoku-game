// Prevents additional console window on Windows in release
// DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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
        .plugin(tauri_plugin_shell::init())
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