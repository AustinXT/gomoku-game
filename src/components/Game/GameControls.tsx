import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { Play, Undo2, Settings, Save, FolderOpen } from 'lucide-react';
import { GameModeSelector } from '@/components/GameModeSelector';
import GameSaveDialog from '@/components/Game/GameSaveDialog';
import GameLoadDialog from '@/components/Game/GameLoadDialog';

const GameControls: React.FC = () => {
  const { gameStatus, moveHistory, newGame, undoMove, isProcessing, gameMode, aiDifficulty } = useGameStore();
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const handleSaveGame = (gameName: string) => {
    console.log('Game saved:', gameName);
  };

  const handleLoadGame = (gameId: number) => {
    console.log('Game loaded:', gameId);
  };

  return (
    <>
      <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800">游戏控制</h2>

        {/* 游戏模式显示 */}
        <div className="text-sm text-gray-600">
          <div className="font-medium">当前模式:</div>
          <div className="capitalize">
            {gameMode === 'pvp' ? '双人对战' : '人机对战'}
            {gameMode === 'pve' && ` (${aiDifficulty === 'easy' ? '简单' : aiDifficulty === 'medium' ? '中等' : '困难'})`}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => setShowModeSelector(true)}
            disabled={isProcessing}
            className="w-full"
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            游戏设置
          </Button>

          <Button
            onClick={() => setShowSaveDialog(true)}
            disabled={isProcessing || gameStatus === 'idle'}
            className="w-full"
            variant="outline"
          >
            <Save className="w-4 h-4 mr-2" />
            保存游戏
          </Button>

          <Button
            onClick={() => setShowLoadDialog(true)}
            disabled={isProcessing}
            className="w-full"
            variant="outline"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            加载游戏
          </Button>

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
        </div>
      </div>

      <GameModeSelector
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
      />

      <GameSaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveGame}
      />

      <GameLoadDialog
        isOpen={showLoadDialog}
        onClose={() => setShowLoadDialog(false)}
        onLoad={handleLoadGame}
      />
    </>
  );
};

export default GameControls;