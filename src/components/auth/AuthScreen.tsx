'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Eye, EyeOff, HardDrive, Lock, Sparkles, Target, TrendingUp, User } from 'lucide-react'
import { api, errorMessage } from '@/lib/api-client'
import { LIMITS } from '@/lib/config'
import type { AppUser } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

type Mode = 'signin' | 'signup'

interface AuthScreenProps {
  allowRegistration: boolean
  onAuthenticated: (user: AppUser) => void
  onGuest: () => void
}

const highlights = [
  { icon: Target, title: 'ตั้งเป้าให้ชัด', text: 'แยกหมวดหมู่ จัดลำดับความสำคัญ และกำหนดวันเสร็จ' },
  { icon: TrendingUp, title: 'เห็นความคืบหน้าจริง', text: 'แตกเป็นงานย่อย ดูว่าตามทันเวลาของปีหรือไม่' },
  { icon: Sparkles, title: 'ฉลองทุกความสำเร็จ', text: 'สร้างโปสเตอร์สวย ๆ ไว้แชร์ลงสตอรี่' },
]

function passwordStrength(pw: string) {
  let score = 0
  if (pw.length >= LIMITS.password.min) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  return score
}

const strengthLabel = ['สั้นเกินไป', 'พอใช้', 'ดี', 'แข็งแรง', 'แข็งแรงมาก']

export function AuthScreen({ allowRegistration, onAuthenticated, onGuest }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isSignup = mode === 'signup'
  const strength = passwordStrength(password)
  const mismatch = isSignup && confirm.length > 0 && confirm !== password

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setConfirm('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSignup && password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
    setLoading(true)
    setError('')
    try {
      const { user } = await api<{ user: AppUser }>(isSignup ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        json: { username, password },
      })
      onAuthenticated(user)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-backdrop flex min-h-dvh flex-col">
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
        {/* Story panel */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <Logo />
          <h1 className="mt-10 text-5xl font-semibold leading-[1.15] tracking-tight text-balance">
            เปลี่ยน<span className="font-display font-normal text-brand">ความตั้งใจ</span>
            <br />
            ให้กลายเป็นความสำเร็จ
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            พื้นที่ส่วนตัวสำหรับวางแผนเป้าหมายประจำปี ข้อมูลทั้งหมดเก็บอยู่บนเซิร์ฟเวอร์ของคุณเอง
          </p>
          <ul className="mt-10 space-y-5">
            {highlights.map(({ icon: Icon, title, text }, i) => (
              <motion.li
                key={title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                className="flex items-start gap-4"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-sm">
                  <Icon className="size-5 text-brand" />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.section>

        {/* Form */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>

          <div className="surface p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-tight">{isSignup ? 'สร้างบัญชีใหม่' : 'ยินดีต้อนรับกลับมา'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSignup ? 'ใช้เวลาไม่ถึงนาที แล้วเริ่มวางเป้าหมายได้ทันที' : 'เข้าสู่ระบบเพื่อดูเป้าหมายของคุณ'}
              </p>
            </div>

            {allowRegistration && (
              <div className="relative mb-6 grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-medium">
                <motion.span
                  layout
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  className={cn('absolute inset-y-1 w-[calc(50%-4px)] rounded-lg bg-card shadow-sm', isSignup ? 'left-[calc(50%+0px)]' : 'left-1')}
                />
                {(['signin', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => switchMode(m)}
                    className={cn('relative z-10 rounded-lg py-2 transition-colors', mode === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  >
                    {m === 'signin' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username">ชื่อผู้ใช้</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="เช่น zentyr"
                    className="pl-10"
                    autoComplete="username"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={LIMITS.username.max}
                    required
                  />
                </div>
                {isSignup && <p className="text-xs text-muted-foreground">ใช้ a-z, 0-9, จุด หรือขีด อย่างน้อย {LIMITS.username.min} ตัว</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="px-10"
                    autoComplete={isSignup ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {isSignup && password.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={cn(
                            'h-1 flex-1 rounded-full transition-colors',
                            i < strength ? (strength >= 3 ? 'bg-success' : strength === 2 ? 'bg-amber-500' : 'bg-danger') : 'bg-muted',
                          )}
                        />
                      ))}
                    </div>
                    <span className="w-20 text-right text-xs text-muted-foreground">{strengthLabel[strength]}</span>
                  </div>
                )}
              </div>

              <AnimatePresence initial={false}>
                {isSignup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 overflow-hidden"
                  >
                    <Label htmlFor="confirm">ยืนยันรหัสผ่าน</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirm"
                        type={showPassword ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="px-10"
                        autoComplete="new-password"
                        aria-invalid={mismatch}
                      />
                      {confirm && !mismatch && <Check className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-success" />}
                    </div>
                    {mismatch && <p className="text-xs text-danger">รหัสผ่านไม่ตรงกัน</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl bg-danger/10 px-3 py-2.5 text-sm text-danger"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                loading={loading}
                disabled={!username || !password || mismatch}
              >
                {isSignup ? 'สร้างบัญชี' : 'เข้าสู่ระบบ'}
                {!loading && <ArrowRight />}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              หรือ
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full" onClick={onGuest}>
              <HardDrive />
              ลองใช้แบบไม่ต้องสมัคร
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">ข้อมูลจะเก็บไว้ในเบราว์เซอร์นี้เท่านั้น ย้ายขึ้นบัญชีได้ภายหลัง</p>
          </div>
        </motion.section>
      </div>
      <Footer />
    </div>
  )
}
