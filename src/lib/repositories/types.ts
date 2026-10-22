import type { Goal, GoalInput, GoalPatch, GoalsExport } from '@/lib/types'

export interface ImportResult {
  added: number
  skipped: number
  invalid: number
}

/** Storage-agnostic goal operations — implemented by the server API and by localStorage (guest mode). */
export interface GoalsRepository {
  kind: 'remote' | 'local'
  list(year: number): Promise<{ goals: Goal[]; years: number[] }>
  create(input: GoalInput & { year: number }): Promise<Goal>
  update(id: string, patch: GoalPatch & { year?: number }): Promise<Goal>
  remove(id: string): Promise<void>
  reorder(ids: string[]): Promise<void>
  exportAll(): Promise<GoalsExport>
  importGoals(goals: unknown[]): Promise<ImportResult>
}
