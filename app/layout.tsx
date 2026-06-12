import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'
import { BottomNav } from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'フルーツ系統樹トラッカー',
  description: '分類階層をたどって、食べたフルーツを記録する',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'フルーツ樹' },
  icons: { icon: '/favicon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#2e7d32',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <main className="mx-auto min-h-screen max-w-[560px] pb-[calc(60px+env(safe-area-inset-bottom))]">
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
