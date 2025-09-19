// Глобальная обработка ошибок для предотвращения показа неважных ошибок в консоли

// Обработка ошибок расширений браузера
export const isBrowserExtensionError = (error: Error): boolean => {
  const extensionErrorMessages = [
    'Could not establish connection',
    'Receiving end does not exist',
    'Extension context invalidated',
    'The message port closed before a response was received'
  ];
  
  return extensionErrorMessages.some(msg => error.message.includes(msg));
};

// Обработка ошибок разрешений медиа
export const isMediaPermissionError = (error: Error): boolean => {
  return error.name === 'NotAllowedError' || 
         error.name === 'PermissionDeniedError' ||
         error.message.includes('Permission denied');
};

// Безопасное логирование ошибок
export const safeLogError = (error: Error, context?: string): void => {
  // Не логируем ошибки расширений браузера
  if (isBrowserExtensionError(error)) {
    return;
  }
  
  // Не логируем ошибки разрешений медиа (это нормальное поведение пользователя)
  if (isMediaPermissionError(error)) {
    return;
  }
  
  // Логируем только важные ошибки
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
};

// Глобальная обработка необработанных ошибок
export const setupGlobalErrorHandling = (): void => {
  // Обработка необработанных ошибок
  window.addEventListener('error', (event) => {
    if (event.error && isBrowserExtensionError(event.error)) {
      event.preventDefault();
      return;
    }
  });
  
  // Обработка необработанных отклонений промисов
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && isBrowserExtensionError(event.reason)) {
      event.preventDefault();
      return;
    }
  });
};
