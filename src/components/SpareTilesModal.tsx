import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { DominoTile } from '../types';
import { DominoTileView } from './DominoTileView';
import { getValidPlacementEnds } from '../gameLogic';

interface SpareTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  boneyardCount: number;
  canDraw: boolean;
  onDraw: () => void;
  theme: 'ivory' | 'ebony';
  appTheme: 'dark' | 'light';
  hand: DominoTile[];
  leftOpen: number | null;
  rightOpen: number | null;
  onTileClick?: (tile: DominoTile) => void;
}

export const SpareTilesModal: React.FC<SpareTilesModalProps> = ({
  isOpen,
  onClose,
  boneyardCount,
  canDraw,
  onDraw,
  theme,
  appTheme,
  hand,
  leftOpen,
  rightOpen,
  onTileClick,
}) => {
  const isLight = appTheme === 'light';

  const handleTileTap = () => {
    if (!canDraw || boneyardCount <= 0) return;
    onDraw();
  };

  // Find if hand has playable tile
  const playableTiles = hand.filter((t) => {
    if (leftOpen === null || rightOpen === null) return true;
    return getValidPlacementEnds(t, leftOpen, rightOpen).length > 0;
  });

  const hasPlayableNow = playableTiles.length > 0;

  const handleHandTileClick = (tile: DominoTile) => {
    const validEnds = getValidPlacementEnds(tile, leftOpen, rightOpen);
    if (validEnds.length > 0 && onTileClick) {
      onClose();
      onTileClick(tile);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="spare-tiles-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none"
          onClick={onClose}
        >
          <motion.div
            id="spare-tiles-modal-content"
            initial={{ y: 60, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 60, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-3.5 sm:p-4.5 shadow-2xl flex flex-col gap-2.5 sm:gap-3 max-h-[90vh] overflow-hidden ${
              isLight
                ? 'bg-white border-neutral-200 text-neutral-900 shadow-neutral-400/30'
                : 'bg-[#16171B] border-neutral-800 text-neutral-100 shadow-black/60'
            }`}
          >
            {/* Header with boneyard count and target numbers */}
            <div className="flex items-center justify-between border-b pb-2 sm:pb-2.5 border-neutral-700/30">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-500 flex items-center gap-1.5">
                    Domino Boneyard
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${
                        isLight
                          ? 'bg-neutral-100 text-neutral-700 border-neutral-300'
                          : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                      }`}
                    >
                      {boneyardCount} {boneyardCount === 1 ? 'left' : 'left'}
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-neutral-400">
                    Tap any tile to draw until you find a match
                  </p>
                </div>
              </div>

              {/* Target Matching Ends Badge */}
              <div className="flex items-center gap-1.5">
                {leftOpen !== null && rightOpen !== null && (
                  <div className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono text-amber-400 flex items-center gap-1">
                    <span className="text-neutral-400 font-sans text-[9px]">Need:</span>
                    <span className="font-bold">{leftOpen}</span>
                    {leftOpen !== rightOpen && (
                      <>
                        <span className="text-neutral-500">|</span>
                        <span className="font-bold">{rightOpen}</span>
                      </>
                    )}
                  </div>
                )}

                <button
                  id="close-spare-tiles-modal-btn"
                  onClick={onClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Playable Notification when match found */}
            {hasPlayableNow && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs flex items-center justify-between gap-2 font-medium shrink-0"
              >
                <span className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Matching tile found in your hand!
                </span>
                <button
                  onClick={onClose}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-[10px] cursor-pointer shadow-xs"
                >
                  Play Now
                </button>
              </motion.div>
            )}

            {/* Boneyard Face-down Tiles Grid */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">
                Boneyard ({boneyardCount})
              </span>
              <div
                className={`w-full overflow-y-auto max-h-[26vh] sm:max-h-[30vh] p-2.5 rounded-xl border flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 ${
                  isLight
                    ? 'bg-neutral-100/80 border-neutral-200'
                    : 'bg-neutral-900/90 border-neutral-800/80'
                }`}
              >
                {boneyardCount === 0 ? (
                  <div className="py-4 text-center text-xs text-neutral-400">
                    The boneyard is empty!
                  </div>
                ) : (
                  Array.from({ length: boneyardCount }).map((_, idx) => (
                    <motion.button
                      key={`boneyard-tile-${idx}`}
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={handleTileTap}
                      disabled={!canDraw}
                      className="cursor-pointer focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed transform transition-transform"
                    >
                      <DominoTileView
                        isFaceDown
                        size="sm"
                        theme={theme}
                        className="shadow-sm hover:shadow-amber-500/30 transition-shadow"
                      />
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            {/* Live Player Hand View Inside Modal */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400">
                  Your Hand ({hand.length} {hand.length === 1 ? 'tile' : 'tiles'})
                </span>
                {hasPlayableNow && (
                  <span className="text-[10px] text-emerald-400 font-semibold animate-pulse">
                    Tap matching tile to play
                  </span>
                )}
              </div>

              <div
                className={`w-full flex items-center min-h-[56px] py-1.5 px-2 rounded-xl border overflow-x-auto scrollbar-none ${
                  isLight
                    ? 'bg-neutral-100/90 border-neutral-200'
                    : 'bg-neutral-900/90 border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-1.5 mx-auto w-max shrink-0">
                  {hand.map((tile, idx) => {
                    const validEnds = getValidPlacementEnds(tile, leftOpen, rightOpen);
                    const isPlayable = leftOpen === null || validEnds.length > 0;

                    return (
                      <div
                        key={`modal-hand-tile-${idx}-${tile[0]}-${tile[1]}`}
                        onClick={() => isPlayable && handleHandTileClick(tile)}
                        className={isPlayable ? 'cursor-pointer' : 'opacity-60 cursor-default'}
                      >
                        <DominoTileView
                          tile={tile}
                          isPlayable={isPlayable}
                          isUnplayable={!isPlayable}
                          theme={theme}
                          size="sm"
                          className="transform transition-transform"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Actions - Removed Quick Draw as requested */}
            <div className="flex items-center justify-between pt-1 border-t border-neutral-700/30">
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-400">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Tap any bone above to draw</span>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
