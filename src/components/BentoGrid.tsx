'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Goal } from '@/lib/supabase'
import { GoalCard, GoalCardOverlay } from './GoalCard'
import { AddGoalCard } from './AddGoalCard'

interface BentoGridProps {
  goals: Goal[]
  onReorder: (goals: Goal[]) => void
  onToggleStatus: (id: string, status: boolean) => void
  onEdit: (goal: Goal) => void
  onDelete: (id: string) => void
  onAddNew: () => void
}

export function BentoGrid({
  goals,
  onReorder,
  onToggleStatus,
  onEdit,
  onDelete,
  onAddNew,
}: BentoGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const activeGoal = goals.find(g => g.id === activeId)

  // แยก Sensor สำหรับ Mouse และ Touch
  // Mouse: ลากได้เลยเมื่อขยับ 5px
  // Touch: ต้องกดค้าง 250ms ก่อนถึงจะลากได้ (ป้องกันการแย่ง scroll)
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    
    const { active, over } = event
    if (!over) return
    if (active.id === over.id) return

    const oldIndex = goals.findIndex(g => g.id === active.id)
    const newIndex = goals.findIndex(g => g.id === over.id)
    
    if (oldIndex === -1 || newIndex === -1) return

    const newGoals = arrayMove(goals, oldIndex, newIndex).map((g, i) => ({
      ...g,
      position: i,
    }))
    
    onReorder(newGoals)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={goals.map(g => g.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 auto-rows-fr">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleStatus={onToggleStatus}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          <AddGoalCard onClick={onAddNew} />
        </div>
      </SortableContext>

      <DragOverlay>
        {activeGoal ? <GoalCardOverlay goal={activeGoal} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
