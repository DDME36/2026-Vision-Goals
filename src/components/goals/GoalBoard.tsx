'use client'

import { useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, SearchX, Sparkles } from 'lucide-react'
import type { Goal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { GoalGridSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { Button } from '@/components/ui/button'
import { GoalCard, type GoalCardActions } from './GoalCard'

export type ViewMode = 'grid' | 'list'

interface GoalBoardProps extends GoalCardActions {
  goals: Goal[]
  loading: boolean
  view: ViewMode
  canReorder: boolean
  filtering: boolean
  year: number
  onReorder: (goals: Goal[]) => void
  onAdd: () => void
  onClearFilters: () => void
}

export function GoalBoard({ goals, loading, view, canReorder, filtering, year, onReorder, onAdd, onClearFilters, ...actions }: GoalBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Long-press on touch so scrolling still works.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  if (loading) return <GoalGridSkeleton />

  if (goals.length === 0) {
    return filtering ? (
      <EmptyState
        icon={<SearchX />}
        title="ไม่พบเป้าหมายที่ตรงกับตัวกรอง"
        text="ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองทั้งหมด"
        action={<Button variant="outline" onClick={onClearFilters}>ล้างตัวกรอง</Button>}
      />
    ) : (
      <EmptyState
        icon={<Sparkles />}
        title={`เริ่มต้นปี ${year} ด้วยเป้าหมายแรก`}
        text="เขียนสิ่งที่อยากทำให้สำเร็จ แล้วแตกเป็นขั้นตอนเล็ก ๆ ที่ทำได้จริง"
        action={
          <Button variant="brand" size="lg" onClick={onAdd}>
            <Plus />
            เพิ่มเป้าหมาย
          </Button>
        }
      />
    )
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const from = goals.findIndex((g) => g.id === active.id)
    const to = goals.findIndex((g) => g.id === over.id)
    if (from !== -1 && to !== -1) onReorder(arrayMove(goals, from, to))
  }

  const activeGoal = goals.find((g) => g.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={goals.map((g) => g.id)} strategy={view === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        <motion.div
          layout
          className={cn('mt-5', view === 'grid' ? 'grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-2')}
        >
          <AnimatePresence initial={false}>
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                layout={!activeId}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <GoalCard goal={goal} variant={view} sortable={canReorder} {...actions} />
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            onClick={onAdd}
            className={cn(
              'flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:bg-brand/4 hover:text-brand',
              view === 'grid' ? 'min-h-30' : 'py-3',
            )}
          >
            <Plus className="size-4" />
            เพิ่มเป้าหมาย
          </button>
        </motion.div>
      </SortableContext>
      {!canReorder && goals.length > 1 && (
        <p className="mt-3 text-center text-xs text-muted-foreground">ลากเพื่อจัดลำดับได้เมื่อเรียงแบบ “ลำดับที่จัดเอง” และไม่มีตัวกรอง</p>
      )}
      <DragOverlay dropAnimation={{ duration: 180 }}>
        {activeGoal && <GoalCard goal={activeGoal} variant={view} sortable={false} overlay {...actions} />}
      </DragOverlay>
    </DndContext>
  )
}

function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 flex flex-col items-center rounded-3xl border border-dashed px-6 py-16 text-center"
    >
      <div className="mb-5 flex size-16 animate-float items-center justify-center rounded-2xl bg-brand/10 text-brand [&_svg]:size-7">{icon}</div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
      <div className="mt-6">{action}</div>
    </motion.div>
  )
}
