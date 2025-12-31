import type { Metadata } from 'next'
import { IBM_Plex_Sans_Thai, Sriracha } from 'next/font/google'
import { Toaster } from 'sonner'
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${ibmPlexSansThai.variable} ${sriracha.variable} font-sans antialiased`}>
        {children}
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
