import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Award, RefreshCw, ArrowRight } from 'lucide-react';
import { ClientRoomState } from '../types';

interface RoundEndModalProps {
  roomState: ClientRoomState;
  myPlayerIndex: 0 | 1 | -1;
  onNextRound: () => void;
  onRematch: () => void;
  theme: 'ivory' | 'ebony';
  appTheme: 'dark' | 'light';
  isSolo?: boolean;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  roomState,
  myPlayerIndex,
  onNextRound,
  onRematch,
  theme,
  appTheme,
  isSolo = false,
}) => {
  const game = roomState.game;
  if (!game || (game.status !== 'round_end' && game.status !== 'game_over')) {
    return null;
  }

  const isGameOver = game.status === 'game_over';
  const roundWinnerIdx = game.roundWinner;
  const winnerPlayer =
    roundWinnerIdx !== undefined && roundWinnerIdx !== 'tie'
      ? roomState.players[roundWinnerIdx]
      : null;

  const isIWinner = myPlayerIndex !== -1 && roundWinnerIdx === myPlayerIndex;
  const isLight = appTheme === 'light';

  // Trigger confetti if game won
  useEffect(() => {
    if (isGameOver && (isIWinner || isSolo)) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
      });
    }
  }, [isGameOver, isIWinner, isSolo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border transition-all ${
          isLight
            ? 'bg-white border-neutral-200 shadow-neutral-900/20 text-neutral-900'
            : 'bg-neutral-900 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header Visual */}
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
              isGameOver
                ? 'bg-amber-500/20 border-amber-400 text-amber-500 ring-4 ring-amber-500/20'
                : isLight
                ? 'bg-neutral-100 border-neutral-300 text-amber-600'
                : 'bg-neutral-800 border-neutral-700 text-amber-400'
            }`}
          >
            {isGameOver ? <Trophy className="w-8 h-8" /> : <Award className="w-8 h-8" />}
          </div>

          <h2 className="text-xl font-bold">
            {isGameOver
              ? `${winnerPlayer?.name || (roundWinnerIdx === 0 ? 'Player 1' : 'Player 2')} Wins the Match!`
              : roundWinnerIdx === 'tie'
              ? 'Round Tied (Game Blocked)'
              : `${winnerPlayer?.name || (roundWinnerIdx === 0 ? 'Player 1' : 'Player 2')} Wins Round ${game.round}!`}
          </h2>

          <p className={`text-xs ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
            {game.roundEndReason === 'domino'
              ? 'Domino! All hand tiles played.'
              : 'Blocked table. Player with lowest pip sum wins remaining difference.'}
          </p>
        </div>

        {/* Round Points & Match Score Table */}
        <div
          className={`p-4 rounded-2xl border flex flex-col gap-3 ${
            isLight
              ? 'bg-neutral-50 border-neutral-200'
              : 'bg-neutral-950/80 border-neutral-800/80'
          }`}
        >
          <div
            className={`flex items-center justify-between border-b pb-2 text-xs ${
              isLight ? 'border-neutral-200' : 'border-neutral-800'
            }`}
          >
            <span className={isLight ? 'text-neutral-600' : 'text-neutral-400'}>
              Round Points Awarded
            </span>
            <span className="font-bold text-amber-700 dark:text-amber-400 font-mono text-sm">
              +{game.roundPointsWon || 0} pts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Player 1 summary */}
            <div
              className={`flex flex-col items-center p-2 rounded-xl border ${
                isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <span className={`text-[11px] font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                {roomState.players[0]?.name || 'Player 1'}
              </span>
              <span className={`text-xl font-bold font-mono mt-0.5 ${isLight ? 'text-neutral-950' : 'text-white'}`}>
                {roomState.matchScores[0]}
              </span>
              <span className="text-[10px] text-neutral-500">
                {game.handScoresAtEnd ? `${game.handScoresAtEnd[0]} pips in hand` : ''}
              </span>
            </div>

            {/* Player 2 summary */}
            <div
              className={`flex flex-col items-center p-2 rounded-xl border ${
                isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900 border-neutral-800'
              }`}
            >
              <span className={`text-[11px] font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                {roomState.players[1]?.name || (isSolo ? 'Bot' : 'Player 2')}
              </span>
              <span className={`text-xl font-bold font-mono mt-0.5 ${isLight ? 'text-neutral-950' : 'text-white'}`}>
                {roomState.matchScores[1]}
              </span>
              <span className="text-[10px] text-neutral-500">
                {game.handScoresAtEnd ? `${game.handScoresAtEnd[1]} pips in hand` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isGameOver ? (
          <motion.button
            id="rematch-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRematch}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Play Rematch
          </motion.button>
        ) : (
          <motion.button
            id="next-round-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextRound}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-colors"
          >
            Start Next Round
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};
