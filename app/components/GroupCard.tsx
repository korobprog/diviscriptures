'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, MapPin, Star, Video } from 'lucide-react';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    city: string;
    country: string;
    language: string;
    participantsCount: number;
    maxParticipants: number;
    nextSessionTime: string;
    readingTime?: string;
    adminName: string;
    adminId?: string;
    rating: number;
    isActive: boolean;
    description?: string;
    joinLink?: string;
    qrCode?: string;
    isMember?: boolean;
  };
  onJoin: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
  onGenerateQR?: (groupId: string) => void;
  currentUserId?: string;
  currentUserRole?: string;
}

export default function GroupCard({ group, onJoin, onLeave, onGenerateQR, currentUserId, currentUserRole }: GroupCardProps) {
  return (
    <Card className="group h-full shadow-lg hover:shadow-xl transition-all duration-200 bg-white/80 backdrop-blur-sm border border-saffron-100 hover:border-saffron-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-4">
          <CardTitle className="text-xl font-bold text-saffron-800 group-hover:text-saffron-900 transition-colors">
            {group.name}
          </CardTitle>
          <div className="flex items-center text-saffron-600">
            <Star className="w-4 h-4 fill-current mr-1" />
            <span className="text-sm font-medium">{group.rating.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-saffron-700">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{group.city}, {group.country}</span>
          </div>
          
          <div className="flex items-center gap-2 text-saffron-700">
            <span className="text-sm">🌐</span>
            <span className="text-sm">{group.language}</span>
          </div>
          
          <div className="flex items-center gap-2 text-saffron-700">
            <Users className="w-4 h-4" />
            <span className="text-sm">{group.participantsCount} участников</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {group.description && (
          <p className="text-saffron-600 text-sm mb-4 line-clamp-3">
            {group.description}
          </p>
        )}

        {group.readingTime && (
          <div className="flex items-center gap-2 text-saffron-700 mb-4">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Время чтения: {group.readingTime}</span>
            {currentUserRole === 'SUPER_ADMIN' && (
              <Badge variant="destructive" className="text-xs ml-2">
                Супер-админ
              </Badge>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-saffron-200 rounded-full flex items-center justify-center">
              <span className="text-saffron-600 text-xs font-medium">
                {group.adminName?.charAt(0) || "A"}
              </span>
            </div>
            <span className="text-saffron-600 text-sm">
              {group.adminName}
            </span>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {onGenerateQR && currentUserId && group.adminId === currentUserId && (
              <button 
                onClick={() => onGenerateQR(group.id)}
                className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg font-medium border border-amber-300 animate-golden-glow flex-shrink-0"
                title="Генерировать QR код"
              >
                QR
              </button>
            )}
            {group.isMember && onLeave ? (
              <button 
                onClick={() => onLeave(group.id)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg font-medium border border-red-400 flex-1 min-w-0"
              >
                Покинуть группу
              </button>
            ) : (
              <button 
                onClick={() => onJoin(group.id)}
                className="bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 hover:from-amber-500 hover:via-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 shadow-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed border border-amber-300 animate-golden-glow flex-1 min-w-0"
                disabled={group.participantsCount >= group.maxParticipants}
              >
                {group.participantsCount >= group.maxParticipants ? 'Группа заполнена' : 'Присоединиться'}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
