import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Share2, User, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { ClientRoomState } from '../types';

interface WaitingRoomProps {
  roomState: ClientRoomState;
  myPlayerIndex: 0 | 1 | -1;
  appTheme: 'dark' | 'light';
  onToggleReady: () => void;
  onLeave: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomState,
  myPlayerIndex,
  appTheme,
  onToggleReady,
  onLeave,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const p0 = roomState.players[0];
  const p1 = roomState.players[1];
  const myPlayer = myPlayerIndex >= 0 ? roomState.players[myPlayerIndex] : null;
  const isLight = appTheme === 'light';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-6 px-4">
      <div
        className={`w-full rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-6 border transition-all duration-300 ${
          isLight
            ? 'bg-white/95 border-neutral-200 shadow-neutral-900/10 text-neutral-900'
            : 'bg-neutral-900/80 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header with Back Button */}
        <div
          className={`flex items-center justify-between border-b pb-3 ${
            isLight ? 'border-neutral-200' : 'border-neutral-800'
          }`}
        >
          <button
            onClick={onLeave}
            className={`flex items-center gap-1 text-xs transition-colors cursor-pointer ${
              isLight ? 'text-neutral-500 hover:text-neutral-900' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </button>
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isLight ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            Room Lobby
          </span>
          <div className="w-8" />
        </div>

        {/* Room Code Display */}
        <div className="flex flex-col items-center text-center gap-3">
          <span className={`text-xs font-medium ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Share this code with your friend:
          </span>
          <div className="flex items-center gap-3">
            <div
              className={`px-5 py-2.5 rounded-xl border font-mono text-2xl font-bold tracking-widest shadow-inner ${
                isLight
                  ? 'bg-neutral-100 border-neutral-300 text-amber-800'
                  : 'bg-neutral-950 border-neutral-800 text-amber-300'
              }`}
            >
              {roomState.code}
            </div>
            <button
              id="copy-code-action-btn"
              onClick={handleCopyCode}
              className={`p-3 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
              title="Copy Code"
            >
              {copiedCode ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button
            id="copy-link-action-btn"
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 font-medium transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copiedLink ? 'Link copied to clipboard!' : 'Copy direct invite link'}
          </button>
        </div>

        {/* Match Settings Info */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
            isLight
              ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
              : 'bg-neutral-950/60 border-neutral-800/80 text-neutral-400'
          }`}
        >
          <span>Match Target:</span>
          <span className={`font-bold font-mono ${isLight ? 'text-neutral-900' : 'text-neutral-200'}`}>
            {roomState.targetScore} Points
          </span>
        </div>

        {/* Players Slot List */}
        <div className="flex flex-col gap-2.5">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isLight ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            Players (2 max)
          </span>

          {/* Player 1 (Host) */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border ${
              isLight
                ? 'bg-neutral-50 border-neutral-200'
                : 'bg-neutral-950/80 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xs font-bold ${
                    isLight ? 'text-neutral-900' : 'text-neutral-200'
                  }`}
                >
                  {p0?.name || 'Player 1 (Host)'}
                  {myPlayerIndex === 0 && (
                    <span className="text-neutral-500 font-normal ml-1.5">(You)</span>
                  )}
                </span>
                <span className="text-[10px] text-neutral-500">Host</span>
              </div>
            </div>
            {p0?.isReady ? (
              <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Ready
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                <Circle className="w-4 h-4" /> Waiting
              </span>
            )}
          </div>

          {/* Player 2 */}
          <div
            className={`flex items-center justify-between p-3 rounded-xl border ${
              isLight
                ? 'bg-neutral-50 border-neutral-200'
                : 'bg-neutral-950/80 border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  p1
                    ? 'bg-sky-500/20 border border-sky-400/40 text-sky-500'
                    : isLight
                    ? 'bg-neutral-200 text-neutral-400'
                    : 'bg-neutral-800 text-neutral-600'
                }`}
              >
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xs font-bold ${
                    isLight ? 'text-neutral-900' : 'text-neutral-200'
                  }`}
                >
                  {p1?.name || 'Waiting for friend to join...'}
                  {myPlayerIndex === 1 && (
                    <span className="text-neutral-500 font-normal ml-1.5">(You)</span>
                  )}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {p1 ? (p1.connected ? 'Connected' : 'Disconnected') : 'Share code to invite'}
                </span>
              </div>
            </div>
            {p1 ? (
              p1.isReady ? (
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-neutral-400 font-medium">
                  <Circle className="w-4 h-4" /> Waiting
                </span>
              )
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
        </div>

        {/* Ready Action Button */}
        {myPlayerIndex !== -1 && (
          <motion.button
            id="toggle-ready-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleReady}
            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer ${
              myPlayer?.isReady
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                : 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/25'
            }`}
          >
            {myPlayer?.isReady ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                You are Ready (Click to Cancel)
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                I am Ready
              </>
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
};
