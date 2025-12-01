use serde::{Deserialize, Serialize};

/// 棋型定义
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Pattern {
    Five,        // 连五 (赢)
    LiveFour,    // 活四 (必胜)
    DeadFour,    // 冲四
    LiveThree,   // 活三
    DeadThree,   // 眠三
    LiveTwo,     // 活二
    DeadTwo,     // 眠二
}

impl Pattern {
    /// 获取棋型分数
    pub fn score(&self) -> i32 {
        match self {
            Pattern::Five => 100000,
            Pattern::LiveFour => 10000,
            Pattern::DeadFour => 1000,
            Pattern::LiveThree => 500,
            Pattern::DeadThree => 100,
            Pattern::LiveTwo => 50,
            Pattern::DeadTwo => 10,
        }
    }
}

/// AI 难度等级
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub enum Difficulty {
    Easy,    // 深度 2
    Medium,  // 深度 4
    Hard,    // 深度 6
}

impl Difficulty {
    pub fn search_depth(&self) -> u8 {
        match self {
            Difficulty::Easy => 2,
            Difficulty::Medium => 4,
            Difficulty::Hard => 6,
        }
    }

    pub fn max_candidates(&self) -> usize {
        match self {
            Difficulty::Easy => 10,
            Difficulty::Medium => 15,
            Difficulty::Hard => 20,
        }
    }
}