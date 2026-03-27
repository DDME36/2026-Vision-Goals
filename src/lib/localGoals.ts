// localStorage-based goals storage (fallback when Supabase is paused/unavailable)

import { Goal, SubTask } from './supabase'

const STORAGE_KEY = 'goals-2026-local'
const OFFLINE_FLAG_KEY = 'goals-2026-offline-mode'
const MIGRATED_KEY = 'goals-local-migrated-v2'

// Generate a simple UUID
function generateId(): string {
  return 'local-' + crypto.randomUUID()
}

function loadGoals(): Goal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const goals = JSON.parse(raw) as any[]
    
    // Auto-migrate: add year and subtasks fields if missing
    const needsMigration = !localStorage.getItem(MIGRATED_KEY)
    if (needsMigration) {
      const migrated = goals.map(g => ({
        ...g,
        year: g.year || 2026,
        subtasks: g.subtasks || [],
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      localStorage.setItem(MIGRATED_KEY, 'true')
      return migrated
    }
    
    return goals
  } catch {
    return []
  }
}

function saveGoals(goals: Goal[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals))
}

// Check/set offline mode flag
export function isOfflineMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(OFFLINE_FLAG_KEY) === 'true'
}

export function setOfflineMode(value: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(OFFLINE_FLAG_KEY, value ? 'true' : 'false')
}

// Local goals CRUD - same interface as goalsApi
export const localGoalsApi = {
  async getAll(userId: string, year?: number): Promise<Goal[]> {
    let goals = loadGoals().filter(g => g.user_id === userId)
    if (year) {
      goals = goals.filter(g => g.year === year)
    }
    return goals.sort((a, b) => a.position - b.position)
  },

  async getYears(userId: string): Promise<number[]> {
    const goals = loadGoals().filter(g => g.user_id === userId)
    const years = [...new Set(goals.map(g => g.year || 2026))]
    return years.sort((a, b) => b - a) // descending
  },

  async create(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const goals = loadGoals()
    const now = new Date().toISOString()
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      year: goal.year || new Date().getFullYear(),
      subtasks: goal.subtasks || [],
      created_at: now,
      updated_at: now,
    }
    goals.push(newGoal)
    saveGoals(goals)
    return newGoal
  },

  async update(id: string, updates: Partial<Goal>): Promise<Goal> {
    const goals = loadGoals()
    const index = goals.findIndex(g => g.id === id)
    if (index === -1) throw new Error('Goal not found')
    
    goals[index] = { 
      ...goals[index], 
      ...updates, 
      updated_at: new Date().toISOString() 
    }
    saveGoals(goals)
    return goals[index]
  },

  async delete(id: string): Promise<void> {
    const goals = loadGoals().filter(g => g.id !== id)
    saveGoals(goals)
  },

  async updatePositions(updates: { id: string; position: number }[]): Promise<void> {
    const goals = loadGoals()
    updates.forEach(({ id, position }) => {
      const goal = goals.find(g => g.id === id)
      if (goal) goal.position = position
    })
    saveGoals(goals)
  },

  // Export all goals as JSON
  exportAllGoals(): Goal[] {
    return loadGoals()
  },

  // Import goals from JSON (merge - skip duplicates by id)
  importGoals(importedGoals: Goal[]): { added: number; skipped: number } {
    const existing = loadGoals()
    const existingIds = new Set(existing.map(g => g.id))
    let added = 0
    let skipped = 0

    importedGoals.forEach(goal => {
      // Ensure required fields
      const g: Goal = {
        ...goal,
        year: goal.year || 2026,
        subtasks: goal.subtasks || [],
      }
      if (existingIds.has(g.id)) {
        skipped++
      } else {
        existing.push(g)
        existingIds.add(g.id)
        added++
      }
    })

    saveGoals(existing)
    return { added, skipped }
  }
}

// Guest user for offline mode (no auth required)
export const GUEST_USER = {
  id: 'local-guest-user',
  email: 'guest@local.app',
  user_metadata: {
    full_name: 'Guest',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}
