import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialTime?: number;
  onTimeUp?: () => void;
}

interface UseTimerReturn {
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  start: (duration: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  extend: (minutes: number) => void;
}

export function useTimer({ 
  initialTime = 0, 
  onTimeUp 
}: UseTimerOptions = {}): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((duration: number) => {
    clearTimer();
    setTimeRemaining(duration);
    setIsActive(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          setIsActive(false);
          onTimeUp?.();
        }
        return newTime;
      });
    }, 1000);
  }, [clearTimer, onTimeUp]);

  const pause = useCallback(() => {
    if (isActive && !isPaused) {
      clearTimer();
      setIsPaused(true);
      pausedTimeRef.current = Date.now();
    }
  }, [isActive, isPaused, clearTimer]);

  const resume = useCallback(() => {
    if (isActive && isPaused) {
      setIsPaused(false);
      const pauseDuration = Date.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;

      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            setIsActive(false);
            onTimeUp?.();
          }
          return newTime;
        });
      }, 1000);
    }
  }, [isActive, isPaused, onTimeUp]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(0);
    setIsActive(false);
    setIsPaused(false);
  }, [clearTimer]);

  const extend = useCallback((minutes: number) => {
    if (isActive) {
      setTimeRemaining(prev => prev + minutes * 60);
    }
  }, [isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    timeRemaining,
    isActive,
    isPaused,
    start,
    pause,
    resume,
    reset,
    extend,
  };
}
