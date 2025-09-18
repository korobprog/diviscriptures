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
  }, []);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
