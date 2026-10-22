'use client'

import { memo, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import {
  CalendarClock,
  Check,
  ChevronDown,
  Copy,
  FastForward,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { getCategory, getPriority } from '@/lib/constants'
import { dueState, extractLinks, formatDue, goalProgress } from '@/lib/goals'
import { playCheckSound, playUncheckSound } from '@/lib/sounds'
import type { Goal, SubTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Burst } from '@/components/effects/Burst'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface GoalCardActions {
  onToggle: (id: string, status: boolean) => void
  onEdit: (goal: Goal) => void
  onDelete: (id: string) => void
  onDuplicate: (goal: Goal) => void
  onRollover: (goal: Goal) => void
  onUpdateSubtasks: (id: string, subtasks: SubTask[]) => void
}

interface GoalCardProps extends GoalCardActions {
  goal: Goal
  variant: 'grid' | 'list'
  sortable: boolean
  overlay?: boolean
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation()

function Description({ text, className }: { text: string; className?: string }) {
  return (
    <p className={cn('whitespace-pre-line break-words text-sm text-muted-foreground', className)}>
      {extractLinks(text).map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            onPointerDown={stop}
            className="font-medium text-brand underline-offset-2 hover:underline"
          >
            {part.replace(/^https?:\/\/(www\.)?/, '').slice(0, 32)}
            {part.length > 40 ? '…' : ''}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      onPointerDown={stop}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        'relative flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
        checked ? 'border-success bg-success text-white' : 'border-muted-foreground/35 hover:border-success hover:bg-success/10',
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
            <Check className="size-3.5" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

function GoalCardInner({ goal, variant, sortable, overlay, ...actions }: GoalCardProps) {
  const [burst, setBurst] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.id,
    disabled: !sortable || overlay,
  })

  const category = getCategory(goal.category)
  const priority = getPriority(goal.priority)
  const CategoryIcon = category.icon
  const PriorityIcon = priority.icon
  const due = dueState(goal)
  const dueLabel = formatDue(goal)
  const done = goal.subtasks.filter((s) => s.completed).length
  const progress = Math.round(goalProgress(goal) * 100)
  const isList = variant === 'list'

  const toggle = () => {
    if (!goal.status) {
      setBurst((n) => n + 1)
      playCheckSound()
    } else {
      playUncheckSound()
    }
    actions.onToggle(goal.id, !goal.status)
  }

  const toggleSubtask = (id: string) =>
    actions.onUpdateSubtasks(
      goal.id,
      goal.subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...(sortable ? { ...attributes, ...listeners } : {})}
      onDoubleClick={() => !overlay && actions.onEdit(goal)}
      className={cn(
        'surface group relative flex flex-col overflow-hidden',
        !overlay && 'surface-hover',
        isList ? 'px-4 py-3' : 'p-5',
        sortable && 'cursor-grab touch-manipulation active:cursor-grabbing',
        isDragging && 'opacity-40',
        overlay && 'rotate-[1.5deg] cursor-grabbing shadow-2xl ring-2 ring-brand/30',
        goal.status && 'bg-card/60',
      )}
    >
      {goal.priority === 'high' && !goal.status && <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-red-500 to-orange-400" />}
      <Burst trigger={burst} />

      <div className={cn('flex gap-3', isList ? 'items-center' : 'items-start')}>
        <div className={cn(!isList && 'pt-0.5')}>
          <Checkbox checked={goal.status} onChange={toggle} label={goal.status ? 'ทำเครื่องหมายว่ายังไม่เสร็จ' : 'ทำเครื่องหมายว่าสำเร็จ'} />
        </div>

        <div className="min-w-0 flex-1">
          {!isList && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', category.soft, category.text)}>
                <CategoryIcon className="size-3" />
                {category.label}
              </span>
              {goal.priority !== 'medium' && (
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium', priority.soft, priority.text)}>
                  <PriorityIcon className="size-3" />
                  {priority.label}
                </span>
              )}
            </div>
          )}

          <h3
            className={cn(
              'font-display leading-snug transition-colors',
              isList ? 'truncate text-base' : 'text-lg',
              goal.status ? 'text-muted-foreground line-through decoration-muted-foreground/50 decoration-2' : 'text-foreground',
            )}
          >
            {goal.title}
          </h3>

          {!isList && goal.description && <Description text={goal.description} className={cn('mt-1 line-clamp-3', goal.status && 'opacity-60')} />}
        </div>

        {isList && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', category.soft, category.text)}>
              <CategoryIcon className="size-3" />
              {category.label}
            </span>
            {goal.subtasks.length > 0 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                {done}/{goal.subtasks.length}
              </span>
            )}
          </div>
        )}

        {isList && dueLabel && (
          <span
            className={cn(
              'hidden shrink-0 text-xs sm:inline',
              due === 'overdue' ? 'text-danger' : due === 'soon' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
            )}
          >
            {dueLabel}
          </span>
        )}

        {!overlay && (
          <div className="flex shrink-0 items-center" onPointerDown={stop}>
            {sortable && <GripVertical className="mr-0.5 hidden size-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 md:block" />}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="-m-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[state=open]:bg-accent"
                aria-label="ตัวเลือกเพิ่มเติม"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => actions.onEdit(goal)}>
                  <Pencil />
                  แก้ไข
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => actions.onDuplicate(goal)}>
                  <Copy />
                  ทำสำเนา
                </DropdownMenuItem>
                {!goal.status && (
                  <DropdownMenuItem onSelect={() => actions.onRollover(goal)}>
                    <FastForward />
                    ยกยอดไปปี {goal.year + 1}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onSelect={() => actions.onDelete(goal.id)}>
                  <Trash2 />
                  ลบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {!isList && (goal.subtasks.length > 0 || dueLabel) && (
        <div className="mt-4 space-y-3 pl-9">
          {goal.subtasks.length > 0 && (
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpanded((v) => !v)
                }}
                onPointerDown={stop}
                className="flex w-full items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                aria-expanded={expanded}
              >
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn('h-full rounded-full', progress === 100 ? 'bg-success' : 'bg-brand')}
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <span className="tabular-nums">
                  {done}/{goal.subtasks.length}
                </span>
                <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
              </button>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5 pt-2">
                      {goal.subtasks.map((s) => (
                        <li key={s.id}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSubtask(s.id)
                            }}
                            onPointerDown={stop}
                            className="flex w-full items-start gap-2 rounded-lg px-1.5 py-1 text-left text-sm transition-colors hover:bg-accent"
                          >
                            <span
                              className={cn(
                                'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-[1.5px] transition-colors',
                                s.completed ? 'border-success bg-success text-white' : 'border-muted-foreground/40',
                              )}
                            >
                              {s.completed && <Check className="size-3" strokeWidth={3} />}
                            </span>
                            <span className={cn('break-words', s.completed && 'text-muted-foreground line-through')}>{s.title}</span>
                          </button>
                        </li>
                      ))}
                    </div>
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

          {dueLabel && (
            <p
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium',
                due === 'overdue' ? 'text-danger' : due === 'soon' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
              )}
            >
              <CalendarClock className="size-3.5" />
              {dueLabel}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export const GoalCard = memo(GoalCardInner)
