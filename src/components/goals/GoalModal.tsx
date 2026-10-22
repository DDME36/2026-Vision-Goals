'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, Reorder } from 'framer-motion'
import { GripVertical, Plus, Target, X } from 'lucide-react'
import { CATEGORIES, LIMITS, PRIORITIES } from '@/lib/constants'
import type { Goal, GoalInput, Priority, SubTask } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input, Label, Textarea } from '@/components/ui/input'

interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: Goal | null
  year: number
  /** Resolves true when saved so the dialog can close. */
  onSave: (input: GoalInput) => Promise<boolean>
}

const empty = (): GoalInput => ({
  title: '',
  description: '',
  category: 'general',
  priority: 'medium',
  target_date: null,
  subtasks: [],
})

function Counter({ value, max }: { value: number; max: number }) {
  return <span className={cn('text-xs tabular-nums', value > max * 0.9 ? 'text-danger' : 'text-muted-foreground')}>{value}/{max}</span>
}

export function GoalModal({ open, onOpenChange, goal, year, onSave }: GoalModalProps) {
  const [form, setForm] = useState<GoalInput>(empty)
  const [newSubtask, setNewSubtask] = useState('')
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      goal
        ? {
            title: goal.title,
            description: goal.description,
            category: goal.category,
            priority: goal.priority,
            target_date: goal.target_date,
            subtasks: goal.subtasks,
          }
        : empty(),
    )
    setNewSubtask('')
    setTouched(false)
  }, [open, goal])

  const set = <K extends keyof GoalInput>(key: K, value: GoalInput[K]) => setForm((f) => ({ ...f, [key]: value }))

  const addSubtask = () => {
    const title = newSubtask.trim().slice(0, LIMITS.subtaskTitle)
    if (!title || form.subtasks.length >= LIMITS.subtasks) return
    set('subtasks', [...form.subtasks, { id: crypto.randomUUID(), title, completed: false }])
    setNewSubtask('')
  }

  const updateSubtask = (id: string, patch: Partial<SubTask>) =>
    set('subtasks', form.subtasks.map((s) => (s.id === id ? { ...s, ...patch } : s)))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!form.title.trim()) return
    setSaving(true)
    // Include a subtask typed but not yet added with Enter.
    const pending = newSubtask.trim()
    const subtasks = (pending ? [...form.subtasks, { id: crypto.randomUUID(), title: pending, completed: false }] : form.subtasks)
      .map((s) => ({ ...s, title: s.title.trim() }))
      .filter((s) => s.title)
    const ok = await onSave({ ...form, title: form.title.trim(), description: form.description.trim(), subtasks })
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  const titleError = touched && !form.title.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader icon={<Target />}>
          <DialogTitle>{goal ? 'แก้ไขเป้าหมาย' : `เป้าหมายใหม่ปี ${year}`}</DialogTitle>
          <DialogDescription>{goal ? 'ปรับรายละเอียดให้ชัดขึ้นได้ตลอด' : 'อยากทำอะไรให้สำเร็จในปีนี้?'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-title">ชื่อเป้าหมาย</Label>
              <Counter value={form.title.length} max={LIMITS.title} />
            </div>
            <Input
              id="goal-title"
              value={form.title}
              onChange={(e) => set('title', e.target.value.slice(0, LIMITS.title))}
              placeholder="เช่น วิ่งมาราธอนครั้งแรก"
              className="h-12 font-display text-lg"
              aria-invalid={titleError}
              autoFocus
            />
            {titleError && <p className="text-xs text-danger">กรุณากรอกชื่อเป้าหมาย</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-desc">รายละเอียด <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span></Label>
              <Counter value={form.description.length} max={LIMITS.description} />
            </div>
            <Textarea
              id="goal-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value.slice(0, LIMITS.description))}
              placeholder="ทำไมเป้าหมายนี้สำคัญ วัดผลยังไง หรือแปะลิงก์ที่เกี่ยวข้อง"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>ความสำคัญ</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITIES.map((p) => {
                  const Icon = p.icon
                  const on = form.priority === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => set('priority', p.key as Priority)}
                      aria-pressed={on}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border py-2 text-xs font-medium transition-colors',
                        on ? cn(p.soft, p.text, 'border-current') : 'text-muted-foreground hover:bg-accent',
                      )}
                    >
                      <Icon className="size-4" />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal-date">กำหนดเสร็จ <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span></Label>
              <div className="relative">
                <Input
                  id="goal-date"
                  type="date"
                  value={form.target_date ?? ''}
                  onChange={(e) => set('target_date', e.target.value || null)}
                  min={`${year}-01-01`}
                  max={`${year}-12-31`}
                  className="h-[58px]"
                />
                {form.target_date && (
                  <button
                    type="button"
                    onClick={() => set('target_date', null)}
                    className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="ล้างวันที่"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>หมวดหมู่</Label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const Icon = c.icon
                const on = form.category === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => set('category', c.key)}
                    aria-pressed={on}
                    className={cn('chip', on ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground hover:bg-accent')}
                  >
                    <Icon className={cn('size-3.5', !on && c.text)} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>ขั้นตอนย่อย <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span></Label>
              {form.subtasks.length > 0 && <span className="text-xs text-muted-foreground">{form.subtasks.length}/{LIMITS.subtasks}</span>}
            </div>

            <Reorder.Group axis="y" values={form.subtasks} onReorder={(v) => set('subtasks', v)} className="space-y-1.5">
              <AnimatePresence initial={false}>
                {form.subtasks.map((s) => (
                  <Reorder.Item
                    key={s.id}
                    value={s}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 rounded-xl border bg-background px-2 py-1"
                  >
                    <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing" />
                    <input
                      type="checkbox"
                      checked={s.completed}
                      onChange={(e) => updateSubtask(s.id, { completed: e.target.checked })}
                      className="size-4 shrink-0 accent-[hsl(var(--success))]"
                      aria-label="ทำเสร็จแล้ว"
                    />
                    <input
                      value={s.title}
                      onChange={(e) => updateSubtask(s.id, { title: e.target.value.slice(0, LIMITS.subtaskTitle) })}
                      className={cn('min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none', s.completed && 'text-muted-foreground line-through')}
                    />
                    <button
                      type="button"
                      onClick={() => set('subtasks', form.subtasks.filter((x) => x.id !== s.id))}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                      aria-label="ลบขั้นตอนนี้"
                    >
                      <X className="size-3.5" />
                    </button>
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {form.subtasks.length < LIMITS.subtasks && (
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSubtask()
                    }
                  }}
                  placeholder="เพิ่มขั้นตอน แล้วกด Enter"
                  className="h-10"
                />
                <Button type="button" variant="outline" size="icon" onClick={addSubtask} disabled={!newSubtask.trim()} aria-label="เพิ่มขั้นตอน">
                  <Plus />
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="brand" loading={saving} className="sm:min-w-32">
              {goal ? 'บันทึก' : 'เพิ่มเป้าหมาย'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
