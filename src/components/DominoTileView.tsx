import React from 'react';
import { motion } from 'motion/react';
import { DominoTile } from '../types';

interface DominoTileViewProps {
  tile?: DominoTile;
  isFaceDown?: boolean;
  orientation?: 'vertical' | 'horizontal';
  isDouble?: boolean;
  isPlayable?: boolean;
  isUnplayable?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  theme?: 'ivory' | 'ebony';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
  id?: string;
}

// Coordinate mappings for 3x3 pip grid (row 0-2, col 0-2)
const PIP_POSITIONS: Record<number, [number, number][]> = {
  0: [],
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

export const DominoTileView: React.FC<DominoTileViewProps> = ({
  tile = [0, 0],
  isFaceDown = false,
  orientation = 'vertical',
  isDouble = false,
  isPlayable = false,
  isUnplayable = false,
  isSelected = false,
  isHighlighted = false,
  theme = 'ivory',
  size = 'md',
  onClick,
  className = '',
  id,
}) => {
  const isHorizontal = orientation === 'horizontal';

  const sizeClasses = {
    xs: isHorizontal ? 'w-[48px] h-[24px]' : 'w-[24px] h-[48px]',
    sm: isHorizontal ? 'w-[68px] h-[34px]' : 'w-[34px] h-[68px]',
    md: isHorizontal ? 'w-[96px] h-[48px]' : 'w-[48px] h-[96px]',
    lg: isHorizontal ? 'w-[120px] h-[60px]' : 'w-[60px] h-[120px]',
  }[size];

  const pipSizeClasses = {
    xs: 'w-[3px] h-[3px]',
    sm: 'w-[4.5px] h-[4.5px]',
    md: 'w-[7px] h-[7px]',
    lg: 'w-[9px] h-[9px]',
  }[size];

  const isIvory = theme === 'ivory';

  const bgStyle = isIvory
    ? 'bg-gradient-to-b from-[#FAF8F5] via-[#F3EDE3] to-[#E9E0D1] text-[#1E1B18] border-[#CFC3B0]'
    : 'bg-gradient-to-b from-[#2D2E35] via-[#202127] to-[#16171B] text-[#F3F4F6] border-[#40434C]';

  const pipColor = isIvory ? 'bg-[#1C1A17] shadow-inner' : 'bg-[#E5E7EB] shadow-sm';
  const dividerColor = isIvory
    ? 'bg-[#CCC1B1] shadow-[0_1px_0_rgba(255,255,255,0.7)]'
    : 'bg-[#373A42] shadow-[0_1px_0_rgba(0,0,0,0.5)]';

  // Render 3x3 grid half of the tile
  const renderHalf = (pipCount: number, halfIndex: 0 | 1) => {
    const activePips = PIP_POSITIONS[pipCount] || [];

    return (
      <div className="relative flex-1 flex items-center justify-center p-0.5 sm:p-1 overflow-hidden">
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 items-center justify-items-center">
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => {
              const hasPip = activePips.some(([r, c]) => r === row && c === col);
              return (
                <div
                  key={`cell-${halfIndex}-${row}-${col}`}
                  className="w-full h-full flex items-center justify-center"
                >
                  {hasPip && (
                    <span
                      className={`rounded-full transition-transform ${pipSizeClasses} ${pipColor}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Face-down authentic domino back pattern
  if (isFaceDown) {
    return (
      <motion.div
        id={id}
        whileHover={onClick ? { scale: 1.05, y: -3 } : undefined}
        whileTap={onClick ? { scale: 0.96 } : undefined}
        onClick={onClick}
        className={`relative ${sizeClasses} rounded-lg border-2 select-none shadow-md overflow-hidden transition-all duration-200 flex items-center justify-center ${
          isIvory
            ? 'bg-[#E5DCB] border-[#B8AA94] text-[#8C7B68]'
            : 'bg-[#1A1C22] border-[#313540] text-[#4F5568]'
        } ${onClick ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
      >
        <div
          className="absolute inset-1 rounded border border-dashed border-current opacity-35"
        />
        <div className="w-2.5 h-2.5 rounded-full bg-current opacity-30" />
      </motion.div>
    );
  }

  const [pip1, pip2] = tile;

  return (
    <motion.div
      id={id}
      whileHover={
        onClick && (isPlayable || isHighlighted)
          ? { scale: 1.06, y: -4, transition: { duration: 0.15 } }
          : undefined
      }
      whileTap={onClick && (isPlayable || isHighlighted) ? { scale: 0.96 } : undefined}
      onClick={onClick}
      className={`relative ${sizeClasses} rounded-lg border-2 flex select-none transition-all duration-200 shadow-md ${
        isHorizontal ? 'flex-row' : 'flex-col'
      } ${bgStyle} ${
        isSelected
          ? 'ring-3 sm:ring-4 ring-amber-400 border-amber-500 shadow-xl shadow-amber-500/30 scale-105 z-20'
          : isPlayable || isHighlighted
          ? 'ring-2 ring-amber-400/80 border-amber-400/90 shadow-lg cursor-pointer hover:border-amber-400'
          : isUnplayable
          ? 'opacity-40 grayscale-[40%] cursor-not-allowed'
          : ''
      } ${onClick && (isPlayable || isHighlighted) ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Playable Pulse Indicator Dot */}
      {isPlayable && !isSelected && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 z-30 pointer-events-none">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
      )}

      {/* Selected Indicator Badge */}
      {isSelected && (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 text-neutral-950 rounded-full flex items-center justify-center text-[9px] font-bold shadow-md z-30">
          ✓
        </span>
      )}

      {/* First Half */}
      {renderHalf(pip1, 0)}

      {/* Center Divider & Brass Spinner Rivet */}
      <div
        className={`relative flex items-center justify-center shrink-0 ${
          isHorizontal ? 'w-[1.5px] h-full' : 'h-[1.5px] w-full'
        } ${dividerColor}`}
      >
        {/* Brass pivot rivet located in center of authentic dominoes */}
        <span
          className={`absolute rounded-full border border-amber-600/60 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 shadow-sm ${
            size === 'xs'
              ? 'w-1 h-1'
              : size === 'sm'
              ? 'w-1.5 h-1.5'
              : 'w-2 h-2'
          }`}
        />
      </div>

      {/* Second Half */}
      {renderHalf(pip2, 1)}
    </motion.div>
  );
};
