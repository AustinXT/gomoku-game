use tauri::State;
use serde::{Deserialize, Serialize};

use crate::GameState;
use crate::game::{Position, MoveResult, GameStatus, RulesValidator, Player, Cell};
use crate::ai::{AIEngine, Difficulty};
use crate::game::GameMode;

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
    board.clear_cell(last_pos.x, last_pos.y)?;

    let mut player = state.current_player.lock().unwrap();
    *player = player.opponent();

    let mut status = state.game_status.lock().unwrap();
    *status = GameStatus::InProgress;

    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct GameConfig {
    pub mode: String,
    pub difficulty: String,
}

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
        let mut mode = state.game_mode.lock().unwrap();
        *mode = game_mode;
    }

    {
        let mut difficulty = state.ai_difficulty.lock().unwrap();
        *difficulty = ai_difficulty;
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
    let current_player = state.current_player.lock().unwrap();
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

    let config = GameConfig {
        mode: match mode {
            GameMode::PvP => "pvp".to_string(),
            GameMode::PvE => "pve".to_string(),
        },
        difficulty: match difficulty {
            Difficulty::Easy => "easy".to_string(),
            Difficulty::Medium => "medium".to_string(),
            Difficulty::Hard => "hard".to_string(),
        },
    };

    Ok(config)
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
                Cell::Empty => "empty".to_string(),
                Cell::Black => "black".to_string(),
                Cell::White => "white".to_string(),
            });
        }
        result.push(row);
    }

    Ok(result)
}