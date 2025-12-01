import { useEffect, useState } from 'react';
import Board from "@/components/Board/Board";
import GameControls from "@/components/Game/GameControls";
import GameStatus from "@/components/Game/GameStatus";
import Toast from "@/components/ui/Toast";
import { useGameStore } from '@/stores/gameStore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { GameMode, Difficulty } from '@/utils/tauri';

function App() {
  const { gameMode, aiDifficulty, newGameWithMode, loadGameConfig } = useGameStore();
  const [selectedMode, setSelectedMode] = useState<GameMode>('pvp');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadGameConfig();
  }, [loadGameConfig]);

  useEffect(() => {
    setSelectedMode(gameMode);
    setSelectedDifficulty(aiDifficulty);
  }, [gameMode, aiDifficulty]);

  const handleModeChange = async (newMode: GameMode) => {
    setIsApplying(true);
    try {
      setSelectedMode(newMode);
      const difficulty = newMode === 'pve' ? selectedDifficulty : undefined;
      await newGameWithMode(newMode, difficulty);
    } catch (error) {
      console.error('Failed to change game mode:', error);
      // 恢复原设置
      setSelectedMode(gameMode);
    } finally {
      setIsApplying(false);
    }
  };

  const handleDifficultyChange = async (newDifficulty: Difficulty) => {
    if (selectedMode === 'pve') {
      setIsApplying(true);
      try {
        setSelectedDifficulty(newDifficulty);
        await newGameWithMode('pve', newDifficulty);
      } catch (error) {
        console.error('Failed to change difficulty:', error);
        // 恢复原设置
        setSelectedDifficulty(aiDifficulty);
      } finally {
        setIsApplying(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="container mx-auto py-8">
        {/* 标题 */}
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">五子棋</h1>
        </header>

        {/* 游戏模式选择 */}
        <div className="flex justify-center items-center gap-6">
          <RadioGroup
            value={selectedMode}
            onValueChange={(value: string) => handleModeChange(value as GameMode)}
            disabled={isApplying}
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pvp" id="pvp" />
                <Label htmlFor="pvp" className="cursor-pointer font-medium">双人对战</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pve" id="pve" />
                <Label htmlFor="pve" className="cursor-pointer font-medium">人机对战</Label>
              </div>
            </div>
          </RadioGroup>

          {/* AI 难度选择 */}
          {selectedMode === 'pve' && (
            <div className="flex items-center gap-2">
              <Label className="text-gray-600">难度：</Label>
              <RadioGroup
                value={selectedDifficulty}
                onValueChange={(value: string) => handleDifficultyChange(value as Difficulty)}
                disabled={isApplying}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="easy" id="easy" />
                    <Label htmlFor="easy" className="cursor-pointer">简单</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer">中等</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="hard" id="hard" />
                    <Label htmlFor="hard" className="cursor-pointer">困难</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        {/* 主内容区 */}
        <div className="flex gap-6 items-center justify-center">
          {/* 左侧：棋盘 */}
          <div className="flex-shrink-0">
            <Board />
          </div>

          {/* 右侧：信息面板 */}
          <div className="flex flex-col gap-4 w-64">
            <GameStatus />
            <GameControls />
          </div>
        </div>
      </div>
      <Toast />
    </div>
  );
}

export default App;
