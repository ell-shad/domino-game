import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DominoTile } from '../types';
import { DominoTileView } from './DominoTileView';
import { getValidPlacementEnds, handPipSum } from '../gameLogic';
import { ArrowRightLeft, Layers } from 'lucide-react';
import { SpareTilesDock } from './SpareTilesDock';
import { SpareTilesModal } from './SpareTilesModal';

interface PlayerHandProps {
  hand: DominoTile[];
  leftOpen: number | null;
  rightOpen: number | null;
  isMyTurn: boolean;
  selectedTile: DominoTile | null;
  onSelectTile: (tile: DominoTile) => void;
  onDirectPlay: (tile: DominoTile, end: 'left' | 'right') => void;
  boneyardCount: number;
  onDraw: () => void;
  onPass: () => void;
  theme: 'ivory' | 'ebony';
  appTheme: 'dark' | 'light';
  disabled?: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  leftOpen,
  rightOpen,
  isMyTurn,
  selectedTile,
  onSelectTile,
  onDirectPlay,
  boneyardCount,
  onDraw,
  onPass,
  theme,
  appTheme,
  disabled = false,
}) => {
  const [isBoneyardModalOpen, setIsBoneyardModalOpen] = useState(false);
  const isLight = appTheme === 'light';

  const isSelected = (tile: DominoTile) =>
    selectedTile !== null &&
    ((selectedTile[0] === tile[0] && selectedTile[1] === tile[1]) ||
      (selectedTile[0] === tile[1] && selectedTile[1] === tile[0]));

  const playableTilesCount = hand.filter((t) => {
    if (leftOpen === null || rightOpen === null) return true;
    return getValidPlacementEnds(t, leftOpen, rightOpen).length > 0;
  }).length;

  const canPlayAny = isMyTurn && !disabled && playableTilesCount > 0;
  const canDraw = isMyTurn && !disabled && !canPlayAny && boneyardCount > 0;
  const canPass = isMyTurn && !disabled && !canPlayAny && boneyardCount === 0;

  const handleTileClick = (tile: DominoTile) => {
    if (!isMyTurn || disabled) return;

    const validEnds = getValidPlacementEnds(tile, leftOpen, rightOpen);

    if (validEnds.length === 0) return;

    if (leftOpen === null || rightOpen === null) {
      // First tile on table
      onDirectPlay(tile, 'left');
      return;
    }

    if (validEnds.length === 1) {
      // Single valid target: place directly for fast, seamless play
      onDirectPlay(tile, validEnds[0]);
    } else {
      // Multiple choices (both Left and Right valid): select and let user pick end
      onSelectTile(tile);
    }
  };

  const totalPips = handPipSum(hand);

  return (
    <div id="player-hand-section" className="w-full flex flex-col items-center gap-0.5 sm:gap-1 shrink-0 select-none">
      {/* Desktop Spare Tiles Dock */}
      <div className="hidden md:block w-full">
        <SpareTilesDock
          boneyardCount={boneyardCount}
          isMyTurn={isMyTurn}
          canDraw={canDraw}
          onDraw={onDraw}
          theme={theme}
          appTheme={appTheme}
        />
      </div>

      {/* Hand Header Info & Actions */}
      <div className="w-full flex items-center justify-between px-1.5 sm:px-2 py-0.5">
        <div className="flex items-center gap-1 sm:gap-2">
          <span
            className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-neutral-700' : 'text-neutral-400'
            }`}
          >
            Your Hand
          </span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] sm:text-xs font-mono border ${
              isLight
                ? 'bg-neutral-200/90 text-neutral-800 border-neutral-300'
                : 'bg-neutral-800/90 text-neutral-300 border-neutral-700'
            }`}
          >
            {hand.length} {hand.length === 1 ? 'tile' : 'tiles'} · {totalPips}p
          </span>
          {isMyTurn && playableTilesCount > 0 && (
            <span className="inline-flex px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[9px] sm:text-[10px] font-bold">
              {playableTilesCount} playable
            </span>
          )}
        </div>

        {/* Turn Action Controls (Draw button on mobile or Pass Turn) */}
        <div className="flex items-center gap-1.5">
          {/* Mobile inline draw button -> opens Boneyard Popup Modal */}
          {canDraw && (
            <motion.button
              id="mobile-draw-tile-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsBoneyardModalOpen(true)}
              className="px-2.5 py-0.5 sm:py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-md shadow-amber-500/25 cursor-pointer md:hidden"
            >
              <Layers className="w-3 h-3" />
              Draw Tile ({boneyardCount})
            </motion.button>
          )}

          {/* Pass turn button */}
          {canPass && (
            <motion.button
              id="pass-turn-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onPass}
              className="px-2.5 py-0.5 sm:py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] sm:text-xs font-bold flex items-center gap-1 shadow-md shadow-rose-600/25 cursor-pointer"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Pass Turn
            </motion.button>
          )}
        </div>
      </div>

      {/* Hand Tiles Container */}
      <div
        className={`w-full flex items-center min-h-[58px] sm:min-h-[72px] md:min-h-[96px] py-1 px-1 sm:px-3 rounded-xl sm:rounded-2xl border backdrop-blur-md overflow-x-auto scrollbar-none transition-all duration-300 ${
          isLight
            ? 'bg-white/85 border-neutral-200/90 shadow-xs'
            : 'bg-neutral-900/85 border-neutral-800/80 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 mx-auto w-max py-0.5 px-1 shrink-0">
          {hand.map((tile, idx) => {
            const validEnds = getValidPlacementEnds(tile, leftOpen, rightOpen);
            const isPlayable = isMyTurn && !disabled && (leftOpen === null || validEnds.length > 0);
            const isUnplayable = isMyTurn && !disabled && !isPlayable;
            const selected = isSelected(tile);

            return (
              <DominoTileView
                key={`my-tile-${idx}-${tile[0]}-${tile[1]}`}
                tile={tile}
                isPlayable={isPlayable}
                isUnplayable={isUnplayable}
                isSelected={selected}
                theme={theme}
                size="sm"
                onClick={() => handleTileClick(tile)}
                className="transform transition-transform"
              />
            );
          })}
        </div>
      </div>

      {/* Mobile Spare Tiles / Boneyard Selection Modal */}
      <SpareTilesModal
        isOpen={isBoneyardModalOpen}
        onClose={() => setIsBoneyardModalOpen(false)}
        boneyardCount={boneyardCount}
        canDraw={canDraw}
        onDraw={onDraw}
        theme={theme}
        appTheme={appTheme}
        hand={hand}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onTileClick={handleTileClick}
      />
    </div>
  );
};
