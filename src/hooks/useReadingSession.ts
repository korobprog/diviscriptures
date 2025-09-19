import { useState, useEffect, useCallback } from 'react';
import { useSocket, SocketEventHandlers } from './useSocket';

export interface Verse {
  id: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  translation: string;
  commentary: string;
  book: string;
}

export interface ReadingSessionState {
  sessionId: string;
  currentVerse: Verse | null;
  currentReader: string | null;
  queue: string[];
  timeRemaining: number;
  isActive: boolean;
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
    isMyTurn: false,
    participants: [],
  });
  const [error, setError] = useState<string | null>(null);

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
    getQueue: socketGetQueue,
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

  // Event handlers
  const handleSessionJoined: SocketEventHandlers['session-joined'] = useCallback((data) => {
    if (data.sessionId !== sessionId) {
      return;
    }

    setSessionState(prev => {
      const participantsFromEvent = data.participants ?? [];
      const updatedParticipants = Array.from(new Set([
        ...participantsFromEvent,
        participantId,
      ]));

      return {
        ...prev,
        isActive: true,
        participants: updatedParticipants,
      };
    });
    setError(null);
  }, [sessionId, participantId]);

  const handleParticipantJoined: SocketEventHandlers['participant-joined'] = useCallback((data) => {
    if (data.participantId === participantId) {
      return;
    }

    setSessionState(prev => {
      if (prev.participants.includes(data.participantId)) {
        return prev;
      }

      return {
        ...prev,
        participants: [...prev.participants, data.participantId],
      };
    });
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
    setSessionState(prev => ({
      ...prev,
      timeRemaining: data.timeRemaining,
      isActive: data.isActive,
    }));
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
    socketStartSessionTimer(sessionId, duration);
  }, [socketStartSessionTimer, sessionId]);

  const pauseTimer = useCallback(() => {
    socketPauseSessionTimer(sessionId);
  }, [socketPauseSessionTimer, sessionId]);

  const resumeTimer = useCallback(() => {
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

  return {
    // State
    sessionState,
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
  };
}
