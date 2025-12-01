import { useEffect, useState } from 'react';
import Board from "@/components/Board/Board";
import GameControls from "@/components/Game/GameControls";
import GameStatus from "@/components/Game/GameStatus";
import Toast from "@/components/ui/Toast";
import { useGameStore } from '@/stores/gameStore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GameMode, Difficulty } from '@/utils/tauri';

function App() {
  const { gameMode, aiDifficulty, newGameWithMode, loadGameConfig } = useGameStore();
  const [selectedMode, setSelectedMode] = useState<GameMode>(gameMode);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(aiDifficulty);
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
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">五子棋</h1>
          <p className="text-gray-600 mt-2">双人对弈 · 人机对战 · 五子连珠</p>
        </header>

        {/* 游戏设置区域 */}
        <div className="flex justify-center mb-8">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">游戏设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 游戏模式选择 */}
              <div className="space-y-3">
                <Label className="text-base font-medium">游戏模式</Label>
                <RadioGroup
                  value={selectedMode}
                  onValueChange={(value: string) => handleModeChange(value as GameMode)}
                  disabled={isApplying}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pvp" id="pvp" />
                    <Label htmlFor="pvp" className="cursor-pointer">
                      <div>
                        <div className="font-medium">双人对战</div>
                        <div className="text-sm text-gray-500">两位玩家轮流落子</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pve" id="pve" />
                    <Label htmlFor="pve" className="cursor-pointer">
                      <div>
                        <div className="font-medium">人机对战</div>
                        <div className="text-sm text-gray-500">与AI对战</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* AI难度选择 */}
              {selectedMode === 'pve' && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">AI难度</Label>
                  <RadioGroup
                    value={selectedDifficulty}
                    onValueChange={(value: string) => handleDifficultyChange(value as Difficulty)}
                    disabled={isApplying}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label htmlFor="easy" className="cursor-pointer">
                        <div>
                          <div className="font-medium">简单</div>
                          <div className="text-sm text-gray-500">适合初学者</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="cursor-pointer">
                        <div>
                          <div className="font-medium">中等</div>
                          <div className="text-sm text-gray-500">适合有经验的玩家</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hard" id="hard" />
                      <Label htmlFor="hard" className="cursor-pointer">
                        <div>
                          <div className="font-medium">困难</div>
                          <div className="text-sm text-gray-500">适合高级玩家</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 主内容区 */}
        <div className="flex gap-8 items-center justify-center">
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
