import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/stores/gameStore';
import { Play, Undo2, Save, FolderOpen } from 'lucide-react';
import GameSaveDialog from '@/components/Game/GameSaveDialog';
import { GameLoadDialog } from '@/components/Game/GameLoadDialog';

const GameControls: React.FC = () => {
  const { gameStatus, moveHistory, newGame, undoMove, isProcessing, loadGame } = useGameStore();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const handleSaveGame = (gameName: string) => {
    console.log('Game saved:', gameName);
  };

  const handleLoadGame = async (gameId: number) => {
    await loadGame(gameId);
  };

  return (
    <>
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

          <hr className="border-gray-200 my-1" />

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

        </div>
      </div>

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