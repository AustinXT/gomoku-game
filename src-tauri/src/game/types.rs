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