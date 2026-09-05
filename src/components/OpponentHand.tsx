import React from 'react';
import { DominoTile, PlayerInfo } from '../types';
import { DominoTileView } from './DominoTileView';
import { User, Wifi, WifiOff } from 'lucide-react';

interface OpponentHandProps {
  player: PlayerInfo | null;
  tileCount: number;
  revealedTiles?: DominoTile[];
  isTheirTurn: boolean;
  theme: 'ivory' | 'ebony';
  appTheme: 'dark' | 'light';
  score: number;
}

export const OpponentHand: React.FC<OpponentHandProps> = ({
  player,
  tileCount,
  revealedTiles,
  isTheirTurn,
  theme,
  appTheme,
  score,
}) => {
  const playerName = player?.name || 'Opponent';
  const isConnected = player?.connected ?? false;
  const isLight = appTheme === 'light';

  return (
    <div
      id="opponent-hand-section"
      className={`hidden md:flex w-full items-center justify-between px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border backdrop-blur-md transition-all duration-300 shrink-0 ${
        isLight
          ? 'bg-white/80 border-neutral-200/80 shadow-xs'
          : 'bg-neutral-900/80 border-neutral-800/80 shadow-xs'
      }`}
    >
      {/* Opponent Info (Avatar & Name) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border transition-all ${
            isTheirTurn
              ? 'bg-amber-500/20 border-amber-400 text-amber-500 ring-2 ring-amber-400/40 shadow-xs animate-pulse'
              : isLight
              ? 'bg-neutral-200 border-neutral-300 text-neutral-600'
              : 'bg-neutral-800 border-neutral-700 text-neutral-400'
          }`}
        >
          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs sm:text-sm font-bold truncate max-w-[90px] sm:max-w-[140px] ${
              isLight ? 'text-neutral-900' : 'text-neutral-100'
            }`}
          >
            {playerName}
          </span>
          {isConnected ? (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[10px] text-neutral-400">
              <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              Off
            </span>
          )}
        </div>
      </div>

      {/* Opponent Face-down Tiles (or revealed at round end) */}
      <div className="flex items-center justify-center gap-1 overflow-x-auto max-w-[45%] sm:max-w-[60%] py-0.5 scrollbar-none">
        {revealedTiles && revealedTiles.length > 0 ? (
          revealedTiles.map((t, idx) => (
            <DominoTileView
              key={`opp-revealed-${idx}-${t[0]}-${t[1]}`}
              tile={t}
              size="xs"
              theme={theme}
            />
          ))
        ) : tileCount > 0 ? (
          Array.from({ length: Math.min(tileCount, 14) }).map((_, idx) => (
            <DominoTileView
              key={`opp-tile-${idx}`}
              isFaceDown
              size="xs"
              theme={theme}
            />
          ))
        ) : (
          <span className="text-[10px] sm:text-xs text-amber-500 font-bold">Domino!</span>
        )}
      </div>

      {/* Opponent Stats */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span
          className={`text-[11px] sm:text-xs font-mono ${
            isLight ? 'text-neutral-600' : 'text-neutral-400'
          }`}
        >
          Score: <strong className={isLight ? 'text-neutral-950' : 'text-white'}>{score}</strong>
        </span>
        <span
          className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-mono border ${
            isLight
              ? 'bg-neutral-200/90 text-neutral-800 border-neutral-300'
              : 'bg-neutral-800 text-neutral-300 border-neutral-700'
          }`}
        >
          {tileCount} {tileCount === 1 ? 'tile' : 'tiles'}
        </span>
      </div>
    </div>
  );
};
