import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { tauriApi, type SavedGame } from '@/utils/tauri';

interface GameLoadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (gameId: number) => Promise<void>;
}

export function GameLoadDialog({ isOpen, onClose, onLoad }: GameLoadDialogProps) {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGame, setIsLoadingGame] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSavedGames();
    }
  }, [isOpen]);

  const loadSavedGames = async () => {
    setIsLoading(true);
    try {
      const games = await tauriApi.listSavedGames();
      setSavedGames(games);
    } catch (error) {
      console.error('Failed to load saved games:', error);
      alert(`加载失败：${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadGame = async (gameId: number) => {
    setIsLoadingGame(gameId);
    try {
      await onLoad(gameId);
      onClose();
    } catch (error) {
      console.error('Failed to load game:', error);
      alert(`加载失败：${error}`);
    } finally {
      setIsLoadingGame(null);
    }
  };

  const handleDeleteGame = async (gameId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('确定要删除这个游戏吗？')) {
      return;
    }

    try {
      await tauriApi.deleteSavedGame(gameId);
      setSavedGames(savedGames.filter(game => game.id !== gameId));
    } catch (error) {
      console.error('Failed to delete game:', error);
      alert(`删除失败：${error}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const getGameModeText = (mode: string) => {
    return mode === 'pvp' ? '双人对战' : '人机对战';
  };

  const getDifficultyText = (difficulty?: string) => {
    if (!difficulty) return '';
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress': return '进行中';
      case 'black_win': return '黑棋获胜';
      case 'white_win': return '白棋获胜';
      case 'draw': return '平局';
      case 'idle': return '未开始';
      default: return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6">
        <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">加载游戏</h2>
        <Button
            className='mb-4'
            onClick={onClose}
            variant="outline"
          >
            关闭
          </Button>
        </div>

        <div className='w-[600px] max-h-[500px] overflow-y-auto'>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : savedGames.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">暂无保存的游戏</div>
          </div>
        ) : (
          <div className="space-y-3">
            {savedGames.map((game) => (
              <div
                key={game.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{game.name}</h3>
                    <div className="text-sm text-gray-500">
                      {getGameModeText(game.mode)}
                      {game.difficulty && ` · ${getDifficultyText(game.difficulty)}`}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => handleDeleteGame(game.id!, e)}
                    disabled={isLoadingGame !== null}
                    variant="outline"
                    size="sm"
                  >
                    删除
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">状态：</span> {getStatusText(game.status)}
                  </div>
                  <div>
                    <span className="font-medium">步数：</span> {game.total_moves}
                  </div>
                  <div>
                    <span className="font-medium">创建：</span> {formatDate(game.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">更新：</span> {formatDate(game.updated_at)}
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button
                    onClick={() => handleLoadGame(game.id!)}
                    disabled={isLoadingGame !== null}
                    className="w-24"
                  >
                    {isLoadingGame === game.id ? '加载中...' : '加载'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        </div>
      </div>
    </div>
  );
}