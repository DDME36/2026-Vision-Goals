'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ui] unexpected error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app-backdrop flex min-h-dvh items-center justify-center p-6">
        <div className="surface w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle className="size-7" />
          </div>
          <h1 className="text-xl font-semibold">มีบางอย่างผิดพลาด</h1>
          <p className="mt-2 text-sm text-muted-foreground">ขออภัยในความไม่สะดวก ข้อมูลของคุณยังปลอดภัยอยู่ ลองโหลดหน้าใหม่อีกครั้ง</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 max-h-32 overflow-auto rounded-xl bg-muted p-3 text-left text-xs">{this.state.error.message}</pre>
          )}
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" onClick={() => this.setState({ error: null })}>
              ลองอีกครั้ง
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RotateCcw />
              โหลดหน้าใหม่
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
