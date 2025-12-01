use crate::game::{Board, Cell, Player};
use super::pattern::Pattern;

pub struct PatternEvaluator;

impl PatternEvaluator {
    /// 评估整个棋盘局面（从某个玩家视角）
    pub fn evaluate_board(board: &Board, player: Player) -> i32 {
        let mut score = 0;

        // 遍历所有位置
        for x in 0..15 {
            for y in 0..15 {
                if let Ok(cell) = board.get(x, y) {
                    if cell == Cell::Empty {
                        continue;
                    }

                    let cell_player = match cell {
                        Cell::Black => Player::Black,
                        Cell::White => Player::White,
                        Cell::Empty => continue,
                    };

                    // 检测该位置的所有棋型
                    let patterns = Self::detect_patterns_at(board, x, y, cell_player);
                    let position_score: i32 = patterns.iter().map(|p| p.score()).sum();

                    // 己方加分，对方减分（防守权重稍高）
                    if cell_player == player {
                        score += position_score;
                    } else {
                        score -= (position_score as f32 * 1.1) as i32;
                    }
                }
            }
        }

        score
    }

    /// 检测指定位置的所有棋型
    fn detect_patterns_at(board: &Board, x: usize, y: usize, player: Player) -> Vec<Pattern> {
        let cell = match player {
            Player::Black => Cell::Black,
            Player::White => Cell::White,
        };

        let mut patterns = Vec::new();

        // 四个方向：横、竖、斜右下、斜左下
        let directions = [
            (0, 1),   // 横向 →
            (1, 0),   // 纵向 ↓
            (1, 1),   // 斜向 ↘
            (1, -1),  // 斜向 ↙
        ];

        for (dx, dy) in directions {
            if let Some(pattern) = Self::analyze_line(board, x, y, dx, dy, cell) {
                patterns.push(pattern);
            }
        }

        patterns
    }

    /// 分析一条线上的棋型
    fn analyze_line(
        board: &Board,
        x: usize,
        y: usize,
        dx: isize,
        dy: isize,
        target_cell: Cell,
    ) -> Option<Pattern> {
        let (count, left_open, right_open) = Self::count_line(board, x, y, dx, dy, target_cell);

        // 根据连续数量和开口情况判定棋型
        match count {
            5.. => Some(Pattern::Five),
            4 => {
                if left_open && right_open {
                    Some(Pattern::LiveFour)
                } else if left_open || right_open {
                    Some(Pattern::DeadFour)
                } else {
                    None
                }
            }
            3 => {
                if left_open && right_open {
                    Some(Pattern::LiveThree)
                } else if left_open || right_open {
                    Some(Pattern::DeadThree)
                } else {
                    None
                }
            }
            2 => {
                if left_open && right_open {
                    Some(Pattern::LiveTwo)
                } else if left_open || right_open {
                    Some(Pattern::DeadTwo)
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    /// 统计一条线上的连续棋子数量和开口情况
    fn count_line(
        board: &Board,
        x: usize,
        y: usize,
        dx: isize,
        dy: isize,
        target_cell: Cell,
    ) -> (usize, bool, bool) {
        let mut count = 1; // 包含当前位置

        // 正向统计
        let mut nx = x as isize + dx;
        let mut ny = y as isize + dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if board.get(nx as usize, ny as usize).ok() == Some(target_cell) {
                count += 1;
                nx += dx;
                ny += dy;
            } else {
                break;
            }
        }
        let right_open = nx >= 0 && nx < 15 && ny >= 0 && ny < 15
            && board.get(nx as usize, ny as usize).ok() == Some(Cell::Empty);

        // 反向统计
        let mut nx = x as isize - dx;
        let mut ny = y as isize - dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if board.get(nx as usize, ny as usize).ok() == Some(target_cell) {
                count += 1;
                nx -= dx;
                ny -= dy;
            } else {
                break;
            }
        }
        let left_open = nx >= 0 && nx < 15 && ny >= 0 && ny < 15
            && board.get(nx as usize, ny as usize).ok() == Some(Cell::Empty);

        (count, left_open, right_open)
    }
}