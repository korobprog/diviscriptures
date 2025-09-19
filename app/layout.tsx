import type { Metadata } from 'next'
import '../src/index.css'
import Providers from './components/Providers'
import Navigation from './components/Navigation'

export const metadata: Metadata = {
  title: 'Vrinda Sangha',
  description: 'Vrinda Sangha - Spiritual Community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Ранняя инициализация фильтра ошибок браузерных расширений
              (function() {
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
                
                function isBrowserExtensionError(message) {
                  return BROWSER_EXTENSION_ERRORS.some(extensionError => 
                    message.includes(extensionError)
                  );
                }
                
                // Фильтруем console.error
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const errorMessage = args.join(' ');
                  if (isBrowserExtensionError(errorMessage)) {
                    return; // Игнорируем ошибки расширений
                  }
                  originalConsoleError.apply(console, args);
                };
                
                // Фильтруем window.onerror
                window.addEventListener('error', function(event) {
                  if (isBrowserExtensionError(event.message)) {
                    event.preventDefault();
                    return false;
                  }
                });
                
                // Фильтруем unhandledrejection
                window.addEventListener('unhandledrejection', function(event) {
                  if (isBrowserExtensionError(event.reason)) {
                    event.preventDefault();
                    return false;
                  }
                });
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <div id="root">
            <Navigation />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
