import React from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { RotateCcw, Play, Undo2 } from 'lucide-react';

const GameControls: React.FC = () => {
  const { gameStatus, moveHistory, newGame, undoMove, isProcessing } = useGameStore();

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800">游戏控制</h2>

      <div className="flex flex-col gap-2">
        <Button
          onClick={newGame}
          disabled={isProcessing}
          className="w-full"
          variant="default"
        >
          <Play className="w-4 h-4 mr-2" />
          {gameStatus === 'idle' ? '开始游戏' : '新游戏'}
        </Button>

        <Button
          onClick={undoMove}
          disabled={isProcessing || moveHistory.length === 0 || gameStatus !== 'playing'}
          className="w-full"
          variant="outline"
        >
          <Undo2 className="w-4 h-4 mr-2" />
          悔棋
        </Button>

        <Button
          onClick={() => window.location.reload()}
          className="w-full"
          variant="ghost"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置应用
        </Button>
      </div>
    </div>
  );
};

export default GameControls;