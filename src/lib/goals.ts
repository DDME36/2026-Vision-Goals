import { getPriority, type SortKey, type StatusFilter } from './constants'
import type { Goal } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

/** 0–1 progress of a single goal: done = 1, otherwise share of finished subtasks. */
export function goalProgress(goal: Goal): number {
  if (goal.status) return 1
  if (!goal.subtasks.length) return 0
  return goal.subtasks.filter((s) => s.completed).length / goal.subtasks.length
}

export type DueState = 'overdue' | 'soon' | 'upcoming' | null

/** Days until the target date (negative when overdue), based on the local calendar day. */
export function daysUntil(dateStr: string, now = new Date()): number {
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((target - today) / DAY_MS)
}

export function dueState(goal: Goal, now = new Date()): DueState {
  if (!goal.target_date || goal.status) return null
  const days = daysUntil(goal.target_date, now)
  if (days < 0) return 'overdue'
  if (days <= 14) return 'soon'
  return 'upcoming'
}

export function formatDue(goal: Goal, now = new Date()): string | null {
  if (!goal.target_date) return null
  const label = new Date(`${goal.target_date}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  if (goal.status) return label
  const days = daysUntil(goal.target_date, now)
  if (days < 0) return `เลยกำหนด ${-days} วัน`
  if (days === 0) return 'ครบกำหนดวันนี้'
  if (days === 1) return 'พรุ่งนี้'
  if (days <= 14) return `อีก ${days} วัน`
  return label
}

export interface GoalFilters {
  query: string
  status: StatusFilter
  category: string | null
  priority: string | null
}

export const EMPTY_FILTERS: GoalFilters = { query: '', status: 'all', category: null, priority: null }

export const hasActiveFilters = (f: GoalFilters) => Boolean(f.query.trim() || f.status !== 'all' || f.category || f.priority)

export function filterGoals(goals: Goal[], f: GoalFilters): Goal[] {
  const q = f.query.trim().toLowerCase()
  return goals.filter((g) => {
    if (f.status === 'active' && g.status) return false
    if (f.status === 'done' && !g.status) return false
    if (f.category && g.category !== f.category) return false
    if (f.priority && g.priority !== f.priority) return false
    if (q) {
      const haystack = [g.title, g.description, ...g.subtasks.map((s) => s.title)].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}

export function sortGoals(goals: Goal[], sortBy: SortKey): Goal[] {
  const list = [...goals]
  switch (sortBy) {
    case 'priority':
      return list.sort((a, b) => getPriority(a.priority).order - getPriority(b.priority).order || a.position - b.position)
    case 'target_date':
      return list.sort((a, b) => {
        if (!a.target_date) return b.target_date ? 1 : 0
        if (!b.target_date) return -1
        return a.target_date.localeCompare(b.target_date)
      })
    case 'progress':
      return list.sort((a, b) => goalProgress(b) - goalProgress(a))
    case 'created_at':
      return list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    default:
      return list.sort((a, b) => a.position - b.position)
  }
}

export interface GoalStats {
  total: number
  done: number
  active: number
  highPriority: number
  overdue: number
  dueSoon: number
  percent: number
  /** Weighted progress including partially done subtasks (0-100). */
  weightedPercent: number
}

export function computeStats(goals: Goal[], now = new Date()): GoalStats {
  const done = goals.filter((g) => g.status).length
  const weighted = goals.reduce((sum, g) => sum + goalProgress(g), 0)
  return {
    total: goals.length,
    done,
    active: goals.length - done,
    highPriority: goals.filter((g) => g.priority === 'high' && !g.status).length,
    overdue: goals.filter((g) => dueState(g, now) === 'overdue').length,
    dueSoon: goals.filter((g) => dueState(g, now) === 'soon').length,
    percent: goals.length ? Math.round((done / goals.length) * 100) : 0,
    weightedPercent: goals.length ? Math.round((weighted / goals.length) * 100) : 0,
  }
}

/** Share of the given year that has elapsed (0-100). */
export function yearElapsedPercent(year: number, now = new Date()): number {
  const start = new Date(year, 0, 1).getTime()
  const end = new Date(year + 1, 0, 1).getTime()
  const t = now.getTime()
  if (t <= start) return 0
  if (t >= end) return 100
  return Math.round(((t - start) / (end - start)) * 100)
}

export type Pace = 'ahead' | 'on-track' | 'behind' | 'not-started' | 'done'

/** Compares goal progress with how much of the year has passed. */
export function computePace(stats: GoalStats, year: number, now = new Date()): Pace {
  if (!stats.total) return 'not-started'
  if (stats.done === stats.total) return 'done'
  const elapsed = yearElapsedPercent(year, now)
  if (elapsed === 0) return 'not-started'
  const diff = stats.weightedPercent - elapsed
  if (diff >= 10) return 'ahead'
  if (diff >= -10) return 'on-track'
  return 'behind'
}

export function motivationalMessage(stats: GoalStats): string {
  if (stats.total === 0) return 'เริ่มต้นด้วยการเพิ่มเป้าหมายแรกของคุณ'
  if (stats.percent === 100) return 'สุดยอด! ทำได้ครบทุกเป้าหมายแล้ว 🎉'
  if (stats.percent >= 75) return 'ใกล้ถึงเส้นชัยแล้ว อีกนิดเดียว ⭐'
  if (stats.percent >= 50) return 'เกินครึ่งทางแล้ว ไปต่อเลย 🚀'
  if (stats.percent >= 25) return 'กำลังมาได้สวย รักษาจังหวะไว้ 🔥'
  if (stats.percent > 0) return 'เริ่มต้นได้ดีมาก ก้าวต่อไปเลย 💪'
  return 'ทุกความสำเร็จเริ่มจากก้าวแรกเสมอ ✨'
}

export function categoryBreakdown(goals: Goal[]) {
  const map = new Map<string, { total: number; done: number }>()
  for (const g of goals) {
    const entry = map.get(g.category) ?? { total: 0, done: 0 }
    entry.total += 1
    if (g.status) entry.done += 1
    map.set(g.category, entry)
  }
  return [...map.entries()].map(([key, v]) => ({ key, ...v })).sort((a, b) => b.total - a.total)
}

export function extractLinks(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g)
}
