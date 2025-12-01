import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useGameStore } from '@/stores/gameStore';
import type { GameMode, Difficulty } from '@/utils/tauri';

interface GameModeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameModeSelector({ isOpen, onClose }: GameModeSelectorProps) {
  const { gameMode, aiDifficulty, newGameWithMode } = useGameStore();
  const [selectedMode, setSelectedMode] = useState<GameMode>(gameMode);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(aiDifficulty);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    setSelectedMode(gameMode);
    setSelectedDifficulty(aiDifficulty);
  }, [gameMode, aiDifficulty]);

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await newGameWithMode(selectedMode, selectedMode === 'pve' ? selectedDifficulty : undefined);
      onClose();
    } catch (error) {
      console.error('Failed to apply game mode:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>游戏设置</CardTitle>
          <CardDescription>
            选择游戏模式和 AI 难度级别
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 游戏模式选择 */}
          <RadioGroup
            value={selectedMode}
            onValueChange={(value: string) => setSelectedMode(value as GameMode)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pvp" id="pvp" />
              <Label htmlFor="pvp" className="cursor-pointer">
                <div>
                  <div className="font-medium">双人对战</div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pve" id="pve" />
              <Label htmlFor="pve" className="cursor-pointer">
                <div>
                  <div className="font-medium">人机对战</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* AI 难度选择 */}
          {selectedMode === 'pve' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">AI 难度</Label>
              <RadioGroup
                value={selectedDifficulty}
                onValueChange={(value: string) => setSelectedDifficulty(value as Difficulty)}
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

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isApplying}
            >
              取消
            </Button>
            <Button
              onClick={handleApply}
              disabled={isApplying}
            >
              {isApplying ? '应用中...' : '应用'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}