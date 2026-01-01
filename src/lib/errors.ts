// Error types and utilities

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Error codes
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  DATABASE_PAUSED: 'DATABASE_PAUSED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const

// Thai error messages
export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.NETWORK_ERROR]: 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต',
  [ErrorCodes.SESSION_EXPIRED]: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
  [ErrorCodes.RATE_LIMITED]: 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่',
  [ErrorCodes.DATABASE_PAUSED]: 'ระบบกำลังเริ่มต้น กรุณารอสักครู่...',
  [ErrorCodes.UNAUTHORIZED]: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบ',
  [ErrorCodes.NOT_FOUND]: 'ไม่พบข้อมูลที่ต้องการ',
  [ErrorCodes.VALIDATION_ERROR]: 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง',
  [ErrorCodes.UNKNOWN]: 'เกิดข้อผิดพลาด กรุณาลองใหม่',
}

// Parse Supabase/network errors into AppError
export function parseError(error: unknown): AppError {
  // Abort/timeout errors
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new AppError(
      'การเชื่อมต่อใช้เวลานานเกินไป กรุณาลองใหม่',
      ErrorCodes.NETWORK_ERROR,
      true
    )
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      ErrorMessages[ErrorCodes.NETWORK_ERROR],
      ErrorCodes.NETWORK_ERROR,
      true
    )
  }

  // Check if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return new AppError(
      ErrorMessages[ErrorCodes.NETWORK_ERROR],
      ErrorCodes.NETWORK_ERROR,
      true
    )
  }

  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as { code: string; message: string; status?: number }
    
    // Session expired
    if (supabaseError.code === 'PGRST301' || 
        supabaseError.message?.includes('JWT') ||
        supabaseError.message?.includes('session')) {
      return new AppError(
        ErrorMessages[ErrorCodes.SESSION_EXPIRED],
        ErrorCodes.SESSION_EXPIRED,
        false
      )
    }

    // Rate limited
    if (supabaseError.status === 429 || supabaseError.code === '429') {
      return new AppError(
        ErrorMessages[ErrorCodes.RATE_LIMITED],
        ErrorCodes.RATE_LIMITED,
        true
      )
    }

    // Database paused (Supabase free tier)
    if (supabaseError.message?.includes('project') || 
        supabaseError.message?.includes('paused') ||
        supabaseError.code === 'PGRST000') {
      return new AppError(
        ErrorMessages[ErrorCodes.DATABASE_PAUSED],
        ErrorCodes.DATABASE_PAUSED,
        true
      )
    }

    // Unauthorized
    if (supabaseError.status === 401 || supabaseError.code === '401') {
      return new AppError(
        ErrorMessages[ErrorCodes.UNAUTHORIZED],
        ErrorCodes.UNAUTHORIZED,
        false
      )
    }

    // Not found
    if (supabaseError.status === 404 || supabaseError.code === 'PGRST116') {
      return new AppError(
        ErrorMessages[ErrorCodes.NOT_FOUND],
        ErrorCodes.NOT_FOUND,
        false
      )
    }
  }

  // Generic error with message
  if (error instanceof Error) {
    return new AppError(
      error.message || ErrorMessages[ErrorCodes.UNKNOWN],
      ErrorCodes.UNKNOWN,
      false
    )
  }

  return new AppError(
    ErrorMessages[ErrorCodes.UNKNOWN],
    ErrorCodes.UNKNOWN,
    false
  )
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const appError = parseError(error)
      lastError = appError
      
      // Only retry if error is retryable
      if (!appError.isRetryable || attempt === maxRetries - 1) {
        throw appError
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

// Network status listener
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
