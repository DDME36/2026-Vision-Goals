import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai, Sriracha } from 'next/font/google'
import { Providers } from '@/components/layout/Providers'
import { APP_NAME, BRAND } from '@/lib/config'
import './globals.css'

const sans = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const display = Sriracha({
  subsets: ['thai', 'latin'],
  weight: ['400'],
  variable: '--font-display',
  display: 'swap',
})

const description = 'ตั้งเป้าหมาย แตกเป็นขั้นตอนย่อย และติดตามความคืบหน้าตลอดทั้งปี'

export const metadata: Metadata = {
  metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
  title: { default: `${APP_NAME} — เป้าหมายประจำปีของคุณ`, template: `%s · ${APP_NAME}` },
  description,
  applicationName: APP_NAME,
  authors: [{ name: BRAND }],
  creator: BRAND,
  publisher: BRAND,
  appleWebApp: { capable: true, statusBarStyle: 'default', title: APP_NAME },
  formatDetection: { telephone: false },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  openGraph: { title: APP_NAME, description, siteName: APP_NAME, type: 'website', locale: 'th_TH' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f4' },
    { media: '(prefers-color-scheme: dark)', color: '#110f0e' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} min-h-dvh font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
