// Утилита для фильтрации ошибок браузерных расширений

const BROWSER_EXTENSION_ERRORS = [
  'Could not establish connection. Receiving end does not exist.',
  'Extension context invalidated',
  'The message port closed before a response was received',
  'Receiving end does not exist',
  'Could not establish connection',
  'WebSocket is closed before the connection is established',
  'WebSocket connection failed',
  'Connection closed before the connection is established'
];

/**
 * Проверяет, является ли ошибка ошибкой браузерного расширения
 */
export function isBrowserExtensionError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  return BROWSER_EXTENSION_ERRORS.some(extensionError => 
    message.includes(extensionError)
  );
}

/**
 * Фильтрует ошибки браузерных расширений из консоли
 */
export function filterBrowserExtensionErrors() {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  console.error = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if (isBrowserExtensionError(errorMessage)) {
      // Не показываем ошибки браузерных расширений
      return;
    }
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    const errorMessage = args.join(' ');
    if (isBrowserExtensionError(errorMessage)) {
      // Не показываем предупреждения браузерных расширений
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

/**
 * Фильтрует ошибки из window.onerror
 */
export function filterWindowErrors() {
  const originalOnError = window.onerror;
  
  window.onerror = (message, source, lineno, colno, error) => {
    if (isBrowserExtensionError(message as string) || 
        (error && isBrowserExtensionError(error))) {
      return true; // Предотвращаем показ ошибки
    }
    
    if (originalOnError) {
      return originalOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };
}

/**
 * Фильтрует ошибки из Promise rejections
 */
export function filterPromiseRejections() {
  window.addEventListener('unhandledrejection', (event) => {
    if (isBrowserExtensionError(event.reason)) {
      event.preventDefault();
      console.warn('Filtered browser extension error:', event.reason);
    }
  });
}

/**
 * Глобальная перехватка всех ошибок
 */
export function setupGlobalErrorHandling() {
  // Перехватываем все необработанные ошибки
  const originalAddEventListener = window.addEventListener;
  
  window.addEventListener = function(type: string, listener: any, options?: any) {
    if (type === 'error' || type === 'unhandledrejection') {
      const wrappedListener = (event: any) => {
        const errorMessage = event.error?.message || event.message || event.reason?.message || '';
        if (isBrowserExtensionError(errorMessage)) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
        return listener(event);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}

/**
 * Инициализирует фильтрацию всех типов ошибок браузерных расширений
 */
export function initErrorFiltering() {
  if (typeof window !== 'undefined') {
    filterBrowserExtensionErrors();
    filterWindowErrors();
    filterPromiseRejections();
    setupGlobalErrorHandling();
  }
}
