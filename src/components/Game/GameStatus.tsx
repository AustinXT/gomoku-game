import React from 'react';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/lib/utils';

const GameStatus: React.FC = () => {
  const { currentPlayer, gameStatus, moveHistory } = useGameStore();

  const getStatusText = () => {
    switch (gameStatus) {
      case 'idle':
        return '点击"开始游戏"开始对弈';
      case 'playing':
        return `当前玩家: ${currentPlayer === 'black' ? '黑方' : '白方'}`;
      case 'black_win':
        return '🎉 黑方获胜！';
      case 'white_win':
        return '🎉 白方获胜！';
      case 'draw':
        return '平局！棋盘已满';
      default:
        return '';
    }
  };

  const getPlayerIndicator = () => {
    if (gameStatus !== 'playing') return null;

    return (
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-6 h-6 rounded-full shadow-md",
            currentPlayer === 'black' ? 'bg-gray-900' : 'bg-gray-50 border border-gray-300'
          )}
        />
        <span className="text-sm text-gray-600">
          {currentPlayer === 'black' ? '黑方' : '白方'}回合
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800">游戏状态</h2>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">
          {getStatusText()}
        </div>

        {getPlayerIndicator()}

        <div className="text-xs text-gray-500 pt-2 border-t">
          已走步数: {moveHistory.length}
        </div>
      </div>
    </div>
  );
};

export default GameStatus;