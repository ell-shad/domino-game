import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers } from 'lucide-react';
import { DominoTileView } from './DominoTileView';

interface SpareTilesDockProps {
  boneyardCount: number;
  isMyTurn: boolean;
  canDraw: boolean;
  onDraw: () => void;
  theme: 'ivory' | 'ebony';
  appTheme: 'dark' | 'light';
}

export const SpareTilesDock: React.FC<SpareTilesDockProps> = ({
  boneyardCount,
  canDraw,
  onDraw,
  theme,
  appTheme,
}) => {
  if (boneyardCount === 0) return null;

  const isLight = appTheme === 'light';

  return (
    <AnimatePresence>
      {canDraw && (
        <motion.div
          id="spare-tiles-dock"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full flex items-center justify-between px-2.5 py-1 sm:py-1.5 rounded-xl border backdrop-blur-md transition-all duration-300 ${
            isLight
              ? 'bg-amber-100/90 border-amber-300 text-amber-950 shadow-sm'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-sm'
          }`}
        >
          {/* Header prompt */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-[11px] sm:text-xs font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              Spare Bone Pile ({boneyardCount} left)
            </span>
          </div>

          {/* Quick Draw Button & Interactive Mini Tile Stack */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 max-w-[120px] sm:max-w-[200px] overflow-hidden py-0.5">
              {Array.from({ length: Math.min(boneyardCount, 6) }).map((_, idx) => (
                <DominoTileView
                  key={`spare-mini-${idx}`}
                  isFaceDown
                  size="xs"
                  theme={theme}
                  onClick={onDraw}
                  className="cursor-pointer hover:scale-105"
                />
              ))}
            </div>

            <motion.button
              id="draw-tile-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDraw}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[11px] sm:text-xs font-bold shadow-md shadow-amber-500/25 cursor-pointer whitespace-nowrap"
            >
              Draw Tile
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
