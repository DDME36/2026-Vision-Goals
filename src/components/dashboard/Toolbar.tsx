'use client'

import { forwardRef } from 'react'
import { ArrowUpDown, LayoutGrid, List, Search, X } from 'lucide-react'
import { CATEGORIES, PRIORITIES, SORT_OPTIONS, STATUS_FILTERS, type SortKey } from '@/lib/constants'
import { hasActiveFilters, EMPTY_FILTERS, type GoalFilters } from '@/lib/goals'
import { cn } from '@/lib/utils'
import type { ViewMode } from '@/components/goals/GoalBoard'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ToolbarProps {
  filters: GoalFilters
  onFiltersChange: (filters: GoalFilters) => void
  sortBy: SortKey
  onSortChange: (sort: SortKey) => void
  view: ViewMode
  onViewChange: (view: ViewMode) => void
  resultCount: number
  totalCount: number
}

export const Toolbar = forwardRef<HTMLInputElement, ToolbarProps>(function Toolbar(
  { filters, onFiltersChange, sortBy, onSortChange, view, onViewChange, resultCount, totalCount },
  searchRef,
) {
  const set = (patch: Partial<GoalFilters>) => onFiltersChange({ ...filters, ...patch })
  const active = hasActiveFilters(filters)

  return (
    <section className="mt-10 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchRef}
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            onKeyDown={(e) => e.key === 'Escape' && (set({ query: '' }), e.currentTarget.blur())}
            placeholder="ค้นหาเป้าหมาย งานย่อย หรือรายละเอียด…"
            className="h-11 w-full rounded-xl border bg-card pl-10 pr-10 text-sm shadow-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/15"
            aria-label="ค้นหาเป้าหมาย"
          />
          {filters.query ? (
            <button
              onClick={() => set({ query: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="ล้างคำค้นหา"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="kbd absolute right-3 top-1/2 hidden -translate-y-1/2 sm:inline-flex">/</kbd>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 rounded-xl border bg-card p-1 shadow-sm sm:flex-none" role="tablist" aria-label="สถานะ">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={filters.status === s.key}
                onClick={() => set({ status: s.key })}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:flex-none',
                  filters.status === s.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 shadow-sm" aria-label="เรียงลำดับ">
                <ArrowUpDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>เรียงตาม</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => onSortChange(v as SortKey)}>
                {SORT_OPTIONS.map((o) => (
                  <DropdownMenuRadioItem key={o.key} value={o.key}>
                    {o.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex rounded-xl border bg-card p-1 shadow-sm">
            {(
              [
                ['grid', LayoutGrid, 'มุมมองการ์ด'],
                ['list', List, 'มุมมองรายการ'],
              ] as const
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => onViewChange(key)}
                aria-label={label}
                aria-pressed={view === key}
                className={cn(
                  'rounded-lg p-1.5 transition-colors',
                  view === key ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
        {CATEGORIES.map((c) => {
          const on = filters.category === c.key
          const Icon = c.icon
          return (
            <button
              key={c.key}
              onClick={() => set({ category: on ? null : c.key })}
              className={cn(
                'chip',
                on ? 'border-foreground bg-foreground text-background' : 'bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              <Icon className={cn('size-3.5', !on && c.text)} />
              {c.label}
            </button>
          )
        })}
        <span className="mx-1 h-5 w-px shrink-0 bg-border" />
        {PRIORITIES.map((p) => {
          const on = filters.priority === p.key
          const Icon = p.icon
          return (
            <button
              key={p.key}
              onClick={() => set({ priority: on ? null : p.key })}
              className={cn(
                'chip',
                on ? 'border-foreground bg-foreground text-background' : 'bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              <Icon className={cn('size-3.5', !on && p.text)} />
              {p.label}
            </button>
          )
        })}
        {active && (
          <button onClick={() => onFiltersChange(EMPTY_FILTERS)} className="chip border-transparent text-brand hover:underline">
            <X className="size-3.5" />
            ล้างตัวกรอง
          </button>
        )}
        {active && (
          <span className="ml-auto shrink-0 pl-2 text-xs text-muted-foreground">
            แสดง {resultCount} จาก {totalCount}
          </span>
        )}
      </div>
    </section>
  )
})
