import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket, SocketEventHandlers } from '@/app/hooks/useSocket';

export interface Verse {
  id: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration?: string;
  wordByWordTranslation?: string;
  translation: string;
  commentary: string;
  book: string;
  title?: string;
  language?: string;
  source?: string;
  isMergedVerse?: boolean;
  mergedWith?: any;
  mergedBlockId?: string;
  isRead?: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ReadingSessionState {
  sessionId: string;
  currentVerse: Verse | null;
  currentReader: string | null;
  queue: string[];
  timeRemaining: number;
  isActive: boolean;
  isPaused: boolean;
  isMyTurn: boolean;
  participants: string[];
}

export interface UseReadingSessionOptions {
  sessionId: string;
  participantId: string;
  participantName: string;
  autoJoin?: boolean;
  onSessionEnded?: (reason: string) => void;
  onError?: (error: string) => void;
}

export interface UseReadingSessionReturn {
  // State
  sessionState: ReadingSessionState;
  isConnected: boolean;
  error: string | null;
  
  // Actions
  joinSession: () => void;
  leaveSession: () => void;
  startReading: () => void;
  finishReading: () => void;
  skipReading: () => void;
  nextVerse: () => void;
  previousVerse: () => void;
  
  // Queue management
  addToQueue: (participantId: string) => void;
  removeFromQueue: (participantId: string) => void;
  clearQueue: () => void;
  
  // Session management
  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  endSession: (reason: string) => void;
  
  // Utils
  getQueuePosition: (participantId: string) => number;
  isInQueue: (participantId: string) => boolean;
  
  // Verse management
  setCurrentVerse: (verse: any) => void;
}

export function useReadingSession({
  sessionId,
  participantId,
  participantName,
  autoJoin = true,
  onSessionEnded,
  onError,
}: UseReadingSessionOptions): UseReadingSessionReturn {
  // State
  const [sessionState, setSessionState] = useState<ReadingSessionState>({
    sessionId,
    currentVerse: null,
    currentReader: null,
    queue: [],
    timeRemaining: 0,
    isActive: false,
    isPaused: false,
    isMyTurn: false,
    participants: [],
  });
  const [error, setError] = useState<string | null>(null);
  
  // Client-side timer for smooth countdown
  const [clientTimeRemaining, setClientTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Socket hook
  const {
    isConnected,
    error: socketError,
    joinSession: socketJoinSession,
    leaveSession: socketLeaveSession,
    startReading: socketStartReading,
    finishReading: socketFinishReading,
    skipReading: socketSkipReading,
    changeVerse: socketChangeVerse,
    updateQueue: socketUpdateQueue,
    startSessionTimer: socketStartSessionTimer,
    pauseSessionTimer: socketPauseSessionTimer,
    resumeSessionTimer: socketResumeSessionTimer,
    endSession: socketEndSession,
    on,
    off,
  } = useSocket({
    autoConnect: true,
    onError: (err) => {
      setError(err);
      onError?.(err);
    },
  });

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      setError(socketError);
      onError?.(socketError);
    }
  }, [socketError, onError]);

  // Auto-join session
  useEffect(() => {
    if (autoJoin && isConnected && !sessionState.isActive) {
      joinSession();
    }
  }, [autoJoin, isConnected, sessionState.isActive]);

  // Client-side timer for smooth countdown
  useEffect(() => {
    if (sessionState.isActive && !sessionState.isPaused && clientTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setClientTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // Timer reached zero, sync with server
            setSessionState(prevState => ({
              ...prevState,
              timeRemaining: 0,
              isActive: false,
            }));
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [sessionState.isActive, sessionState.isPaused, clientTimeRemaining]);

  // Event handlers
  const handleSessionJoined: SocketEventHandlers['session-joined'] = useCallback((data) => {
    if (data.sessionId === sessionId && data.participantId === participantId) {
      setSessionState(prev => ({
        ...prev,
        isActive: true,
        participants: [...prev.participants, participantId],
      }));
      setError(null);
    }
  }, [sessionId, participantId]);

  const handleParticipantJoined: SocketEventHandlers['participant-joined'] = useCallback((data) => {
    if (data.participantId !== participantId) {
      setSessionState(prev => ({
        ...prev,
        participants: [...prev.participants, data.participantId],
      }));
    }
  }, [participantId]);

  const handleParticipantLeft: SocketEventHandlers['participant-left'] = useCallback((data) => {
    setSessionState(prev => ({
      ...prev,
      participants: prev.participants.filter(id => id !== data.participantId),
      queue: prev.queue.filter(id => id !== data.participantId),
      currentReader: prev.currentReader === data.participantId ? null : prev.currentReader,
    }));
  }, []);

  const handleVerseChanged: SocketEventHandlers['verse-changed'] = useCallback((data) => {
    setSessionState(prev => ({
      ...prev,
      currentVerse: data.verse,
      currentReader: data.currentReader || null,
      isMyTurn: data.currentReader === participantId,
    }));
  }, [participantId]);

  const handleReadingStarted: SocketEventHandlers['reading-started'] = useCallback((data) => {
    setSessionState(prev => ({
      ...prev,
      currentReader: data.participantId,
      isMyTurn: data.participantId === participantId,
    }));
  }, [participantId]);

  const handleReadingFinished: SocketEventHandlers['reading-finished'] = useCallback((data) => {
    setSessionState(prev => ({
      ...prev,
      currentReader: null,
      isMyTurn: false,
      queue: prev.queue.filter(id => id !== data.participantId),
    }));
  }, []);

  const handleQueueUpdated: SocketEventHandlers['queue-updated'] = useCallback((data) => {
    setSessionState(prev => ({
      ...prev,
      queue: data.queue,
      currentReader: data.currentReader || prev.currentReader,
      isMyTurn: data.currentReader === participantId,
    }));
  }, [participantId]);

  const handleSessionTimerUpdate: SocketEventHandlers['session-timer-update'] = useCallback((data) => {
    setClientTimeRemaining(data.timeRemaining);
    
    setSessionState(prev => {
      // Only update if values actually changed to prevent unnecessary re-renders
      if (prev.timeRemaining === data.timeRemaining && 
          prev.isActive === data.isActive && 
          prev.isPaused === (data.isPaused || false)) {
        return prev;
      }
      
      return {
        ...prev,
        timeRemaining: data.timeRemaining,
        isActive: data.isActive,
        isPaused: data.isPaused || false,
      };
    });
  }, []);

  const handleSessionEnded: SocketEventHandlers['session-ended'] = useCallback((data) => {
    if (data.sessionId === sessionId) {
      setSessionState(prev => ({
        ...prev,
        isActive: false,
        currentReader: null,
        isMyTurn: false,
        queue: [],
        timeRemaining: 0,
      }));
      onSessionEnded?.(data.reason);
    }
  }, [sessionId, onSessionEnded]);

  const handleError: SocketEventHandlers['error'] = useCallback((data) => {
    setError(data.message);
    onError?.(data.message);
  }, [onError]);

  // Register event handlers
  useEffect(() => {
    on('session-joined', handleSessionJoined);
    on('participant-joined', handleParticipantJoined);
    on('participant-left', handleParticipantLeft);
    on('verse-changed', handleVerseChanged);
    on('reading-started', handleReadingStarted);
    on('reading-finished', handleReadingFinished);
    on('queue-updated', handleQueueUpdated);
    on('session-timer-update', handleSessionTimerUpdate);
    on('session-ended', handleSessionEnded);
    on('error', handleError);

    return () => {
      off('session-joined', handleSessionJoined);
      off('participant-joined', handleParticipantJoined);
      off('participant-left', handleParticipantLeft);
      off('verse-changed', handleVerseChanged);
      off('reading-started', handleReadingStarted);
      off('reading-finished', handleReadingFinished);
      off('queue-updated', handleQueueUpdated);
      off('session-timer-update', handleSessionTimerUpdate);
      off('session-ended', handleSessionEnded);
      off('error', handleError);
    };
  }, [
    on, off,
    handleSessionJoined,
    handleParticipantJoined,
    handleParticipantLeft,
    handleVerseChanged,
    handleReadingStarted,
    handleReadingFinished,
    handleQueueUpdated,
    handleSessionTimerUpdate,
    handleSessionEnded,
    handleError,
  ]);

  // Actions
  const joinSession = useCallback(() => {
    socketJoinSession(sessionId, participantId, participantName);
  }, [socketJoinSession, sessionId, participantId, participantName]);

  const leaveSession = useCallback(() => {
    socketLeaveSession(sessionId, participantId);
    setSessionState(prev => ({
      ...prev,
      isActive: false,
      currentReader: null,
      isMyTurn: false,
      queue: [],
    }));
  }, [socketLeaveSession, sessionId, participantId]);

  const startReading = useCallback(() => {
    if (sessionState.currentVerse && sessionState.isMyTurn) {
      socketStartReading(sessionId, participantId, sessionState.currentVerse);
    }
  }, [socketStartReading, sessionId, participantId, sessionState.currentVerse, sessionState.isMyTurn]);

  const finishReading = useCallback(() => {
    if (sessionState.currentVerse && sessionState.isMyTurn) {
      socketFinishReading(sessionId, participantId, sessionState.currentVerse);
    }
  }, [socketFinishReading, sessionId, participantId, sessionState.currentVerse, sessionState.isMyTurn]);

  const skipReading = useCallback(() => {
    if (sessionState.isMyTurn) {
      socketSkipReading(sessionId, participantId);
    }
  }, [socketSkipReading, sessionId, participantId, sessionState.isMyTurn]);

  const nextVerse = useCallback(() => {
    // This would typically fetch the next verse from an API
    // For now, we'll just emit a change-verse event
    if (sessionState.currentVerse) {
      const nextVerse = {
        ...sessionState.currentVerse,
        verse: sessionState.currentVerse.verse + 1,
      };
      socketChangeVerse(sessionId, nextVerse);
    }
  }, [socketChangeVerse, sessionId, sessionState.currentVerse]);

  const previousVerse = useCallback(() => {
    // This would typically fetch the previous verse from an API
    // For now, we'll just emit a change-verse event
    if (sessionState.currentVerse && sessionState.currentVerse.verse > 1) {
      const prevVerse = {
        ...sessionState.currentVerse,
        verse: sessionState.currentVerse.verse - 1,
      };
      socketChangeVerse(sessionId, prevVerse);
    }
  }, [socketChangeVerse, sessionId, sessionState.currentVerse]);

  // Queue management
  const addToQueue = useCallback((participantId: string) => {
    const newQueue = [...sessionState.queue, participantId];
    socketUpdateQueue(sessionId, newQueue);
  }, [socketUpdateQueue, sessionId, sessionState.queue]);

  const removeFromQueue = useCallback((participantId: string) => {
    const newQueue = sessionState.queue.filter(id => id !== participantId);
    socketUpdateQueue(sessionId, newQueue);
  }, [socketUpdateQueue, sessionId, sessionState.queue]);

  const clearQueue = useCallback(() => {
    socketUpdateQueue(sessionId, []);
  }, [socketUpdateQueue, sessionId]);

  // Session management
  const startTimer = useCallback((duration: number) => {
    console.log('Starting timer with duration:', duration);
    socketStartSessionTimer(sessionId, duration);
  }, [socketStartSessionTimer, sessionId]);

  const pauseTimer = useCallback(() => {
    console.log('Pausing timer');
    socketPauseSessionTimer(sessionId);
  }, [socketPauseSessionTimer, sessionId]);

  const resumeTimer = useCallback(() => {
    console.log('Resuming timer');
    socketResumeSessionTimer(sessionId);
  }, [socketResumeSessionTimer, sessionId]);

  const endSession = useCallback((reason: string) => {
    socketEndSession(sessionId, reason);
  }, [socketEndSession, sessionId]);

  // Utils
  const getQueuePosition = useCallback((participantId: string) => {
    return sessionState.queue.indexOf(participantId) + 1;
  }, [sessionState.queue]);

  const isInQueue = useCallback((participantId: string) => {
    return sessionState.queue.includes(participantId);
  }, [sessionState.queue]);

  // Verse management
  const setCurrentVerse = useCallback((verse: any) => {
    setSessionState(prev => ({
      ...prev,
      currentVerse: verse
    }));
  }, []);

  return {
    // State
    sessionState: {
      ...sessionState,
      timeRemaining: clientTimeRemaining, // Use client-side timer for smooth display
    },
    isConnected,
    error,
    
    // Actions
    joinSession,
    leaveSession,
    startReading,
    finishReading,
    skipReading,
    nextVerse,
    previousVerse,
    
    // Queue management
    addToQueue,
    removeFromQueue,
    clearQueue,
    
    // Session management
    startTimer,
    pauseTimer,
    resumeTimer,
    endSession,
    
    // Utils
    getQueuePosition,
    isInQueue,
    
    // Verse management
    setCurrentVerse,
  };
}
