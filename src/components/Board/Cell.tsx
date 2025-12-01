import React from 'react';
import type { Cell as CellType } from '@/utils/tauri';
import { cn } from '@/lib/utils';

interface CellProps {
  x: number;
  y: number;
  value: CellType;
  isWinning: boolean;
  onClick: () => void;
  disabled: boolean;
}

const Cell: React.FC<CellProps> = ({ x, y, value, isWinning, onClick, disabled }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // 绘制星位（天元和四个角点）
  const isStarPoint = () => {
    const starPoints = [
      [3, 3], [3, 11], [7, 7], [11, 3], [11, 11]
    ];
    return starPoints.some(([sx, sy]) => sx === x && sy === y);
  };

  return (
    <div
      className={cn(
        "relative w-8 h-8 border-r border-b border-gray-800 cursor-pointer",
        "hover:bg-amber-500/20 transition-colors",
        disabled && "cursor-not-allowed",
        isWinning && "bg-red-500/30"
      )}
      onClick={!disabled && !value ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 星位标记 */}
      {isStarPoint() && !value && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-gray-800 rounded-full" />
        </div>
      )}

      {/* 棋子 */}
      {value && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              "w-7 h-7 rounded-full shadow-lg",
              value === 'black' ? "bg-gray-900" : "bg-gray-50 border border-gray-300",
              isWinning && "ring-4 ring-red-500"
            )}
          />
        </div>
      )}

      {/* 悬停预览 */}
      {!value && isHovered && !disabled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-gray-400/40" />
        </div>
      )}
    </div>
  );
};

export default Cell;