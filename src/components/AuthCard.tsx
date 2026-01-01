'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, User, Lock, ArrowRight, Loader2, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/supabase'
import { parseError, isOnline, ErrorCodes } from '@/lib/errors'

interface AuthCardProps {
  onSuccess?: () => void
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleUsernameAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check network first
    if (!isOnline()) {
      setError('ไม่มีการเชื่อมต่ออินเทอร์เน็ต')
      return
    }

    // Validate confirm password for signup
    if (mode === 'signup' && password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'signin') {
        await authApi.signInWithUsername(username, password)
        onSuccess?.()
      } else {
        await authApi.signUpWithUsername(username, password)
        setMessage('สร้างบัญชีสำเร็จ! เข้าสู่ระบบได้เลย')
        setMode('signin')
        setConfirmPassword('')
      }
    } catch (err: unknown) {
      const appError = parseError(err)
      
      const errorMessages: Record<string, string> = {
        'Invalid login credentials': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
        'Email not confirmed': 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ',
        'User already registered': 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว',
        'Password should be at least 6 characters': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
        'Unable to validate email address: invalid format': 'รูปแบบไม่ถูกต้อง',
      }
      
      if (appError.code === ErrorCodes.NETWORK_ERROR) {
        setError('ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต')
      } else if (appError.code === ErrorCodes.RATE_LIMITED) {
        setError('คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่')
      } else if (appError.code === ErrorCodes.DATABASE_PAUSED) {
        setError('ระบบกำลังเริ่มต้น กรุณารอสักครู่...')
      } else {
        const originalMessage = err instanceof Error ? err.message : ''
        const thaiError = errorMessages[originalMessage] || appError.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
        setError(thaiError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'facebook' | 'discord') => {
    if (!isOnline()) {
      setError('ไม่มีการเชื่อมต่ออินเทอร์เน็ต')
      return
    }
    
    setLoadingProvider(provider)
    setError('')
    try {
      if (provider === 'google') {
        await authApi.signInWithGoogle()
      } else if (provider === 'facebook') {
        await authApi.signInWithFacebook()
      } else if (provider === 'discord') {
        await authApi.signInWithDiscord()
      }
    } catch (err: unknown) {
      const appError = parseError(err)
      
      if (appError.code === ErrorCodes.NETWORK_ERROR) {
        setError('ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต')
      } else {
        setError(appError.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      }
      setLoadingProvider(null)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setMessage('')
    setConfirmPassword('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto px-4"
    >
      <div className="bg-card border border-border rounded-2xl shadow-xl p-5 sm:p-8 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 mb-3 sm:mb-4"
          >
            <Target className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </motion.div>
          <h1 className="font-display text-2xl sm:text-4xl text-foreground mb-1 sm:mb-2">2026 Vision Board</h1>
          
          {/* Mode indicator with animation */}
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-muted-foreground text-xs sm:text-sm font-display flex items-center justify-center gap-2"
            >
              {mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  ยินดีต้อนรับกลับ
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  เริ่มต้นการเดินทาง
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex bg-muted rounded-xl p-1 mb-5 sm:mb-6">
          <button
            type="button"
            onClick={() => mode !== 'signin' && toggleMode()}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              mode === 'signin'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LogIn className="w-4 h-4" />
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            onClick={() => mode !== 'signup' && toggleMode()}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              mode === 'signup'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            สมัครสมาชิก
          </button>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 sm:h-12 text-sm sm:text-base"
            onClick={() => handleOAuthSignIn('google')}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 sm:h-12 text-sm sm:text-base"
              onClick={() => handleOAuthSignIn('facebook')}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'facebook' ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="hidden sm:inline">Facebook</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 sm:h-12 text-sm sm:text-base"
              onClick={() => handleOAuthSignIn('discord')}
              disabled={loadingProvider !== null}
            >
              {loadingProvider === 'discord' ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" viewBox="0 0 24 24" fill="#5865F2">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span className="hidden sm:inline">Discord</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-5 sm:mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] sm:text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">หรือใช้ชื่อผู้ใช้</span>
          </div>
        </div>

        {/* Form with animation */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'signup' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'signup' ? -20 : 20 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleUsernameAuth}
            className="space-y-3 sm:space-y-4"
          >
            {/* Username */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="ชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-10 sm:h-11 text-base"
                required
                autoComplete="username"
                autoCapitalize="off"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-10 sm:h-11 text-base"
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password - only for signup */}
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden"
                >
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="ยืนยันรหัสผ่าน"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 pr-10 h-10 sm:h-11 text-base ${
                        confirmPassword && password !== confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-red-500 mt-1"
                    >
                      รหัสผ่านไม่ตรงกัน
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs sm:text-sm text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs sm:text-sm text-green-600 text-center"
              >
                {message}
              </motion.p>
            )}

            <Button 
              type="submit" 
              className="w-full h-10 sm:h-12" 
              disabled={loading || loadingProvider !== null || (mode === 'signup' && password !== confirmPassword)}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      เข้าสู่ระบบ
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      สร้างบัญชี
                    </>
                  )}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </motion.form>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
