'use client'

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MonitorOff,
  Settings,
  Volume2,
  VolumeX,
  Phone,
  PhoneOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MediaControlsProps {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isConnected: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onLeaveSession: () => void;
  onSettingsClick?: () => void;
  className?: string;
}

export default function MediaControls({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isConnected,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveSession,
  onSettingsClick,
  className = ''
}: MediaControlsProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`flex items-center justify-center gap-3 p-4 bg-card/80 backdrop-blur-sm border-t border-border/50 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Microphone Control */}
      <Button
        size="lg"
        variant={isMuted ? "destructive" : "outline"}
        onClick={onToggleMute}
        disabled={!isConnected}
        className={`transition-all duration-200 ${
          isHovered ? 'scale-105' : 'scale-100'
        } ${isMuted ? 'bg-destructive hover:bg-destructive/90' : 'hover:bg-lotus-pink/10'}`}
        title={isMuted ? "Включить микрофон" : "Выключить микрофон"}
      >
        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </Button>

      {/* Video Control */}
      <Button
        size="lg"
        variant={!isVideoOn ? "destructive" : "outline"}
        onClick={onToggleVideo}
        disabled={!isConnected}
        className={`transition-all duration-200 ${
          isHovered ? 'scale-105' : 'scale-100'
        } ${!isVideoOn ? 'bg-destructive hover:bg-destructive/90' : 'hover:bg-lotus-pink/10'}`}
        title={!isVideoOn ? "Включить камеру" : "Выключить камеру"}
      >
        {!isVideoOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
      </Button>

      {/* Screen Share Control */}
      <Button
        size="lg"
        variant={isScreenSharing ? "default" : "outline"}
        onClick={onToggleScreenShare}
        disabled={!isConnected}
        className={`transition-all duration-200 ${
          isHovered ? 'scale-105' : 'scale-100'
        } ${isScreenSharing ? 'bg-gradient-sacred hover:opacity-90' : 'hover:bg-lotus-pink/10'}`}
        title={isScreenSharing ? "Остановить демонстрацию экрана" : "Демонстрация экрана"}
      >
        {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
      </Button>

      {/* Settings */}
      {onSettingsClick && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              className={`transition-all duration-200 ${
                isHovered ? 'scale-105' : 'scale-100'
              } hover:bg-lotus-pink/10`}
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-56">
            <DropdownMenuLabel>Настройки медиа</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSettingsClick}>
              <Settings className="w-4 h-4 mr-2" />
              Настройки камеры и микрофона
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Volume2 className="w-4 h-4 mr-2" />
              Громкость динамиков
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <VolumeX className="w-4 h-4 mr-2" />
              Отключить звук всех
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Leave Session */}
      <Button
        size="lg"
        variant="destructive"
        onClick={onLeaveSession}
        className={`transition-all duration-200 ${
          isHovered ? 'scale-105' : 'scale-100'
        } bg-destructive hover:bg-destructive/90`}
        title="Покинуть сессию"
      >
        <PhoneOff className="w-5 h-5" />
      </Button>
    </div>
  );
}

// Compact version for mobile
export function MediaControlsCompact({
  isMuted,
  isVideoOn,
  isScreenSharing,
  isConnected,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveSession,
  className = ''
}: Omit<MediaControlsProps, 'onSettingsClick'>) {
  return (
    <div className={`flex items-center justify-between p-3 bg-card/90 backdrop-blur-sm border-t border-border/50 ${className}`}>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isMuted ? "destructive" : "outline"}
          onClick={onToggleMute}
          disabled={!isConnected}
          className="w-10 h-10 p-0"
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>

        <Button
          size="sm"
          variant={!isVideoOn ? "destructive" : "outline"}
          onClick={onToggleVideo}
          disabled={!isConnected}
          className="w-10 h-10 p-0"
        >
          {!isVideoOn ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
        </Button>

        <Button
          size="sm"
          variant={isScreenSharing ? "default" : "outline"}
          onClick={onToggleScreenShare}
          disabled={!isConnected}
          className="w-10 h-10 p-0"
        >
          {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
        </Button>
      </div>

      <Button
        size="sm"
        variant="destructive"
        onClick={onLeaveSession}
        className="w-10 h-10 p-0"
      >
        <PhoneOff className="w-4 h-4" />
      </Button>
    </div>
  );
}
