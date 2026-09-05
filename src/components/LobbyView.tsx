import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Plus,
  ArrowRight,
  Bot,
  BookOpen,
  Volume2,
  VolumeX,
  Sparkles,
  Check,
  Copy,
  Sun,
  Moon,
  Maximize,
  Minimize,
} from 'lucide-react';
import { DominoTileView } from './DominoTileView';
import { audio } from '../utils/audio';

interface LobbyViewProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onCreateRoom: (targetScore: number) => void;
  onJoinRoom: (code: string) => void;
  onStartSolo: (targetScore: number) => void;
  errorMessage: string | null;
  theme: 'ivory' | 'ebony';
  onToggleTheme: () => void;
  appTheme: 'dark' | 'light';
  onToggleAppTheme: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  playerName,
  onUpdatePlayerName,
  onCreateRoom,
  onJoinRoom,
  onStartSolo,
  errorMessage,
  theme,
  onToggleTheme,
  appTheme,
  onToggleAppTheme,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [targetScore, setTargetScore] = useState<number>(100);
  const [showRules, setShowRules] = useState(false);

  const isLight = appTheme === 'light';

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCodeInput.trim()) {
      onJoinRoom(roomCodeInput.trim().toUpperCase());
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-6 px-4">
      {/* Top Header Controls (Mute & Theme toggles) */}
      <div className="w-full flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <button
            id="lobby-app-theme-btn"
            onClick={onToggleAppTheme}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors flex items-center gap-1.5 font-medium ${
              isLight
                ? 'bg-white/80 border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-sm'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{isLight ? 'Dark' : 'Light'}</span>
          </button>

          <button
            id="lobby-tile-theme-btn"
            onClick={onToggleTheme}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors flex items-center gap-1.5 font-medium ${
              isLight
                ? 'bg-white/80 border-neutral-300 text-neutral-800 hover:bg-neutral-100 shadow-sm'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
            }`}
            title="Toggle Domino Tile Color"
          >
            <span
              className={`w-3.5 h-3.5 rounded border shadow-inner ${
                theme === 'ivory' ? 'bg-[#FAF8F5] border-[#CFC3B0]' : 'bg-[#202127] border-[#40434C]'
              }`}
            />
            <span className="text-[11px] capitalize">{theme}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleFullscreen && (
            <button
              id="lobby-fullscreen-btn"
              onClick={onToggleFullscreen}
              className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                isLight
                  ? 'bg-white/80 border-neutral-300 text-neutral-700 hover:bg-neutral-100 shadow-sm'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            id="lobby-mute-btn"
            onClick={onToggleMute}
            className={`p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
              isLight
                ? 'bg-white/80 border-neutral-300 text-neutral-700 hover:bg-neutral-100 shadow-sm'
                : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:bg-neutral-800'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Brand Hero Visual */}
      <div className="flex flex-col items-center text-center mb-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="flex items-center gap-2 mb-3"
        >
          <DominoTileView
            tile={[6, 6]}
            isDouble
            orientation="vertical"
            theme={theme}
            size="sm"
            className="rotate-[-6deg] shadow-lg"
          />
          <DominoTileView
            tile={[5, 2]}
            orientation="vertical"
            theme={theme}
            size="sm"
            className="rotate-[6deg] shadow-lg"
          />
        </motion.div>

        <h1
          className={`text-2xl sm:text-3xl font-serif tracking-tight font-normal ${
            isLight ? 'text-neutral-900' : 'text-neutral-100'
          }`}
        >
          Dominoes
        </h1>
        <p className={`text-xs mt-1 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
          Minimalist 2-Player Online Tabletop
        </p>
      </div>

      {/* Main Action Card */}
      <div
        className={`w-full rounded-2xl p-5 sm:p-6 backdrop-blur-xl shadow-2xl flex flex-col gap-5 border transition-all duration-300 ${
          isLight
            ? 'bg-white/95 border-neutral-200/90 shadow-neutral-900/10 text-neutral-900'
            : 'bg-neutral-900/85 border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Player Name Input */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="player-name-input"
            className={`text-xs font-semibold uppercase tracking-wider ${
              isLight ? 'text-neutral-600' : 'text-neutral-400'
            }`}
          >
            Your Name
          </label>
          <input
            id="player-name-input"
            type="text"
            value={playerName}
            onChange={(e) => onUpdatePlayerName(e.target.value)}
            maxLength={16}
            placeholder="Enter your nickname..."
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
              isLight
                ? 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-100 placeholder:text-neutral-600'
            }`}
          />
        </div>

        {/* Tab Switcher */}
        <div
          className={`grid grid-cols-2 p-1 rounded-xl border ${
            isLight
              ? 'bg-neutral-100 border-neutral-300/80'
              : 'bg-neutral-950/60 border-neutral-800/80'
          }`}
        >
          <button
            id="create-room-tab"
            type="button"
            onClick={() => setTab('create')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'create'
                ? isLight
                  ? 'bg-white text-neutral-950 shadow-sm border border-neutral-200'
                  : 'bg-neutral-800 text-white shadow-sm'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Create Room
          </button>
          <button
            id="join-room-tab"
            type="button"
            onClick={() => setTab('join')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              tab === 'join'
                ? isLight
                  ? 'bg-white text-neutral-950 shadow-sm border border-neutral-200'
                  : 'bg-neutral-800 text-white shadow-sm'
                : isLight
                ? 'text-neutral-600 hover:text-neutral-900'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Join with Code
          </button>
        </div>

        {/* Tab 1: Create Room */}
        {tab === 'create' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span
                className={`text-xs font-medium ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Match Target Score
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { score: 50, label: '50 pts', sub: 'Quick' },
                  { score: 100, label: '100 pts', sub: 'Standard' },
                  { score: 150, label: '150 pts', sub: 'Classic' },
                ].map((item) => (
                  <button
                    key={item.score}
                    id={`target-score-${item.score}`}
                    type="button"
                    onClick={() => setTargetScore(item.score)}
                    className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center ${
                      targetScore === item.score
                        ? isLight
                          ? 'bg-amber-100 border-amber-500 text-amber-950 ring-1 ring-amber-500/50 font-bold'
                          : 'bg-amber-500/15 border-amber-500/60 text-amber-200 ring-1 ring-amber-500/40'
                        : isLight
                        ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span
                      className={`text-[10px] ${
                        isLight ? 'text-neutral-500' : 'text-neutral-500'
                      }`}
                    >
                      {item.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              id="create-room-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCreateRoom(targetScore)}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Room for Friend
            </motion.button>
          </div>
        )}

        {/* Tab 2: Join Room */}
        {tab === 'join' && (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="room-code-input"
                className={`text-xs font-medium ${
                  isLight ? 'text-neutral-600' : 'text-neutral-400'
                }`}
              >
                Enter 4-Character Room Code
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="e.g. ABCD"
                className={`w-full px-4 py-3 rounded-xl border text-center font-mono text-xl font-bold tracking-widest uppercase focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                    : 'bg-neutral-950/80 border-neutral-800 text-amber-300 placeholder:text-neutral-700'
                }`}
              />
            </div>

            <motion.button
              id="join-room-btn"
              type="submit"
              disabled={!roomCodeInput.trim()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Join Game
            </motion.button>
          </form>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-medium"
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Divider with Solo Play */}
        <div className="relative flex items-center justify-center my-1">
          <div
            className={`absolute inset-0 flex items-center ${
              isLight ? 'border-t border-neutral-200' : 'border-t border-neutral-800'
            }`}
          />
          <span
            className={`relative px-3 text-[11px] uppercase font-bold tracking-wider ${
              isLight ? 'bg-white text-neutral-400' : 'bg-neutral-900 text-neutral-500'
            }`}
          >
            or play offline
          </span>
        </div>

        {/* Solo vs Bot Option */}
        <button
          id="start-solo-btn"
          onClick={() => onStartSolo(targetScore)}
          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
              : 'bg-neutral-950/60 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
          }`}
        >
          <Bot className="w-4 h-4 text-sky-500" />
          Practice Solo vs AI Bot ({targetScore} pts)
        </button>

        {/* Rules Collapsible */}
        <div className="pt-1">
          <button
            id="toggle-rules-btn"
            type="button"
            onClick={() => setShowRules(!showRules)}
            className={`w-full flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer ${
              isLight ? 'text-neutral-500 hover:text-neutral-800' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {showRules ? 'Hide Draw Dominoes Rules' : 'View Game Rules'}
          </button>

          {showRules && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`mt-3 p-3.5 rounded-xl border text-xs leading-relaxed flex flex-col gap-2 ${
                isLight
                  ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
                  : 'bg-neutral-950/70 border-neutral-800 text-neutral-300'
              }`}
            >
              <p>
                <strong>Setup:</strong> 28 Double-Six tiles. Each player gets 7 tiles; 14 tiles remain in the spare pile (boneyard).
              </p>
              <p>
                <strong>Gameplay:</strong> Match open ends (left or right). If you cannot play, you must draw from the spare pile until you find a playable tile or the pile empties.
              </p>
              <p>
                <strong>Winning:</strong> The first to play all tiles (Domino) wins the sum of remaining opponent pips. If blocked, the lowest pip sum wins the difference.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
