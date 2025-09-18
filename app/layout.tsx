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
