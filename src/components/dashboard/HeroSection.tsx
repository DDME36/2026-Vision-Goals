'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { computePace, motivationalMessage, yearElapsedPercent, type GoalStats, type Pace } from '@/lib/goals'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeroSectionProps {
  year: number
  years: number[]
  onYearChange: (year: number) => void
  stats: GoalStats
  loading: boolean
}

const paceCopy: Record<Pace, { label: string; tone: string }> = {
  ahead: { label: 'นำหน้าเวลาของปี', tone: 'bg-success/10 text-success' },
  'on-track': { label: 'ตามแผนพอดี', tone: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  behind: { label: 'ช้ากว่าเวลาของปี', tone: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  'not-started': { label: 'ยังไม่เริ่ม', tone: 'bg-muted text-muted-foreground' },
  done: { label: 'สำเร็จครบแล้ว', tone: 'bg-success/10 text-success' },
}

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function Countdown({ year }: { year: number }) {
  const now = useNow()
  if (!now) return <div className="skeleton h-20 rounded-xl" />

  const end = new Date(year + 1, 0, 1).getTime()
  const start = new Date(year, 0, 1).getTime()
  const t = now.getTime()
  const elapsed = yearElapsedPercent(year, now)

  let headline: string
  let sub: string
  if (t < start) {
    headline = `อีก ${Math.ceil((start - t) / 86_400_000)} วัน`
    sub = `จะเริ่มปี ${year}`
  } else if (t >= end) {
    headline = 'จบปีแล้ว'
    sub = `ทบทวนสิ่งที่ทำได้ในปี ${year}`
  } else {
    const diff = end - t
    const days = Math.floor(diff / 86_400_000)
    const h = Math.floor((diff / 3_600_000) % 24)
    const m = Math.floor((diff / 60_000) % 60)
    const s = Math.floor((diff / 1000) % 60)
    headline = `เหลือ ${days} วัน`
    sub = [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
  }

  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight sm:text-3xl">{headline}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-muted-foreground">{sub}</p>
      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
          <span>เวลาของปีที่ผ่านไป</span>
          <span className="tabular-nums">{elapsed}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-foreground/70 transition-[width] duration-700" style={{ width: `${elapsed}%` }} />
        </div>
      </div>
    </div>
  )
}

export function HeroSection({ year, years, onYearChange, stats, loading }: HeroSectionProps) {
  const now = useNow(60_000)
  const pace = now ? computePace(stats, year, now) : 'not-started'

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{now ? greeting(now) : ' '}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">เป้าหมายปี</h1>
          <div className="flex items-center rounded-2xl border bg-card shadow-xs">
            <button
              onClick={() => onYearChange(year - 1)}
              className="rounded-l-2xl p-2.5 text-muted-foreground hover:text-foreground"
              aria-label="ปีก่อนหน้า"
            >
              <ChevronLeft className="size-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 px-1 font-display text-3xl text-brand outline-hidden sm:text-4xl">
                {year}
                <ChevronDown className="size-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-32">
                <DropdownMenuRadioGroup value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
                  {years.map((y) => (
                    <DropdownMenuRadioItem key={y} value={String(y)}>
                      {y}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => onYearChange(year + 1)}
              className="rounded-r-2xl p-2.5 text-muted-foreground hover:text-foreground"
              aria-label="ปีถัดไป"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <p className={cn('mt-3 text-base text-muted-foreground sm:text-lg', loading && 'opacity-0')}>{motivationalMessage(stats)}</p>
      </div>

      <div className="surface w-full p-5 lg:w-80">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">นับถอยหลัง</span>
          {stats.total > 0 && (
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', paceCopy[pace].tone)}>{paceCopy[pace].label}</span>
          )}
        </div>
        <Countdown year={year} />
      </div>
    </section>
  )
}

function greeting(now: Date) {
  const h = now.getHours()
  if (h < 5) return 'ดึกแล้วนะ พักผ่อนบ้าง 🌙'
  if (h < 12) return 'อรุณสวัสดิ์ ☀️'
  if (h < 17) return 'สวัสดีตอนบ่าย 🌤️'
  return 'สวัสดีตอนเย็น 🌆'
}
