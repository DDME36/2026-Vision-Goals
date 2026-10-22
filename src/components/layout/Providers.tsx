'use client'

import { ThemeProvider, useTheme } from 'next-themes'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './ErrorBoundary'
import { NetworkStatus } from './NetworkStatus'

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      position="bottom-center"
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      offset={24}
      toastOptions={{
        classNames: {
          toast: '!rounded-2xl !border !border-border !bg-card !text-foreground !shadow-xl !font-sans',
          description: '!text-muted-foreground',
          actionButton: '!rounded-lg !bg-primary !text-primary-foreground',
        },
      }}
    />
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ErrorBoundary>
        <NetworkStatus />
        {children}
      </ErrorBoundary>
      <ThemedToaster />
    </ThemeProvider>
  )
}
