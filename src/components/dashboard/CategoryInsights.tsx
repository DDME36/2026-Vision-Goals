'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { getCategory } from '@/lib/constants'
import { categoryBreakdown } from '@/lib/goals'
import type { Goal } from '@/lib/types'
import { cn } from '@/lib/utils'

export function CategoryInsights({ goals, onSelect }: { goals: Goal[]; onSelect: (category: string) => void }) {
  const rows = useMemo(() => categoryBreakdown(goals).slice(0, 5), [goals])

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="surface p-5"
    >
      <h2 className="mb-4 text-sm font-medium">แยกตามหมวดหมู่</h2>
      <ul className="space-y-3">
        {rows.map((row) => {
          const meta = getCategory(row.key)
          const Icon = meta.icon
          const pct = Math.round((row.done / row.total) * 100)
          return (
            <li key={row.key}>
              <button onClick={() => onSelect(row.key)} className="group w-full text-left">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={cn('flex size-6 items-center justify-center rounded-lg', meta.soft, meta.text)}>
                      <Icon className="size-3.5" />
                    </span>
                    <span className="group-hover:underline">{meta.label}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {row.done}/{row.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn('h-full rounded-full', meta.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </motion.section>
  )
}
