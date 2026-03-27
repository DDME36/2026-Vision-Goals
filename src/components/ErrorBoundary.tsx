'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen min-h-[100dvh] flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="font-display text-2xl text-foreground mb-2">
              เกิดข้อผิดพลาด
            </h1>
            
            <p className="text-muted-foreground mb-6">
              ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs bg-muted p-3 rounded-lg mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                ลองใหม่
              </Button>
              <Button onClick={this.handleReload}>
                โหลดหน้าใหม่
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
