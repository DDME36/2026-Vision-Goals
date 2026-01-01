import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai, Sriracha } from 'next/font/google'
import { Toaster } from 'sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { NetworkStatus } from '@/components/NetworkStatus'
import './globals.css'

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['500'],
  variable: '--font-sans',
})

const sriracha = Sriracha({
  subsets: ['thai', 'latin'],
  weight: ['400'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: '2026 Vision Board | เป้าหมายปี 2026',
  description: 'จดบันทึกและติดตามเป้าหมายของคุณในปี 2026',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '2026 Goals',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

// Viewport config สำหรับ iOS - ป้องกัน zoom อัตโนมัติเมื่อ focus input
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={`${ibmPlexSansThai.variable} ${sriracha.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <NetworkStatus />
          {children}
        </ErrorBoundary>
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'hsl(0 0% 100%)',
              border: '1px solid hsl(40 15% 85%)',
              color: 'hsl(20 10% 15%)',
            },
          }}
        />
      </body>
    </html>
  )
}
