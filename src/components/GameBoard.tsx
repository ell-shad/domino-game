import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DominoTile } from '../types';
import { DominoTileView } from './DominoTileView';
import { isDouble } from '../gameLogic';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Sparkles,
  RotateCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface GameBoardProps {
  board: DominoTile[];
  leftOpen: number | null;
  rightOpen: number | null;
  selectedTile: DominoTile | null;
  validEndsForSelected: ('left' | 'right')[];
  onPlaceTile: (end: 'left' | 'right') => void;
  isMyTurn: boolean;
  theme: 'ivory' | 'ebony';
  boardTheme: 'felt-green' | 'felt-slate' | 'felt-walnut';
  appTheme: 'dark' | 'light';
}

const TILE_H_WIDTH = 96;
const TILE_V_WIDTH = 48;
const TILE_GAP = 4;
const BUTTON_WIDTH = 84;
const BUTTON_GAP = 10;

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  leftOpen,
  rightOpen,
  selectedTile,
  validEndsForSelected,
  onPlaceTile,
  isMyTurn,
  theme,
  boardTheme,
  appTheme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 400,
  });

  // User override for orientation: 'auto' (detect portrait/landscape), 'vertical', or 'horizontal'
  const [orientationMode, setOrientationMode] = useState<'auto' | 'vertical' | 'horizontal'>('auto');

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Determine active layout orientation: vertical if in mobile portrait (or overridden)
  const isVertical = useMemo(() => {
    if (orientationMode === 'vertical') return true;
    if (orientationMode === 'horizontal') return false;
    // Auto mode: if board container is taller than it is wide (mobile portrait)
    return containerSize.height > containerSize.width * 1.08;
  }, [orientationMode, containerSize.width, containerSize.height]);

  const showLeftSlot = isMyTurn && selectedTile && validEndsForSelected.includes('left');
  const showRightSlot = isMyTurn && selectedTile && validEndsForSelected.includes('right');

  // Unscaled length of chain
  const unscaledChainLength = useMemo(() => {
    if (board.length === 0) return 200;

    let len = 0;
    board.forEach((tile, i) => {
      // In horizontal layout, non-doubles are 96px, doubles are 48px.
      // In vertical layout, non-doubles are 96px tall, doubles are 48px tall.
      len += isDouble(tile) ? TILE_V_WIDTH : TILE_H_WIDTH;
      if (i > 0) len += TILE_GAP;
    });

    if (showLeftSlot) len += BUTTON_WIDTH + BUTTON_GAP;
    if (showRightSlot) len += BUTTON_WIDTH + BUTTON_GAP;

    return len;
  }, [board, showLeftSlot, showRightSlot]);

  // Compute zoom-out scale so entire chain fits comfortably in the available space
  const scale = useMemo(() => {
    if (board.length === 0) return 1.0;

    if (isVertical) {
      // Running along the taller vertical axis
      const availH = Math.max(containerSize.height - 48, 140);
      const availW = Math.max(containerSize.width - 24, 100);

      const scaleY = availH / unscaledChainLength;
      const scaleX = availW / 100; // Max cross width is 96px (doubles)

      const optimalScale = Math.min(scaleX, scaleY, 1.0);
      return Math.max(0.24, Math.min(1.0, Number(optimalScale.toFixed(3))));
    } else {
      // Running along the horizontal axis
      const availW = Math.max(containerSize.width - 24, 160);
      const availH = Math.max(containerSize.height - 44, 90);

      const scaleX = availW / unscaledChainLength;
      const scaleY = availH / 100; // Max cross height is 96px (doubles)

      const optimalScale = Math.min(scaleX, scaleY, 1.0);
      return Math.max(0.18, Math.min(1.0, Number(optimalScale.toFixed(3))));
    }
  }, [isVertical, board.length, unscaledChainLength, containerSize.width, containerSize.height]);

  const toggleOrientation = () => {
    setOrientationMode((prev) => {
      if (prev === 'auto') return isVertical ? 'horizontal' : 'vertical';
      if (prev === 'vertical') return 'horizontal';
      return 'auto';
    });
  };

  // Board themes
  const boardBgStyles = useMemo(() => {
    switch (boardTheme) {
      case 'felt-green':
        return 'bg-[#0B3B24] border-[#135E3B] shadow-inner';
      case 'felt-slate':
        return 'bg-[#18232C] border-[#2A3B49] shadow-inner';
      case 'felt-walnut':
        return 'bg-[#2A1810] border-[#42261A] shadow-inner';
      default:
        return 'bg-[#0B3B24] border-[#135E3B] shadow-inner';
    }
  }, [boardTheme]);

  const feltTexture = (
    <div
      className="absolute inset-0 opacity-15 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '16px 16px',
      }}
    />
  );

  return (
    <section
      ref={containerRef}
      id="game-board-container"
      className={`relative w-full flex-1 min-h-0 rounded-xl sm:rounded-2xl border ${boardBgStyles} overflow-hidden flex flex-col justify-between p-1.5 sm:p-2.5 transition-all duration-300 select-none`}
    >
      {feltTexture}

      {/* Top Bar with target indicators & orientation rotation toggle */}
      <div className="relative z-20 w-full flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5">
          {leftOpen !== null ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/55 backdrop-blur border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 shadow-md"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse" />
              {isVertical ? 'Top (Left):' : 'Left:'}{' '}
              <span className="text-white text-xs sm:text-sm">{leftOpen}</span>
            </motion.div>
          ) : (
            <div className="w-12" />
          )}
        </div>

        {/* Center: Table Tile Count + Rotate Board Orientation Button */}
        <div className="flex items-center gap-1.5">
          {board.length > 0 && (
            <div className="flex items-center gap-1 font-mono">
              <span className="px-2 py-0.5 rounded-full bg-black/55 backdrop-blur text-neutral-200 border border-white/10 text-[10px] sm:text-xs">
                {board.length} {board.length === 1 ? 'tile' : 'tiles'}
              </span>
            </div>
          )}

          {/* Orientation rotation toggle */}
          <button
            id="rotate-board-btn"
            onClick={toggleOrientation}
            className="px-2 py-0.5 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur border border-white/20 text-neutral-300 hover:text-white text-[10px] sm:text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md active:scale-95"
            title={`Current: ${isVertical ? 'Vertical 90°' : 'Horizontal'}. Click to rotate board orientation.`}
          >
            <RotateCw className="w-3 h-3 text-amber-400" />
            <span className="hidden xs:inline">{isVertical ? '90° Portrait' : 'Landscape'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {rightOpen !== null ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-black/55 backdrop-blur border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 shadow-md"
            >
              {isVertical ? 'Bottom (Right):' : 'Right:'}{' '}
              <span className="text-white text-xs sm:text-sm">{rightOpen}</span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulse" />
            </motion.div>
          ) : (
            <div className="w-12" />
          )}
        </div>
      </div>

      {/* Domino Canvas Area */}
      <div
        id="domino-board-canvas"
        className={`relative z-10 w-full flex-1 flex items-center justify-center overflow-hidden min-h-0 py-1`}
      >
        {board.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-3 text-center"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400 animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-neutral-200 mb-0.5">
              The table is open
            </p>
            <p className="text-[11px] text-neutral-400 max-w-[200px]">
              {isMyTurn ? 'Place any tile to start the match' : 'Waiting for opponent to open'}
            </p>
          </motion.div>
        ) : (
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className="relative flex items-center justify-center shrink-0"
          >
            {/* Integrated Chain: flex-col if vertical (portrait), flex-row if horizontal */}
            <div
              className={`flex items-center justify-center gap-1.5 ${
                isVertical ? 'flex-col' : 'flex-row'
              }`}
            >
              {/* Play Left Slot (Top if Vertical, Left if Horizontal) */}
              <AnimatePresence>
                {showLeftSlot && (
                  <motion.div
                    initial={
                      isVertical
                        ? { scale: 0.7, opacity: 0, height: 0 }
                        : { scale: 0.7, opacity: 0, width: 0 }
                    }
                    animate={
                      isVertical
                        ? { scale: 1, opacity: 1, height: BUTTON_WIDTH }
                        : { scale: 1, opacity: 1, width: BUTTON_WIDTH }
                    }
                    exit={
                      isVertical
                        ? { scale: 0.7, opacity: 0, height: 0 }
                        : { scale: 0.7, opacity: 0, width: 0 }
                    }
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-center overflow-visible shrink-0 ${
                      isVertical ? 'mb-2' : 'mr-2'
                    }`}
                  >
                    <motion.button
                      id="place-left-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPlaceTile('left')}
                      className={`flex flex-col items-center justify-center ${
                        isVertical ? 'w-[100px] h-[72px]' : 'w-[84px] h-[64px]'
                      } rounded-xl bg-amber-500/35 hover:bg-amber-500/55 border-2 border-dashed border-amber-400 text-amber-200 transition-all shadow-xl shadow-amber-500/30 cursor-pointer backdrop-blur-md px-1 select-none`}
                    >
                      {isVertical ? (
                        <ArrowUp className="w-5 h-5 mb-0.5 text-amber-300 animate-bounce" />
                      ) : (
                        <ArrowLeft className="w-5 h-5 mb-0.5 text-amber-300 animate-pulse" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        Play Left
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono font-bold">
                        Match {leftOpen}
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dominoes Sequence */}
              <div
                className={`flex items-center justify-center gap-1 shrink-0 ${
                  isVertical ? 'flex-col' : 'flex-row'
                }`}
              >
                {board.map((tile, idx) => {
                  const dbl = isDouble(tile);
                  const isNewest = idx === 0 || idx === board.length - 1;

                  // Orientation logic:
                  // In horizontal layout: doubles are vertical, regular tiles are horizontal
                  // In vertical layout: doubles are horizontal (crossing the track), regular tiles are vertical
                  const tileOrientation = isVertical
                    ? dbl
                      ? 'horizontal'
                      : 'vertical'
                    : dbl
                    ? 'vertical'
                    : 'horizontal';

                  return (
                    <motion.div
                      key={`chain-tile-${idx}-${tile[0]}-${tile[1]}`}
                      initial={isNewest ? { scale: 0.6, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 24, stiffness: 340 }}
                      className="flex items-center justify-center shrink-0"
                    >
                      <DominoTileView
                        tile={tile}
                        isDouble={dbl}
                        orientation={tileOrientation}
                        theme={theme}
                        size="md"
                        className="shadow-2xl"
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Play Right Slot (Bottom if Vertical, Right if Horizontal) */}
              <AnimatePresence>
                {showRightSlot && (
                  <motion.div
                    initial={
                      isVertical
                        ? { scale: 0.7, opacity: 0, height: 0 }
                        : { scale: 0.7, opacity: 0, width: 0 }
                    }
                    animate={
                      isVertical
                        ? { scale: 1, opacity: 1, height: BUTTON_WIDTH }
                        : { scale: 1, opacity: 1, width: BUTTON_WIDTH }
                    }
                    exit={
                      isVertical
                        ? { scale: 0.7, opacity: 0, height: 0 }
                        : { scale: 0.7, opacity: 0, width: 0 }
                    }
                    transition={{ duration: 0.2 }}
                    className={`flex items-center justify-center overflow-visible shrink-0 ${
                      isVertical ? 'mt-2' : 'ml-2'
                    }`}
                  >
                    <motion.button
                      id="place-right-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onPlaceTile('right')}
                      className={`flex flex-col items-center justify-center ${
                        isVertical ? 'w-[100px] h-[72px]' : 'w-[84px] h-[64px]'
                      } rounded-xl bg-amber-500/35 hover:bg-amber-500/55 border-2 border-dashed border-amber-400 text-amber-200 transition-all shadow-xl shadow-amber-500/30 cursor-pointer backdrop-blur-md px-1 select-none`}
                    >
                      {isVertical ? (
                        <ArrowDown className="w-5 h-5 mb-0.5 text-amber-300 animate-bounce" />
                      ) : (
                        <ArrowRight className="w-5 h-5 mb-0.5 text-amber-300 animate-pulse" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        Play Right
                      </span>
                      <span className="text-[9px] text-amber-300 font-mono font-bold">
                        Match {rightOpen}
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Subdued Bottom Guide */}
      <div className="relative z-20 w-full text-center pointer-events-none pb-0">
        <p className="text-[10px] sm:text-[11px] text-neutral-400/90 font-medium">
          {isMyTurn
            ? selectedTile
              ? `Click "Play Left" or "Play Right" to place your tile`
              : 'Click any highlighted tile in your hand to play'
            : 'Opponent is thinking...'}
        </p>
      </div>
    </section>
  );
};
