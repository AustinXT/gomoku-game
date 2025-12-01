use tauri::State;
use serde::{Deserialize, Serialize};
use chrono::Utc;

use crate::GameState;
use crate::game::{Position, MoveResult, GameStatus, RulesValidator, Player, Cell};
use crate::ai::{AIEngine, Difficulty};
use crate::game::GameMode;
use crate::storage::{SavedGame, SavedMove};

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

    println!("Backend place_stone called: x={}, y={}, current_player={:?}", x, y, current_player);

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

    // 获取下一个玩家（切换当前玩家）
    let next_player = {
        let mut player = state.current_player.lock().unwrap();
        *player = current_player.opponent();
        *player
    };

    Ok(MoveResult {
        success: true,
        game_status,
        winning_line,
        next_player,
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
            .get_best_move(&board, *current_player)
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

/// 保存当前游戏
#[tauri::command]
pub async fn save_game(
    state: State<'_, GameState>,
    game_name: String,
) -> Result<i64, String> {
    let game_mode = *state.game_mode.lock().unwrap();
    let difficulty = *state.ai_difficulty.lock().unwrap();
    let game_status = *state.game_status.lock().unwrap();
    let move_history = state.move_history.lock().unwrap().clone();

    let status_str = match game_status {
        GameStatus::InProgress => "in_progress",
        GameStatus::BlackWin => "black_win",
        GameStatus::WhiteWin => "white_win",
        GameStatus::Draw => "draw",
        GameStatus::Idle => "idle",
    }.to_string();

    let winner = match game_status {
        GameStatus::BlackWin => Some("black".to_string()),
        GameStatus::WhiteWin => Some("white".to_string()),
        GameStatus::Draw => Some("draw".to_string()),
        _ => None,
    };

    let saved_game = SavedGame {
        id: None,
        name: game_name,
        mode: match game_mode {
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
        .ok_or("Game not found".to_string())?;

    // 获取落子记录
    let moves = db.get_moves(game_id)
        .map_err(|e| format!("Failed to load moves: {}", e))?;

    // 重置棋盘
    {
        let mut board = state.board.lock().unwrap();
        board.clear();
    }

    // 重新下所有的棋子
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
            "in_progress" | "idle" => GameStatus::InProgress,
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