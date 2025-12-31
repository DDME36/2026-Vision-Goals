'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Circle, CheckCircle2, Pencil, Trash2, Flame, Calendar, Minus, ArrowDown, Briefcase, Heart, Wallet, User, BookOpen, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Goal } from '@/lib/supabase'
import { ConfettiEffect } from './ConfettiEffect'
import { playCheckSound, playUncheckSound } from '@/lib/sounds'

interface GoalCardProps {
  goal: Goal
  onToggleStatus: (id: string, status: boolean) => void
  onEdit: (goal: Goal) => void
  onDelete: (id: string) => void
  isDragOverlay?: boolean
}

const priorityConfig = {
  high: { label: 'สำคัญมาก', color: 'text-red-500', bgColor: 'bg-red-50', icon: Flame },
  medium: { label: 'ปานกลาง', color: 'text-amber-500', bgColor: 'bg-amber-50', icon: Minus },
  low: { label: 'ไม่เร่งด่วน', color: 'text-slate-400', bgColor: 'bg-slate-50', icon: ArrowDown },
}

const categoryConfig: Record<string, { label: string; icon: typeof Tag; color: string }> = {
  general: { label: 'ทั่วไป', icon: Tag, color: 'text-slate-500' },
  career: { label: 'การงาน', icon: Briefcase, color: 'text-blue-500' },
  health: { label: 'สุขภาพ', icon: Heart, color: 'text-pink-500' },
  finance: { label: 'การเงิน', icon: Wallet, color: 'text-green-500' },
  personal: { label: 'ส่วนตัว', icon: User, color: 'text-purple-500' },
  learning: { label: 'การเรียนรู้', icon: BookOpen, color: 'text-orange-500' },
}

export function GoalCard({ goal, onToggleStatus, onEdit, onDelete, isDragOverlay }: GoalCardProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggle = () => {
    if (!goal.status) {
      setShowConfetti(true)
      playCheckSound()
    } else {
      playUncheckSound()
    }
    onToggleStatus(goal.id, !goal.status)
  }

  const priority = priorityConfig[goal.priority || 'medium']
  const PriorityIcon = priority.icon
  const category = categoryConfig[goal.category || 'general']
  const CategoryIcon = category?.icon || Tag

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  const hasTopRow = true // Always show top row for category/priority

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative bg-card border rounded-xl p-3 sm:p-4 shadow-sm transition-all duration-200 flex flex-col justify-center h-full min-h-[60px] sm:min-h-[70px]',
        isDragging && 'opacity-50 scale-95',
        isDragOverlay && 'shadow-2xl rotate-1 scale-105 ring-2 ring-primary/30',
        !isDragging && !isDragOverlay && 'hover:shadow-md',
        goal.status && 'bg-muted/30',
        goal.priority === 'high' && !goal.status && 'border-l-2 border-l-red-400'
      )}
    >
      {/* Confetti - behind content */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-xl z-0">
            <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-1 rounded transition-opacity z-10',
          isHovered || isDragOverlay ? 'opacity-60' : 'opacity-0'
        )}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="ml-6 relative z-10">
        {/* Top Row - Category & Priority badges */}
        {hasTopRow && (
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            {/* Category Badge */}
            <span className={cn('flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted/50', category?.color || 'text-slate-500')}>
              <CategoryIcon className="w-2.5 h-2.5" />
              {category?.label || 'ทั่วไป'}
            </span>
            
            {/* Priority Badge */}
            {PriorityIcon && (
              <span className={cn('flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full', priority.bgColor, priority.color)}>
                <PriorityIcon className="w-2.5 h-2.5" />
              </span>
            )}
            
            {/* Target Date */}
            {goal.target_date && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-2.5 h-2.5" />
                {formatDate(goal.target_date)}
              </span>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex items-center gap-3">
          <button onClick={handleToggle} className="flex-shrink-0 transition-transform hover:scale-110">
            {goal.status ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-muted-foreground/60" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <span className="relative inline">
              <h3 className={cn(
                'font-display text-base leading-snug transition-colors duration-300 inline',
                goal.status ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {goal.title}
              </h3>
              {/* Animated strikethrough line */}
              <motion.span
                initial={false}
                animate={{ 
                  scaleX: goal.status ? 1 : 0,
                  opacity: goal.status ? 1 : 0
                }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="absolute left-0 right-0 top-1/2 h-[2px] bg-muted-foreground/60 origin-left"
                style={{ transform: 'translateY(-50%)' }}
              />
            </span>
            {goal.description && (
              <div className="mt-0.5">
                <span className="relative inline">
                  <p className={cn(
                    'text-sm transition-colors duration-300 inline',
                    goal.status ? 'text-muted-foreground/50' : 'text-muted-foreground'
                  )}>
                    {goal.description}
                  </p>
                  {/* Animated strikethrough for description */}
                  <motion.span
                    initial={false}
                    animate={{ 
                      scaleX: goal.status ? 1 : 0,
                      opacity: goal.status ? 0.6 : 0
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                    className="absolute left-0 right-0 top-1/2 h-[1px] bg-muted-foreground/40 origin-left"
                    style={{ transform: 'translateY(-50%)' }}
                  />
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered && !isDragOverlay ? 1 : 0 }}
        className="absolute right-2 top-2 flex items-center gap-1 bg-card/95 backdrop-blur-sm rounded-lg p-1 shadow-sm border z-20"
      >
        <button onClick={() => onEdit(goal)} className="p-1.5 rounded-md hover:bg-accent transition-colors">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-500" />
        </button>
      </motion.div>
    </div>
  )
}

export function GoalCardOverlay({ goal }: { goal: Goal }) {
  return (
    <GoalCard
      goal={goal}
      onToggleStatus={() => {}}
      onEdit={() => {}}
      onDelete={() => {}}
      isDragOverlay
    />
  )
}
