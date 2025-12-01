use crate::game::{Board, Player, Position};
use super::minimax::MinimaxSolver;
use super::pattern::Difficulty;

pub struct AIEngine {
    difficulty: Difficulty,
}

impl AIEngine {
    pub fn new(difficulty: Difficulty) -> Self {
        AIEngine { difficulty }
    }

    /// 获取 AI 的最佳落子位置
    pub fn get_best_move(&self, board: &Board, player: Player) -> Option<Position> {
        let depth = self.difficulty.search_depth();
        let (_, best_move) = MinimaxSolver::minimax(
            board,
            depth,
            i32::MIN,
            i32::MAX,
            true,
            player,
        );

        best_move
    }

    /// 更改难度
    pub fn set_difficulty(&mut self, difficulty: Difficulty) {
        self.difficulty = difficulty;
    }
}