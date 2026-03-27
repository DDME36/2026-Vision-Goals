'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Circle, CheckCircle2, Pencil, Trash2, Flame, Calendar, Minus, ArrowDown, Briefcase, Heart, Wallet, User, BookOpen, Tag, ChevronDown, Square, CheckSquare, FastForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Goal, SubTask } from '@/lib/supabase'
import { ConfettiEffect } from './ConfettiEffect'
import { playCheckSound, playUncheckSound } from '@/lib/sounds'

interface GoalCardProps {
  goal: Goal
  onToggleStatus: (id: string, status: boolean) => void
  onEdit: (goal: Goal) => void
  onDelete: (id: string) => void
  onUpdateSubtasks?: (goalId: string, subtasks: SubTask[]) => void
  onRollover?: (goal: Goal) => void
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

export function GoalCard({ goal, onToggleStatus, onEdit, onDelete, onUpdateSubtasks, onRollover, isDragOverlay }: GoalCardProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)

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

  const handleSubtaskToggle = (subtaskId: string) => {
    if (!onUpdateSubtasks || !goal.subtasks) return
    const updated = goal.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    onUpdateSubtasks(goal.id, updated)
  }

  const priority = priorityConfig[goal.priority || 'medium']
  const PriorityIcon = priority.icon
  const category = categoryConfig[goal.category || 'general']
  const CategoryIcon = category?.icon || Tag

  const subtasks = goal.subtasks || []
  const completedSubtasks = subtasks.filter(s => s.completed).length
  const hasSubtasks = subtasks.length > 0
  const subtaskPercent = hasSubtasks ? Math.round((completedSubtasks / subtasks.length) * 100) : 0

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  // Parse URLs in text and return array of React nodes
  const renderDescriptionWithLinks = (text: string) => {
    // Regex matches http:// or https:// followed by non-whitespace chars
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {part.length > 30 ? part.substring(0, 30) + '...' : part}
          </a>
        );
      }
      return part;
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowActions(false) }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        const isButton = target.closest('button')
        if (!isButton && !isDragOverlay) {
          setShowActions(prev => !prev)
        }
      }}
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

          {/* Subtask Progress Badge */}
          {hasSubtasks && (
            <span className={cn(
              'flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full',
              completedSubtasks === subtasks.length ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
            )}>
              {completedSubtasks}/{subtasks.length} tasks
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggle} 
            onPointerDown={(e) => e.stopPropagation()}
            className="flex-shrink-0 transition-transform hover:scale-110 touch-manipulation"
          >
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
                    {renderDescriptionWithLinks(goal.description)}
                  </p>
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

        {/* Subtask Mini Progress Bar */}
        {hasSubtasks && (
          <div className="mt-2 space-y-1.5">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${subtaskPercent}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={cn(
                  'h-full rounded-full',
                  completedSubtasks === subtasks.length ? 'bg-green-500' : 'bg-blue-400'
                )}
              />
            </div>

            {/* Expand/Collapse Subtasks */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowSubtasks(prev => !prev) }}
              onPointerDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            >
              <ChevronDown className={cn('w-3 h-3 transition-transform', showSubtasks && 'rotate-180')} />
              {showSubtasks ? 'ซ่อน' : 'ดูรายการย่อย'}
            </button>

            <AnimatePresence>
              {showSubtasks && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  {subtasks.map(st => (
                    <button
                      key={st.id}
                      onClick={(e) => { e.stopPropagation(); handleSubtaskToggle(st.id) }}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 w-full text-left p-1 rounded hover:bg-muted/50 transition-colors touch-manipulation"
                    >
                      {st.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      <span className={cn(
                        'text-xs truncate',
                        st.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                      )}>
                        {st.title}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Actions - visible on hover (desktop) and tap (mobile) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: (isHovered || showActions) && !isDragOverlay ? 1 : 0 }}
        className="absolute right-2 top-2 flex items-center gap-1 bg-card/95 backdrop-blur-sm rounded-lg p-1 shadow-sm border z-20"
      >
        {onRollover && !goal.status && (
          <button 
            onClick={() => onRollover(goal)} 
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-md hover:bg-blue-50 transition-colors touch-manipulation"
            title="ยกยอดไปปีหน้า"
          >
            <FastForward className="w-3.5 h-3.5 text-blue-500" />
          </button>
        )}
        <button 
          onClick={() => onEdit(goal)} 
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-md hover:bg-accent transition-colors touch-manipulation"
          title="แก้ไข"
        >
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <button 
          onClick={() => onDelete(goal.id)} 
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1.5 rounded-md hover:bg-red-50 transition-colors touch-manipulation"
          title="ลบ"
        >
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
