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
    board.clear_cell(last_pos.x, last_pos.y)?;

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