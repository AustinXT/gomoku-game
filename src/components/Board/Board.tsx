import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import Cell from './Cell';

const Board: React.FC = () => {
  const { board, placeStone, winningLine, gameStatus } = useGameStore();

  const isWinningCell = (x: number, y: number): boolean => {
    if (!winningLine) return false;
    return winningLine.some(pos => pos.x === x && pos.y === y);
  };

  return (
    <div className="flex items-center justify-center p-8">
      <div className="inline-block bg-amber-700 p-4 rounded-lg shadow-2xl">
        <div
          className="grid gap-0 bg-amber-600"
          style={{
            gridTemplateColumns: `repeat(15, 32px)`,
            gridTemplateRows: `repeat(15, 32px)`,
          }}
        >
          {board.map((row, x) =>
            row.map((cell, y) => (
              <Cell
                key={`${x}-${y}`}
                x={x}
                y={y}
                value={cell}
                isWinning={isWinningCell(x, y)}
                onClick={() => placeStone(x, y)}
                disabled={gameStatus !== 'playing'}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;