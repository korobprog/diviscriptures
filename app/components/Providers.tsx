"use client";

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { initErrorFiltering } from '@/lib/errorFilter';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Инициализируем фильтрацию ошибок браузерных расширений
    initErrorFiltering();
    
    // Дополнительная защита от ошибок расширений
    const handleError = (event: ErrorEvent) => {
      const message = event.message || '';
      if (message.includes('Could not establish connection') || 
          message.includes('Receiving end does not exist') ||
          message.includes('Extension context invalidated')) {
        event.preventDefault();
        return false;
      }
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || '';
      if (typeof reason === 'string' && (
          reason.includes('Could not establish connection') || 
          reason.includes('Receiving end does not exist') ||
          reason.includes('Extension context invalidated'))) {
        event.preventDefault();
        return false;
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
