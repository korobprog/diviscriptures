'use client'

import React, { useState, useEffect, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle,
  Timer,
  Hourglass
} from 'lucide-react';

interface SessionTimerProps {
  timeRemaining: number;
  isActive: boolean;
  isPaused?: boolean;
  totalDuration?: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onExtend?: (minutes: number) => void;
  className?: string;
}

const SessionTimer = memo(function SessionTimer({
  timeRemaining,
  isActive,
  isPaused = false,
  totalDuration = 3600, // 1 hour default
  onStart,
  onPause,
  onResume,
  onReset,
  onExtend,
  className = ''
}: SessionTimerProps) {
  const [isLowTime, setIsLowTime] = useState(false);
  const [isCriticalTime, setIsCriticalTime] = useState(false);

  // Check if time is low or critical
  useEffect(() => {
    const lowTimeThreshold = 300; // 5 minutes
    const criticalTimeThreshold = 60; // 1 minute

    const newIsLowTime = timeRemaining <= lowTimeThreshold && timeRemaining > criticalTimeThreshold;
    const newIsCriticalTime = timeRemaining <= criticalTimeThreshold && timeRemaining > 0;
    
    // Only update state if values actually changed
    if (newIsLowTime !== isLowTime) {
      setIsLowTime(newIsLowTime);
    }
    if (newIsCriticalTime !== isCriticalTime) {
      setIsCriticalTime(newIsCriticalTime);
    }
  }, [timeRemaining, isLowTime, isCriticalTime]);

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = totalDuration > 0 ? ((totalDuration - timeRemaining) / totalDuration) * 100 : 0;

  // Get timer status
  const getTimerStatus = () => {
    if (!isActive) return 'Не запущен';
    if (isPaused) return 'Приостановлен';
    if (timeRemaining <= 0) return 'Завершен';
    if (isCriticalTime) return 'Критическое время';
    if (isLowTime) return 'Мало времени';
    return 'Активен';
  };


  // Get status color
  const getStatusColor = () => {
    if (!isActive) return 'secondary';
    if (isPaused) return 'outline';
    if (timeRemaining <= 0) return 'destructive';
    if (isCriticalTime) return 'destructive';
    if (isLowTime) return 'default';
    return 'default';
  };

  // Get timer icon
  const getTimerIcon = () => {
    if (!isActive) return <Timer className="w-4 h-4" />;
    if (isPaused) return <Pause className="w-4 h-4" />;
    if (timeRemaining <= 0) return <RotateCcw className="w-4 h-4" />;
    if (isCriticalTime) return <AlertTriangle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  return (
    <Card className={`shadow-temple bg-card/50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTimerIcon()}
            <span>Таймер сессии</span>
          </div>
          <Badge variant={getStatusColor() as any}>
            {getTimerStatus()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Display */}
        <div className="text-center">
          <div className={`text-3xl font-mono font-bold ${
            isCriticalTime ? 'text-destructive animate-pulse' :
            isLowTime ? 'text-orange-500' :
            'text-foreground'
          }`}>
            {formatTime(timeRemaining)}
          </div>
          {totalDuration > 0 && (
            <div className="text-sm text-muted-foreground mt-1">
              из {formatTime(totalDuration)}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalDuration > 0 && (
          <div className="space-y-2">
            <Progress 
              value={progressPercentage} 
              className={`h-2 ${
                isCriticalTime ? 'bg-destructive' :
                isLowTime ? 'bg-orange-500' :
                'bg-primary'
              }`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Начало</span>
              <span>{Math.round(progressPercentage)}%</span>
              <span>Конец</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-2">
          {!isActive ? (
            <Button 
              onClick={onStart}
              className="bg-gradient-sacred hover:opacity-90"
            >
              <Play className="w-4 h-4 mr-2" />
              Запустить
            </Button>
          ) : isPaused ? (
            <Button 
              onClick={onResume}
              className="bg-gradient-sacred hover:opacity-90"
            >
              <Play className="w-4 h-4 mr-2" />
              Продолжить
            </Button>
          ) : (
            <Button 
              onClick={onPause}
              variant="outline"
            >
              <Pause className="w-4 h-4 mr-2" />
              Пауза
            </Button>
          )}
          
          {isActive && (
            <Button 
              onClick={onReset}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Сброс
            </Button>
          )}
        </div>

        {/* Extend Time Options */}
        {onExtend && isActive && timeRemaining > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground text-center">
              Продлить сессию:
            </div>
            <div className="flex justify-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onExtend(5)}
                className="text-xs"
              >
                +5 мин
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onExtend(10)}
                className="text-xs"
              >
                +10 мин
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onExtend(15)}
                className="text-xs"
              >
                +15 мин
              </Button>
            </div>
          </div>
        )}

        {/* Warnings */}
        {isLowTime && !isCriticalTime && (
          <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-600">
              Осталось мало времени
            </span>
          </div>
        )}

        {isCriticalTime && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
            <span className="text-sm text-destructive font-medium">
              Критическое время! Сессия скоро завершится
            </span>
          </div>
        )}

        {timeRemaining <= 0 && isActive && (
          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
            <Hourglass className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              Время сессии истекло
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default SessionTimer;
