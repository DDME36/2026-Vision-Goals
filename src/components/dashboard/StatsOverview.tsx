'use client'

import { motion } from 'framer-motion'
import { AlarmClock, CheckCircle2, Flame, Target } from 'lucide-react'
import type { GoalStats } from '@/lib/goals'
import { cn } from '@/lib/utils'
import { ProgressRing } from '@/components/ui/progress-ring'

export function StatsOverview({ stats }: { stats: GoalStats }) {
  const tiles = [
    { label: 'เป้าหมายทั้งหมด', value: stats.total, icon: Target, tone: 'text-foreground' },
    { label: 'สำเร็จแล้ว', value: stats.done, icon: CheckCircle2, tone: 'text-success' },
    { label: 'สำคัญมากที่ค้างอยู่', value: stats.highPriority, icon: Flame, tone: 'text-red-500' },
    {
      label: stats.overdue ? 'เลยกำหนดแล้ว' : 'ใกล้ถึงกำหนด',
      value: stats.overdue || stats.dueSoon,
      icon: AlarmClock,
      tone: stats.overdue ? 'text-danger' : 'text-amber-500',
    },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6"
    >
      <div className="flex items-center gap-4 sm:border-r sm:pr-6">
        <ProgressRing value={stats.percent} size={88} stroke={8}>
          <span className="text-xl font-semibold tabular-nums">{stats.percent}%</span>
        </ProgressRing>
        <div>
          <p className="text-sm font-medium">ความคืบหน้ารวม</p>
          <p className="text-sm text-muted-foreground">
            {stats.done} จาก {stats.total} เป้าหมาย
          </p>
          {stats.weightedPercent !== stats.percent && (
            <p className="mt-1 text-xs text-muted-foreground">รวมงานย่อย {stats.weightedPercent}%</p>
          )}
        </div>
      </div>
      <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <div key={label}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className={cn('size-3.5', tone)} />
              {label}
            </dt>
            <dd className={cn('mt-1 text-2xl font-semibold tabular-nums', value > 0 && tone)}>{value}</dd>
          </div>
        ))}
      </dl>
    </motion.section>
  )
}
