import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { tauriApi } from '@/utils/tauri';

interface GameSaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameName: string) => void;
}

export default function GameSaveDialog({ isOpen, onClose, onSave }: GameSaveDialogProps) {
  const [gameName, setGameName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!gameName.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await tauriApi.saveGame(gameName.trim());
      onSave(gameName.trim());
      setGameName('');
      onClose();
    } catch (error) {
      console.error('Failed to save game:', error);
      alert(`保存失败: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">保存游戏</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              游戏名称
            </label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder="请输入游戏名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            onClick={onClose}
            disabled={isSaving}
            variant="outline"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!gameName.trim() || isSaving}
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </div>
  );
}