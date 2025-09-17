import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Heart } from 'lucide-react';

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺', greeting: 'Харе Кришна' },
  { code: 'en', name: 'English', flag: '🇺🇸', greeting: 'Hare Krishna' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', greeting: 'हरे कृष्ण' },
  { code: 'es', name: 'Español', flag: '🇪🇸', greeting: 'Hare Krishna' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', greeting: 'Hare Krishna' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', greeting: 'Hare Krishna' },
];

interface LanguageSelectorProps {
  onLanguageSelect: (language: string) => void;
}

export default function LanguageSelector({ onLanguageSelect }: LanguageSelectorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 temple-pattern">
      <div className="text-center mb-12 animate-float">
        <div className="inline-flex items-center gap-3 mb-6">
          <Heart className="w-8 h-8 text-primary animate-sacred-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-sacred bg-clip-text text-transparent">
            Divine Scriptures
          </h1>
          <Heart className="w-8 h-8 text-primary animate-sacred-pulse" />
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Совместное изучение священных писаний через духовное общение и чтение в видеоконференции
        </p>
      </div>

      <Card className="max-w-4xl w-full p-8 shadow-divine bg-gradient-temple border-temple-gold/20">
        <div className="text-center mb-8">
          <Globe className="w-12 h-12 mx-auto mb-4 text-krishna-blue animate-lotus-bloom" />
          <h2 className="text-2xl font-semibold mb-3 text-foreground">
            Выберите ваш язык
          </h2>
          <p className="text-muted-foreground">
            Присоединитесь к духовному сообществу на вашем языке
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              size="lg"
              onClick={() => onLanguageSelect(lang.code)}
              className="h-auto p-6 flex flex-col items-center gap-3 group hover:shadow-lotus hover:border-primary/50 transition-sacred bg-card/50 hover:bg-gradient-lotus"
            >
              <span className="text-4xl group-hover:animate-float">
                {lang.flag}
              </span>
              <div className="text-center">
                <div className="font-semibold text-lg text-foreground">
                  {lang.name}
                </div>
                <div className="text-sm text-primary font-medium mt-1">
                  {lang.greeting}
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Все священные тексты доступны на выбранном языке</p>
        </div>
      </Card>
    </div>
  );
}