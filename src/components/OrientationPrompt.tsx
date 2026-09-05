import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, LogOut } from 'lucide-react';

interface OrientationPromptProps {
  isVisible: boolean;
  appTheme: 'dark' | 'light';
  onLeave?: () => void;
}

export const OrientationPrompt: React.FC<OrientationPromptProps> = ({
  isVisible,
  appTheme,
  onLeave,
}) => {
  const isLight = appTheme === 'light';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="orientation-prompt-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-xl select-none"
        >
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            className={`relative max-w-xs w-full rounded-2xl border p-5 text-center shadow-2xl flex flex-col items-center gap-3.5 ${
              isLight
                ? 'bg-neutral-900 border-amber-500/50 text-neutral-100'
                : 'bg-[#141519] border-amber-500/40 text-neutral-100'
            }`}
          >
            {/* Status Pill */}
            <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
              PORTRAIT MODE ONLY
            </div>

            {/* Rotating Phone Animation: Horizontal to Vertical */}
            <div className="relative w-16 h-16 flex items-center justify-center my-1">
              <div className="absolute inset-0 rounded-full bg-amber-500/15 animate-ping" />
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <motion.div
                  animate={{
                    rotate: [90, 90, 0, 0, 90],
                  }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Smartphone className="w-7 h-7" />
                </motion.div>
              </div>
            </div>

            {/* Text details */}
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-amber-300">
                Please Rotate to Portrait
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Dominoes is tailored for <strong>portrait mode</strong> on mobile for optimal touch control, easy tile selection, and live chat.
              </p>
            </div>

            {/* Leave match option */}
            {onLeave && (
              <button
                id="pause-leave-match-btn"
                onClick={onLeave}
                className="w-full mt-1 py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-rose-950/40 border border-neutral-700 hover:border-rose-500/50 text-neutral-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Match
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
