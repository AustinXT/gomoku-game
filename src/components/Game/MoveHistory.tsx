import React from 'react';
import { useGameStore } from '@/stores/gameStore';

const MoveHistory: React.FC = () => {
  const { moveHistory } = useGameStore();

  return (
    <div className="flex flex-col gap-2 p-4 bg-white rounded-lg shadow-md h-64">
      <h2 className="text-lg font-semibold text-gray-800">落子记录</h2>

      <div className="flex-1 overflow-y-auto max-h-48 space-y-1">
        {moveHistory.length === 0 ? (
          <p className="text-sm text-gray-400">暂无记录</p>
        ) : (
          moveHistory.map((move, index) => {
            const player = index % 2 === 0 ? '⚫' : '⚪';
            const position = `(${move.x + 1}, ${move.y + 1})`;
            return (
              <div
                key={index}
                className="text-sm text-gray-700 flex items-center gap-2"
              >
                <span className="text-gray-500 w-8">{index + 1}.</span>
                <span>{player}</span>
                <span className="font-mono">{position}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MoveHistory;