'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerOptions {
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isComplete: boolean;
  isPaused: boolean;
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  stop: () => void;
}

/**
 * Hook for managing countdown timer state
 * Provides start, pause, resume, reset, and stop controls
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onComplete, onTick } = options;

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeRef = useRef(0);

  // Clear interval on cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          if (onTick) {
            onTick(newTime);
          }

          if (newTime <= 0) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            setIsComplete(true);

            if (onComplete) {
              onComplete();
            }

            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, onComplete, onTick]);

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    initialTimeRef.current = seconds;
    setTimeRemaining(seconds);
    setIsRunning(true);
    setIsComplete(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      setIsPaused(false);
    }
  }, [isRunning, isPaused]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimeRemaining(initialTimeRef.current);
    setIsRunning(false);
    setIsComplete(false);
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setTimeRemaining(0);
    setIsRunning(false);
    setIsComplete(false);
    setIsPaused(false);
  }, []);

  return {
    timeRemaining,
    isRunning,
    isComplete,
    isPaused,
    start,
    pause,
    resume,
    reset,
    stop,
  };
}
