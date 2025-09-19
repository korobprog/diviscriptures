'use client'

import React, { memo, useCallback } from 'react';
import SessionTimer from './SessionTimer';

interface TimerContainerProps {
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  totalDuration: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onExtend: (minutes: number) => void;
}

const TimerContainer = memo(function TimerContainer({
  timeRemaining,
  isActive,
  isPaused,
  totalDuration,
  onStart,
  onPause,
  onResume,
  onReset,
  onExtend,
}: TimerContainerProps) {
  // Memoize callbacks to prevent unnecessary re-renders
  const handleStart = useCallback(() => {
    onStart();
  }, [onStart]);

  const handlePause = useCallback(() => {
    onPause();
  }, [onPause]);

  const handleResume = useCallback(() => {
    onResume();
  }, [onResume]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  const handleExtend = useCallback((minutes: number) => {
    onExtend(minutes);
  }, [onExtend]);

  return (
    <SessionTimer
      timeRemaining={timeRemaining}
      isActive={isActive}
      isPaused={isPaused}
      totalDuration={totalDuration}
      onStart={handleStart}
      onPause={handlePause}
      onResume={handleResume}
      onReset={handleReset}
      onExtend={handleExtend}
    />
  );
});

export default TimerContainer;
