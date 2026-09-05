import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  MessageSquare,
  LogOut,
  Share2,
  Send,
  User,
  Sun,
  Moon,
  Palette,
  Maximize,
  Minimize,
  X,
  Sparkles,
} from 'lucide-react';
import { ClientRoomState } from '../types';

interface GameHUDProps {
  roomState: ClientRoomState;
  myPlayerIndex: 0 | 1 | -1;
  isMuted: boolean;
  onToggleMute: () => void;
  theme: 'ivory' | 'ebony';
  onToggleTheme: () => void;
  boardTheme: 'felt-green' | 'felt-slate' | 'felt-walnut';
  onCycleBoardTheme: () => void;
  appTheme: 'dark' | 'light';
  onToggleAppTheme: () => void;
  onLeave: () => void;
  onSendChat: (text: string) => void;
  isSolo?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  isMobileDevice?: boolean;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  roomState,
  myPlayerIndex,
  isMuted,
  onToggleMute,
  theme,
  onToggleTheme,
  boardTheme,
  onCycleBoardTheme,
  appTheme,
  onToggleAppTheme,
  onLeave,
  onSendChat,
  isSolo = false,
  isFullscreen = false,
  onToggleFullscreen,
  isMobileDevice = false,
  isChatOpen: externalChatOpen,
  onToggleChat: externalToggleChat,
}) => {
  const [copied, setCopied] = useState(false);
  const [internalChatOpen, setInternalChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const isChatOpen = externalChatOpen !== undefined ? externalChatOpen : internalChatOpen;
  const toggleChat = externalToggleChat || (() => setInternalChatOpen((prev) => !prev));

  const p0 = roomState.players[0];
  const p1 = roomState.players[1];
  const isLight = appTheme === 'light';

  const opponentIndex = (myPlayerIndex === 0 ? 1 : 0) as 0 | 1;
  const opponentPlayer = roomState.players[opponentIndex];
  const opponentScore = roomState.matchScores[opponentIndex];
  const myScore = myPlayerIndex >= 0 ? roomState.matchScores[myPlayerIndex] : 0;
  const isMyTurn = roomState.game?.turnPlayerIndex === myPlayerIndex;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomState.code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (chatInput.trim()) {
      onSendChat(chatInput.trim());
      setChatInput('');
    }
  };

  const quickEmotes = ['👏 Nice move!', '🎲 Drawing...', '😅 Blocked!', '🔥 Domino!', '🤔 Thinking', '👋 GG!'];

  return (
    <header className="w-full shrink-0">
      {/* 1. Mobile Compact Single-Row Top Bar (< md screens) */}
      <div
        className={`md:hidden w-full flex items-center justify-between px-2 py-1 rounded-xl border backdrop-blur-md transition-all select-none ${
          isLight
            ? 'bg-white/95 border-neutral-300 text-neutral-900 shadow-xs'
            : 'bg-neutral-900/95 border-neutral-800 text-neutral-100 shadow-xs'
        }`}
      >
        {/* Left: Mode/Code + Match Scores */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isSolo ? (
            <button
              onClick={handleCopyCode}
              className="px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-500 text-[10px] font-mono font-bold flex items-center gap-1"
            >
              {roomState.code}
              {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5 text-neutral-400" />}
            </button>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-400 text-[10px] font-bold">
              Solo
            </span>
          )}

          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/40 border border-white/10 text-[11px] font-mono">
            <span className="text-amber-400 font-bold">{myScore}</span>
            <span className="text-neutral-500">:</span>
            <span className="text-neutral-300">{opponentScore}</span>
            <span className="text-[9px] text-neutral-500">/{roomState.targetScore}</span>
          </div>
        </div>

        {/* Center: Opponent tile count & Turn Status */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-[11px]">
            <span className="font-semibold text-neutral-300 text-xs">
              {opponentPlayer?.name || 'Bot'}
            </span>
            <span className="px-1 py-0.2 rounded bg-neutral-800 text-[9px] font-mono text-amber-400 border border-neutral-700">
              {roomState.game?.opponentHandCount ?? 0}🀄
            </span>
          </div>

          <div
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-tight whitespace-nowrap ${
              isMyTurn
                ? 'bg-amber-500 text-neutral-950 font-extrabold shadow-xs shadow-amber-500/30'
                : 'bg-neutral-800 text-neutral-400 font-semibold'
            }`}
          >
            {isMyTurn ? 'YOUR TURN' : 'WAITING'}
          </div>
        </div>

        {/* Right Controls (Chat with badge, Mute, Leave) */}
        <div className="flex items-center gap-1 shrink-0">
          {!isSolo && (
            <button
              onClick={toggleChat}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer relative ${
                isChatOpen
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                  : 'bg-neutral-800/80 border-neutral-700 text-neutral-300'
              }`}
              title="Chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {roomState.chat.length > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          )}

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs cursor-pointer hover:bg-neutral-700"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onLeave}
            className="p-1.5 rounded-lg bg-neutral-800/80 border border-neutral-700 hover:border-rose-500/50 hover:text-rose-400 text-neutral-400 text-xs cursor-pointer"
            title="Leave"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Desktop Standard Top Bar (>= md screens) - Pristine & Untouched */}
      <div
        className={`hidden md:flex w-full items-center justify-between px-3 py-2 rounded-2xl border backdrop-blur-md shadow-lg transition-all duration-300 ${
          isLight
            ? 'bg-white/95 border-neutral-200/90 text-neutral-900 shadow-neutral-900/5'
            : 'bg-neutral-900/90 border-neutral-800/80 text-neutral-100'
        }`}
      >
        {/* Left: Room Badge & Copy */}
        <div className="flex items-center gap-1.5">
          {!isSolo ? (
            <div className="flex items-center gap-1">
              <button
                id="copy-room-code-btn"
                onClick={handleCopyCode}
                className={`px-2 py-1 rounded-xl border text-[11px] font-mono font-bold tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-neutral-100 border-neutral-300 hover:border-neutral-400 text-amber-800'
                    : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 text-amber-400'
                }`}
                title="Click to copy room code"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {roomState.code}
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-neutral-400" />}
              </button>

              <button
                id="share-link-btn"
                onClick={handleCopyLink}
                className={`flex p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  isLight
                    ? 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-neutral-900'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
                title="Copy invite link"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              className={`px-2 py-0.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 ${
                isLight
                  ? 'bg-neutral-100 border-neutral-300 text-neutral-800'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              Solo vs AI
            </div>
          )}
        </div>

        {/* Center: Match Score & Round Info */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-mono ${
              isLight ? 'bg-neutral-100/90 border-neutral-300' : 'bg-neutral-950/80 border-neutral-800'
            }`}
          >
            <span
              className={`font-bold ${
                myPlayerIndex === 0
                  ? 'text-amber-700 dark:text-amber-400 underline underline-offset-2'
                  : isLight
                  ? 'text-neutral-700'
                  : 'text-neutral-300'
              }`}
            >
              {p0?.name || 'P1'}:{' '}
              <strong className={`text-sm ${isLight ? 'text-neutral-950' : 'text-white'}`}>
                {roomState.matchScores[0]}
              </strong>
            </span>
            <span className={isLight ? 'text-neutral-400' : 'text-neutral-600'}>:</span>
            <span
              className={`font-bold ${
                myPlayerIndex === 1
                  ? 'text-amber-700 dark:text-amber-400 underline underline-offset-2'
                  : isLight
                  ? 'text-neutral-700'
                  : 'text-neutral-300'
              }`}
            >
              {p1?.name || (isSolo ? 'Bot' : 'P2')}:{' '}
              <strong className={`text-sm ${isLight ? 'text-neutral-950' : 'text-white'}`}>
                {roomState.matchScores[1]}
              </strong>
            </span>
            <span
              className={`text-[10px] ml-1 pl-1.5 border-l ${
                isLight ? 'text-neutral-500 border-neutral-300' : 'text-neutral-400 border-neutral-800'
              }`}
            >
              To {roomState.targetScore}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          {onToggleFullscreen && (
            <button
              id="hud-fullscreen-btn"
              onClick={onToggleFullscreen}
              className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                isLight
                  ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-950'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            id="toggle-app-theme-btn"
            onClick={onToggleAppTheme}
            className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-950'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          <button
            id="toggle-tile-theme-btn"
            onClick={onToggleTheme}
            className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-center gap-1 ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-950'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title={`Tile Theme: ${theme === 'ivory' ? 'Ivory Bone' : 'Ebony Obsidian'}`}
          >
            <span
              className={`w-3.5 h-3.5 rounded border shadow-inner ${
                theme === 'ivory' ? 'bg-[#FAF8F5] border-[#CFC3B0]' : 'bg-[#202127] border-[#40434C]'
              }`}
            />
          </button>

          <button
            id="cycle-felt-btn"
            onClick={onCycleBoardTheme}
            className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-950'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title={`Felt Tabletop: ${boardTheme}`}
          >
            <Palette className="w-3.5 h-3.5" />
          </button>

          {!isSolo && (
            <button
              id="toggle-chat-btn"
              onClick={toggleChat}
              className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors relative ${
                isChatOpen
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300'
                  : isLight
                  ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-950'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
              title="Chat / Emotes"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {roomState.chat.length > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          )}

          <button
            id="hud-mute-btn"
            onClick={onToggleMute}
            className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-950'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            id="leave-room-btn"
            onClick={onLeave}
            className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:text-rose-600 hover:bg-rose-50'
                : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30'
            }`}
            title="Leave Match"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Mobile-Optimized Slide-Out Chat Drawer */}
      <AnimatePresence>
        {isChatOpen && !isSolo && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleChat}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Side Drawer on Mobile, Elegant Float on Desktop */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`fixed z-50 top-2 right-2 bottom-2 w-[300px] sm:w-[340px] max-w-[92vw] p-3 rounded-2xl border shadow-2xl flex flex-col justify-between backdrop-blur-xl ${
                isLight
                  ? 'bg-white/98 border-neutral-300 text-neutral-900 shadow-amber-950/15'
                  : 'bg-neutral-900/98 border-neutral-800 text-neutral-100 shadow-black/80'
              }`}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-neutral-700/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                  <MessageSquare className="w-4 h-4" />
                  <span>Match Chat & Emotes</span>
                </div>
                <button
                  onClick={toggleChat}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Emote Grid */}
              <div className="py-2">
                <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1.5">
                  Quick Emotes
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {quickEmotes.map((em) => (
                    <button
                      key={em}
                      onClick={() => onSendChat(em)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border text-left truncate transition-all active:scale-95 cursor-pointer ${
                        isLight
                          ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-800'
                          : 'bg-neutral-950 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Message Stream */}
              <div
                className={`flex-1 min-h-[90px] max-h-[160px] overflow-y-auto rounded-xl p-2 flex flex-col gap-1.5 text-xs my-1 ${
                  isLight
                    ? 'bg-neutral-100/80 border border-neutral-200'
                    : 'bg-neutral-950/80 border border-neutral-800'
                }`}
              >
                {roomState.chat.length === 0 ? (
                  <span className="text-neutral-400 text-center my-auto italic text-[11px]">
                    No messages yet. Send a quick emote to your opponent!
                  </span>
                ) : (
                  roomState.chat.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-1.5">
                      <span className="font-bold text-amber-500 truncate max-w-[80px]">
                        {msg.sender}:
                      </span>
                      <span className={`break-words ${isLight ? 'text-neutral-800' : 'text-neutral-200'}`}>
                        {msg.text}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSend} className="flex items-center gap-1.5 pt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  maxLength={50}
                  placeholder="Type a message..."
                  className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                    isLight
                      ? 'bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-500'
                  }`}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <Send className="w-3 h-3" />
                  Send
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
