'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface UseGameClockReturn {
  elapsed: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
}

const TICK_INTERVAL = 100;

/**
 * Game clock based on elapsed wall-clock time.
 * Pauses when tab loses visibility to prevent events
 * from piling up while the player isn't watching.
 */
export function useGameClock(onTick: (elapsed: number) => void): UseGameClockReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);

  onTickRef.current = onTick;

  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    setElapsed(elapsed);
    onTickRef.current(elapsed);
  }, []);

  const startInterval = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(tick, TICK_INTERVAL);
  }, [tick]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  const pause = useCallback(() => {
    pausedAtRef.current = Date.now() - startTimeRef.current;
    stopInterval();
    setIsRunning(false);
  }, [stopInterval]);

  const resume = useCallback(() => {
    startTimeRef.current = Date.now() - pausedAtRef.current;
    setIsRunning(true);
    startInterval();
  }, [startInterval]);

  // Pause/resume on tab visibility
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden && isRunning) {
        pause();
      } else if (!document.hidden && pausedAtRef.current > 0 && !isRunning) {
        resume();
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRunning, pause, resume]);

  // Ensure interval is cleaned up only on unmount.
  useEffect(() => {
    return () => stopInterval();
  }, [stopInterval]);

  return { elapsed, isRunning, start, pause, resume };
}
