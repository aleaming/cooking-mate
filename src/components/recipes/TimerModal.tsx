'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { IconPlayerPlay, IconPlayerPause, IconX, IconRefresh, IconCheck } from '@tabler/icons-react';
import { useTimer } from '@/hooks/useTimer';
import { formatCountdown } from '@/lib/utils/timer';
import { modalBackdrop, modalContent, SPRING } from '@/lib/constants/animations';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSeconds: number;
  label: string;
}

export function TimerModal({ isOpen, onClose, initialSeconds, label }: TimerModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAlarm = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      // Play three beeps
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 600);

      setTimeout(() => {
        const osc3 = audioContext.createOscillator();
        const gain3 = audioContext.createGain();
        osc3.connect(gain3);
        gain3.connect(audioContext.destination);
        osc3.frequency.value = 1000;
        gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        osc3.start(audioContext.currentTime);
        osc3.stop(audioContext.currentTime + 0.8);
      }, 1200);
    } catch (e) {
      console.warn('Could not play alarm sound', e);
    }

    // Also try browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: label,
        icon: '/favicon.ico',
        tag: 'cooking-timer',
      });
    }
  }, [label]);

  const { timeRemaining, isRunning, isComplete, isPaused, start, pause, resume, reset, stop } =
    useTimer({
      onComplete: playAlarm,
    });

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Start timer when modal opens
  useEffect(() => {
    if (isOpen && !isRunning && !isComplete) {
      start(initialSeconds);
    }
  }, [isOpen, initialSeconds, start, isRunning, isComplete]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      stop();
    }
  }, [isOpen, stop]);

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  const handlePlayPause = () => {
    if (isComplete) {
      reset();
      start(initialSeconds);
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleReset = () => {
    reset();
    start(initialSeconds);
  };

  if (typeof window === 'undefined') {
    return null;
  }

  const progress = initialSeconds > 0 ? (timeRemaining / initialSeconds) * 100 : 0;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            variants={modalContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-[calc(100%-2rem)] sm:max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sand-200">
              <h2 className="font-display text-lg font-semibold text-olive-900">Cooking Timer</h2>
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-sand-100 active:bg-sand-200 transition-colors -mr-2"
                aria-label="Close timer"
              >
                <IconX size={20} className="text-sand-500" />
              </button>
            </div>

            {/* Timer Display */}
            <div className="p-6 text-center">
              {/* Label */}
              <p className="text-sand-600 mb-2 text-sm">{label}</p>

              {/* Countdown */}
              <motion.div
                key={timeRemaining}
                initial={{ scale: 0.95, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                {/* Progress Ring */}
                <svg className="w-48 h-48 mx-auto -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    className="text-sand-100"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className={isComplete ? 'text-green-500' : 'text-olive-500'}
                    initial={{ pathLength: 1 }}
                    animate={{ pathLength: progress / 100 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      strokeDasharray: '283',
                      strokeDashoffset: 0,
                    }}
                  />
                </svg>

                {/* Time display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isComplete ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={SPRING.bouncy}
                    >
                      <IconCheck size={48} className="text-green-500" />
                      <p className="text-green-600 font-semibold mt-2">Done!</p>
                    </motion.div>
                  ) : (
                    <>
                      <span className="text-4xl sm:text-5xl font-bold text-olive-900 font-mono">
                        {formatCountdown(timeRemaining)}
                      </span>
                      {isPaused && (
                        <span className="text-sand-500 text-sm mt-1">Paused</span>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                {/* Reset button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-sand-100 hover:bg-sand-200 text-sand-600 transition-colors"
                  aria-label="Reset timer"
                >
                  <IconRefresh size={20} />
                </motion.button>

                {/* Play/Pause button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlayPause}
                  className={`min-w-[64px] min-h-[64px] flex items-center justify-center rounded-full transition-colors ${
                    isComplete
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : isPaused
                      ? 'bg-olive-500 hover:bg-olive-600 text-white'
                      : 'bg-terracotta-500 hover:bg-terracotta-600 text-white'
                  }`}
                  aria-label={isComplete ? 'Restart' : isPaused ? 'Resume' : 'Pause'}
                >
                  {isComplete ? (
                    <IconRefresh size={28} />
                  ) : isPaused ? (
                    <IconPlayerPlay size={28} />
                  ) : (
                    <IconPlayerPause size={28} />
                  )}
                </motion.button>

                {/* Cancel button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-sand-100 hover:bg-sand-200 text-sand-600 transition-colors"
                  aria-label="Cancel timer"
                >
                  <IconX size={20} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
