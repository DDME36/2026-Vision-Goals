import { importGoalSchema } from '@/lib/validation'
import type { Goal } from '@/lib/types'
import type { GoalsRepository } from './types'

// Same key as the previous version so existing guest data keeps working.
const STORAGE_KEY = 'goals-2026-local'
const GUEST_FLAG_KEY = 'vg-guest-mode'

export const guestMode = {
  isOn: () => safeGet(GUEST_FLAG_KEY) === 'true' || safeGet('goals-2026-offline-mode') === 'true',
  set(on: boolean) {
    try {
      if (on) localStorage.setItem(GUEST_FLAG_KEY, 'true')
      else {
        localStorage.removeItem(GUEST_FLAG_KEY)
        localStorage.removeItem('goals-2026-offline-mode')
      }
    } catch {
      /* storage unavailable */
    }
  },
}

function safeGet(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function normalize(raw: Record<string, unknown>): Goal | null {
  const parsed = importGoalSchema.safeParse(raw)
  if (!parsed.success) return null
  const now = new Date().toISOString()
  const g = parsed.data
  return {
    id: typeof raw.id === 'string' ? raw.id : `local-${crypto.randomUUID()}`,
    title: g.title,
    description: g.description,
    status: g.status,
    priority: g.priority,
    category: g.category,
    position: g.position,
    year: g.year,
    target_date: g.target_date,
    subtasks: g.subtasks,
    completed_at: typeof raw.completed_at === 'string' ? raw.completed_at : null,
    created_at: g.created_at ?? now,
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : now,
  }
}

function load(): Goal[] {
  const raw = safeGet(STORAGE_KEY)
  if (!raw) return []
  try {
    const items = JSON.parse(raw)
    return Array.isArray(items) ? items.flatMap((item) => normalize(item) ?? []) : []
  } catch {
    return []
  }
}

function save(goals: Goal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
  } catch {
    throw new Error('พื้นที่จัดเก็บในเครื่องเต็มหรือถูกปิดใช้งาน')
  }
}

export const hasLocalGoals = () => load().length > 0
export const clearLocalGoals = () => save([])
export const loadAllLocalGoals = load

export const localRepository: GoalsRepository = {
  kind: 'local',

  async list(year) {
    const all = load()
    return {
      goals: all.filter((g) => g.year === year).sort((a, b) => a.position - b.position),
      years: [...new Set(all.map((g) => g.year))],
    }
  },

  async create(input) {
    const goals = load()
    const now = new Date().toISOString()
    const position = Math.max(-1, ...goals.filter((g) => g.year === input.year).map((g) => g.position)) + 1
    const goal: Goal = {
      ...input,
      id: `local-${crypto.randomUUID()}`,
      status: false,
      position,
      completed_at: null,
      created_at: now,
      updated_at: now,
    }
    save([...goals, goal])
    return goal
  },

  async update(id, patch) {
    const goals = load()
    const index = goals.findIndex((g) => g.id === id)
    if (index === -1) throw new Error('ไม่พบเป้าหมายนี้')
    const prev = goals[index]
    const next: Goal = { ...prev, ...patch, updated_at: new Date().toISOString() }
    if (patch.status !== undefined && patch.status !== prev.status) {
      next.completed_at = patch.status ? new Date().toISOString() : null
    }
    if (patch.year !== undefined && patch.year !== prev.year) {
      next.position = Math.max(-1, ...goals.filter((g) => g.year === patch.year).map((g) => g.position)) + 1
    }
    goals[index] = next
    save(goals)
    return next
  },

  async remove(id) {
    save(load().filter((g) => g.id !== id))
  },

  async reorder(ids) {
    const order = new Map(ids.map((id, i) => [id, i]))
    save(load().map((g) => (order.has(g.id) ? { ...g, position: order.get(g.id)! } : g)))
  },

  async exportAll() {
    return { app: 'vision-goals', version: 1, exported_at: new Date().toISOString(), goals: load() }
  },

  async importGoals(items) {
    const goals = load()
    const seen = new Set(goals.map((g) => `${g.year}:${g.title.toLowerCase()}`))
    let added = 0
    let skipped = 0
    let invalid = 0
    for (const item of items) {
      const goal = item && typeof item === 'object' ? normalize(item as Record<string, unknown>) : null
      if (!goal) {
        invalid += 1
        continue
      }
      const key = `${goal.year}:${goal.title.toLowerCase()}`
      if (seen.has(key)) {
        skipped += 1
        continue
      }
      seen.add(key)
      goals.push({ ...goal, id: `local-${crypto.randomUUID()}` })
      added += 1
    }
    save(goals)
    return { added, skipped, invalid }
  },
}
