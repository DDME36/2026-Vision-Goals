'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, Flame, Minus, ArrowDown, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Goal } from '@/lib/supabase'

interface GoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal | null
  onSave: (data: { 
    title: string
    description: string
    category: string
    priority: 'high' | 'medium' | 'low'
    target_date?: string
  }) => void
}

const categories = [
  { key: 'general', label: 'ทั่วไป' },
  { key: 'career', label: 'การงาน' },
  { key: 'health', label: 'สุขภาพ' },
  { key: 'finance', label: 'การเงิน' },
  { key: 'personal', label: 'ส่วนตัว' },
  { key: 'learning', label: 'การเรียนรู้' },
]

const priorities = [
  { key: 'high', label: 'สำคัญมาก', icon: Flame, color: 'text-red-500 border-red-300 bg-red-50' },
  { key: 'medium', label: 'ปานกลาง', icon: Minus, color: 'text-amber-500 border-amber-300 bg-amber-50' },
  { key: 'low', label: 'ไม่เร่งด่วน', icon: ArrowDown, color: 'text-slate-400 border-slate-300 bg-slate-50' },
]

export function GoalModal({ open, onOpenChange, goal, onSave }: GoalModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [targetDate, setTargetDate] = useState('')
  const [titleError, setTitleError] = useState('')

  const TITLE_MAX_LENGTH = 100
  const DESCRIPTION_MAX_LENGTH = 500

  useEffect(() => {
    if (goal) {
      setTitle(goal.title)
      setDescription(goal.description || '')
      setCategory(goal.category || 'general')
      setPriority(goal.priority || 'medium')
      setTargetDate(goal.target_date || '')
    } else {
      setTitle('')
      setDescription('')
      setCategory('general')
      setPriority('medium')
      setTargetDate('')
    }
  }, [goal, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('กรุณากรอกชื่อเป้าหมาย')
      return
    }
    setTitleError('')
    onSave({ 
      title: title.trim(), 
      description: description.trim(), 
      category,
      priority,
      target_date: targetDate || undefined
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5" />
            {goal ? 'แก้ไขเป้าหมาย' : 'เป้าหมายใหม่สำหรับปี 2026'}
          </DialogTitle>
          <DialogDescription>
            {goal ? 'แก้ไขรายละเอียดเป้าหมายของคุณ' : 'คุณอยากทำอะไรให้สำเร็จในปีนี้?'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 mt-4 overflow-x-hidden">
          {/* Title */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">ชื่อเป้าหมาย</label>
              <span className={`text-xs ${title.length > TITLE_MAX_LENGTH * 0.9 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {title.length}/{TITLE_MAX_LENGTH}
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))
                if (titleError) setTitleError('')
              }}
              placeholder="เช่น เรียนภาษาใหม่"
              className={`font-display text-lg sm:text-xl h-11 sm:h-12 ${titleError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
              autoFocus
              maxLength={TITLE_MAX_LENGTH}
            />
            {titleError && (
              <p className="text-xs text-red-500">{titleError}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">ความสำคัญ</label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {priorities.map((p) => {
                const Icon = p.icon
                return (
                  <motion.button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key as 'high' | 'medium' | 'low')}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border-2 transition-all ${
                      priority === p.key
                        ? p.color + ' border-current font-medium'
                        : 'bg-transparent text-muted-foreground border-border'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{p.label}</span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">รายละเอียด (ไม่บังคับ)</label>
              <span className={`text-xs ${description.length > DESCRIPTION_MAX_LENGTH * 0.9 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {description.length}/{DESCRIPTION_MAX_LENGTH}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, DESCRIPTION_MAX_LENGTH))}
              placeholder="เพิ่มรายละเอียดเกี่ยวกับเป้าหมาย..."
              className="flex min-h-[70px] sm:min-h-[80px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset resize-none transition-all"
              maxLength={DESCRIPTION_MAX_LENGTH}
            />
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">วันที่ตั้งเป้า (ไม่บังคับ)</label>
            <div className="relative flex items-center gap-2">
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min="2026-01-01"
                max="2026-12-31"
                className="h-11 w-full appearance-none pr-10 text-center"
              />
              {targetDate && (
                <button
                  type="button"
                  onClick={() => setTargetDate('')}
                  className="absolute right-2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="ล้างวันที่"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">หมวดหมู่</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat.key}
                  type="button"
                  onClick={() => setCategory(cat.key)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full border transition-colors ${
                    category === cat.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-border'
                  }`}
                >
                  {cat.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 sm:gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-10 sm:h-11">
              ยกเลิก
            </Button>
            <Button type="submit" disabled={!title.trim()} className="px-4 sm:px-6 h-10 sm:h-11">
              {goal ? 'บันทึก' : 'เพิ่มเป้าหมาย'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
