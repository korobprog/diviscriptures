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
    language: string;
    participantsCount: number;
    maxParticipants: number;
    nextSessionTime: string;
    adminName: string;
    rating: number;
    isActive: boolean;
    description?: string;
  };
  onJoin: (groupId: string) => void;
}

export default function GroupCard({ group, onJoin }: GroupCardProps) {
  return (
    <Card className="group h-full shadow-temple hover:shadow-divine transition-sacred bg-gradient-temple border-temple-gold/20 hover:border-primary/30">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <Badge 
            variant={group.isActive ? "default" : "secondary"}
            className="bg-primary/10 text-primary hover:bg-primary/20"
          >
            {group.isActive ? "Активна" : "Ожидание"}
          </Badge>
          <div className="flex items-center gap-1 text-temple-gold">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{group.rating}</span>
          </div>
        </div>
        
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {group.name}
        </CardTitle>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{group.city}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {group.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {group.description}
          </p>
        )}

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-krishna-blue" />
              <span>Участники</span>
            </div>
            <span className="font-medium">
              {group.participantsCount}/{group.maxParticipants}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-krishna-blue" />
              <span>Следующая сессия</span>
            </div>
            <span className="font-medium">{group.nextSessionTime}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Администратор:</span>
            <span className="font-medium">{group.adminName}</span>
          </div>
        </div>

        <Button 
          onClick={() => onJoin(group.id)}
          className="w-full bg-gradient-sacred hover:opacity-90 transition-sacred shadow-lotus"
          disabled={group.participantsCount >= group.maxParticipants}
        >
          <Video className="w-4 h-4 mr-2" />
          {group.participantsCount >= group.maxParticipants ? 'Группа заполнена' : 'Присоединиться'}
        </Button>
      </CardContent>
    </Card>
  );
}
