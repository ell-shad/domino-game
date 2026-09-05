import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X } from 'lucide-react';
import { audio } from '../utils/audio';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface ChatBubbleToastProps {
  chat: ChatMessage[];
  myPlayerName: string;
  onOpenChat: () => void;
  appTheme: 'dark' | 'light';
}

export const ChatBubbleToast: React.FC<ChatBubbleToastProps> = ({
  chat,
  myPlayerName,
  onOpenChat,
  appTheme,
}) => {
  const [activeToast, setActiveToast] = useState<ChatMessage | null>(null);
  const isLight = appTheme === 'light';

  // Listen for new messages not sent by current player
  useEffect(() => {
    if (chat.length === 0) return;
    const latest = chat[chat.length - 1];

    // Don't show toast for own messages
    if (latest.sender.trim().toLowerCase() === myPlayerName.trim().toLowerCase()) {
      return;
    }

    setActiveToast(latest);
    audio.playMessageSound();

    const timer = setTimeout(() => {
      setActiveToast((curr) => (curr?.id === latest.id ? null : curr));
    }, 4500);

    return () => clearTimeout(timer);
  }, [chat, myPlayerName]);

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          id="chat-bubble-toast"
          initial={{ opacity: 0, y: -20, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.88 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-12 sm:top-14 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] sm:max-w-md pointer-events-auto"
        >
          <div
            onClick={onOpenChat}
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border shadow-2xl backdrop-blur-xl cursor-pointer select-none transition-transform hover:scale-102 active:scale-98 ${
              isLight
                ? 'bg-neutral-900/92 border-amber-500/60 text-white shadow-amber-950/20'
                : 'bg-neutral-950/95 border-amber-500/60 text-neutral-100 shadow-black/60'
            }`}
          >
            {/* Pulsing Chat Icon */}
            <div className="w-6 h-6 rounded-full bg-amber-500/25 border border-amber-400 flex items-center justify-center text-amber-400 shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>

            {/* Sender & Message Content */}
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-400 truncate max-w-[120px]">
                  {activeToast.sender}
                </span>
                <span className="text-[9px] text-neutral-400 font-mono">Just now</span>
              </div>
              <p className="text-xs font-medium text-neutral-100 truncate max-w-[200px] sm:max-w-[280px]">
                {activeToast.text}
              </p>
            </div>

            {/* Tap to reply indicator */}
            <span className="hidden sm:inline-block text-[10px] text-amber-300/80 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 font-medium">
              Reply
            </span>

            {/* Dismiss button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
