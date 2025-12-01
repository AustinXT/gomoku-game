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