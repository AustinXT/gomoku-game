use crate::game::{Board, Player, Position};
use super::evaluator::PatternEvaluator;

pub struct MinimaxSolver;

impl MinimaxSolver {
    /// Minimax 算法 with Alpha-Beta 剪枝
    pub fn minimax(
        board: &Board,
        depth: u8,
        mut alpha: i32,
        mut beta: i32,
        maximizing: bool,
        player: Player,
    ) -> (i32, Option<Position>) {
        // 终止条件：达到最大深度或游戏结束
        if depth == 0 || Self::is_game_over(board) {
            let score = PatternEvaluator::evaluate_board(board, player);
            return (score, None);
        }

        let candidates = Self::generate_candidate_moves(board, 20);
        if candidates.is_empty() {
            return (0, None);
        }

        let mut best_move = None;

        if maximizing {
            let mut max_eval = i32::MIN;

            for pos in candidates {
                // 模拟落子
                let mut new_board = board.clone();
                if new_board.set(pos.x, pos.y, player).is_err() {
                    continue;
                }

                let (eval, _) = Self::minimax(
                    &new_board,
                    depth - 1,
                    alpha,
                    beta,
                    false,
                    player,
                );

                if eval > max_eval {
                    max_eval = eval;
                    best_move = Some(pos);
                }

                alpha = alpha.max(eval);
                if beta <= alpha {
                    break; // Beta 剪枝
                }
            }

            (max_eval, best_move)
        } else {
            let mut min_eval = i32::MAX;

            for pos in candidates {
                // 模拟对手落子
                let mut new_board = board.clone();
                let opponent = player.opponent();
                if new_board.set(pos.x, pos.y, opponent).is_err() {
                    continue;
                }

                let (eval, _) = Self::minimax(
                    &new_board,
                    depth - 1,
                    alpha,
                    beta,
                    true,
                    player,
                );

                if eval < min_eval {
                    min_eval = eval;
                    best_move = Some(pos);
                }

                beta = beta.min(eval);
                if beta <= alpha {
                    break; // Alpha 剪枝
                }
            }

            (min_eval, best_move)
        }
    }

    /// 生成候选落子位置（启发式搜索）
    fn generate_candidate_moves(board: &Board, max_count: usize) -> Vec<Position> {
        let mut candidates = Vec::new();

        for x in 0..15 {
            for y in 0..15 {
                if board.is_empty(x, y) && Self::has_neighbor_within(board, x, y, 2) {
                    // 只考虑已有棋子周围 2 格内的位置
                    let score = Self::evaluate_position(board, x, y);
                    candidates.push((Position { x, y }, score));
                }
            }
        }

        // 按评估分数排序（降序）
        candidates.sort_by(|a, b| b.1.cmp(&a.1));

        // 返回前 N 个候选位置
        candidates
            .into_iter()
            .take(max_count)
            .map(|(pos, _)| pos)
            .collect()
    }

    /// 检查周围是否有邻居棋子
    fn has_neighbor_within(board: &Board, x: usize, y: usize, distance: usize) -> bool {
        let start_x = x.saturating_sub(distance);
        let end_x = (x + distance).min(14);
        let start_y = y.saturating_sub(distance);
        let end_y = (y + distance).min(14);

        for nx in start_x..=end_x {
            for ny in start_y..=end_y {
                if nx == x && ny == y {
                    continue;
                }
                if !board.is_empty(nx, ny) {
                    return true;
                }
            }
        }

        false
    }

    /// 快速评估某个位置的重要性
    fn evaluate_position(board: &Board, x: usize, y: usize) -> i32 {
        // 简化版评估：检查四个方向的连续棋子
        let directions = [(0, 1), (1, 0), (1, 1), (1, -1)];
        let mut score = 0;

        for (dx, dy) in directions {
            score += Self::count_neighbors(board, x, y, dx, dy);
        }

        // 中心位置略微加分
        let center_bonus = 7 - (x as i32 - 7).abs() - (y as i32 - 7).abs();
        score + center_bonus * 2
    }

    /// 统计某个方向的邻居棋子数量
    fn count_neighbors(board: &Board, x: usize, y: usize, dx: isize, dy: isize) -> i32 {
        let mut count = 0;

        // 正向
        let mut nx = x as isize + dx;
        let mut ny = y as isize + dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if !board.is_empty(nx as usize, ny as usize) {
                count += 1;
                nx += dx;
                ny += dy;
            } else {
                break;
            }
        }

        // 反向
        let mut nx = x as isize - dx;
        let mut ny = y as isize - dy;
        while nx >= 0 && nx < 15 && ny >= 0 && ny < 15 {
            if !board.is_empty(nx as usize, ny as usize) {
                count += 1;
                nx -= dx;
                ny -= dy;
            } else {
                break;
            }
        }

        count
    }

    /// 检查游戏是否结束
    fn is_game_over(board: &Board) -> bool {
        // 简化判断：棋盘已满
        board.is_full()
    }
}