use rusqlite::{Connection, Result};
use std::path::PathBuf;
use super::models::{SavedGame, SavedMove};

pub struct Database {
    conn: Connection,
}

impl Database {
    /// 初始化数据库
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.create_tables()?;
        Ok(db)
    }

    /// 创建内存数据库（用于测试和默认实例）
    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database { conn };
        db.create_tables()?;
        Ok(db)
    }

    /// 创建表结构
    fn create_tables(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                mode TEXT NOT NULL,
                difficulty TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                status TEXT NOT NULL,
                winner TEXT,
                total_moves INTEGER DEFAULT 0
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS moves (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                move_number INTEGER NOT NULL,
                player TEXT NOT NULL,
                position_x INTEGER NOT NULL,
                position_y INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)",
            [],
        )?;

        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves(game_id)",
            [],
        )?;

        Ok(())
    }

    /// 保存游戏
    pub fn save_game(&self, game: &SavedGame) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO games (name, mode, difficulty, created_at, updated_at, status, winner, total_moves)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            (
                &game.name,
                &game.mode,
                &game.difficulty,
                game.created_at,
                game.updated_at,
                &game.status,
                &game.winner,
                game.total_moves,
            ),
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    /// 保存落子记录
    pub fn save_move(&self, move_data: &SavedMove) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO moves (game_id, move_number, player, position_x, position_y, timestamp)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            (
                move_data.game_id,
                move_data.move_number,
                &move_data.player,
                move_data.position_x,
                move_data.position_y,
                move_data.timestamp,
            ),
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    /// 获取所有游戏列表
    pub fn list_games(&self) -> Result<Vec<SavedGame>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, mode, difficulty, created_at, updated_at, status, winner, total_moves
                 FROM games ORDER BY updated_at DESC"
        )?;

        let games = stmt.query_map([], |row| {
            Ok(SavedGame {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                mode: row.get(2)?,
                difficulty: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                status: row.get(6)?,
                winner: row.get(7)?,
                total_moves: row.get(8)?,
            })
        })?;

        games.collect()
    }

    /// 获取游戏的所有落子记录
    pub fn get_moves(&self, game_id: i64) -> Result<Vec<SavedMove>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, game_id, move_number, player, position_x, position_y, timestamp
                 FROM moves WHERE game_id = ?1 ORDER BY move_number ASC"
        )?;

        let moves = stmt.query_map([game_id], |row| {
            Ok(SavedMove {
                id: Some(row.get(0)?),
                game_id: row.get(1)?,
                move_number: row.get(2)?,
                player: row.get(3)?,
                position_x: row.get(4)?,
                position_y: row.get(5)?,
                timestamp: row.get(6)?,
            })
        })?;

        moves.collect()
    }

    /// 删除游戏
    pub fn delete_game(&self, game_id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM games WHERE id = ?1", [game_id])?;
        Ok(())
    }
}