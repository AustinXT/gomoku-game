use super::types::{Cell, Player, Position};
use super::board::Board;

pub struct RulesValidator;

impl RulesValidator {
    /// 检查五子连珠（核心算法）
    pub fn check_five_in_row(
        board: &Board,
        last_pos: &Position,
    ) -> Option<Vec<Position>> {
        let player_cell = board.get(last_pos.x, last_pos.y).ok()?;
        if player_cell == Cell::Empty {
            return None;
        }

        // 四个方向：横、竖、斜右下、斜左下
        let directions = [
            (0, 1),   // 横向 →
            (1, 0),   // 纵向 ↓
            (1, 1),   // 斜向 ↘
            (1, -1),  // 斜向 ↙
        ];

        for (dx, dy) in directions {
            let line = Self::count_direction(board, last_pos, dx, dy, player_cell);
            if line.len() >= 5 {
                return Some(line);
            }
        }

        None
    }

    /// 沿指定方向统计连续同色棋子
    fn count_direction(
        board: &Board,
        pos: &Position,
        dx: isize,
        dy: isize,
        target_cell: Cell,
    ) -> Vec<Position> {
        let mut line = vec![Position { x: pos.x, y: pos.y }];

        // 正向搜索
        let mut x = pos.x as isize + dx;
        let mut y = pos.y as isize + dy;
        while x >= 0 && x < 15 && y >= 0 && y < 15 {
            let ux = x as usize;
            let uy = y as usize;
            if board.get(ux, uy).ok() == Some(target_cell) {
                line.push(Position { x: ux, y: uy });
                x += dx;
                y += dy;
            } else {
                break;
            }
        }

        // 反向搜索
        let mut x = pos.x as isize - dx;
        let mut y = pos.y as isize - dy;
        while x >= 0 && x < 15 && y >= 0 && y < 15 {
            let ux = x as usize;
            let uy = y as usize;
            if board.get(ux, uy).ok() == Some(target_cell) {
                line.insert(0, Position { x: ux, y: uy });
                x -= dx;
                y -= dy;
            } else {
                break;
            }
        }

        line
    }

    /// 检查是否和棋
    pub fn is_draw(board: &Board) -> bool {
        board.is_full()
    }
}