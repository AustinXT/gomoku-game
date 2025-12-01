use super::types::{Cell, Player};

#[derive(Clone)]
pub struct Board {
    grid: [[Cell; 15]; 15],
    size: usize,
}

impl Board {
    pub fn new() -> Self {
        Board {
            grid: [[Cell::Empty; 15]; 15],
            size: 15,
        }
    }

    pub fn get(&self, x: usize, y: usize) -> Result<Cell, String> {
        if x >= self.size || y >= self.size {
            return Err("Position out of bounds".to_string());
        }
        Ok(self.grid[x][y])
    }

    pub fn set(&mut self, x: usize, y: usize, player: Player) -> Result<(), String> {
        if x >= self.size || y >= self.size {
            return Err("Position out of bounds".to_string());
        }

        if self.grid[x][y] != Cell::Empty {
            return Err("Position already occupied".to_string());
        }

        self.grid[x][y] = match player {
            Player::Black => Cell::Black,
            Player::White => Cell::White,
        };

        Ok(())
    }

    pub fn is_empty(&self, x: usize, y: usize) -> bool {
        matches!(self.get(x, y), Ok(Cell::Empty))
    }

    pub fn clear(&mut self) {
        self.grid = [[Cell::Empty; 15]; 15];
    }

    pub fn clear_cell(&mut self, x: usize, y: usize) -> Result<(), String> {
        if x >= self.size || y >= self.size {
            return Err("Position out of bounds".to_string());
        }
        self.grid[x][y] = Cell::Empty;
        Ok(())
    }

    pub fn count_pieces(&self) -> usize {
        let mut count = 0;
        for row in &self.grid {
            for cell in row {
                if *cell != Cell::Empty {
                    count += 1;
                }
            }
        }
        count
    }

    pub fn is_full(&self) -> bool {
        self.count_pieces() == self.size * self.size
    }
}

impl Default for Board {
    fn default() -> Self {
        Self::new()
    }
}