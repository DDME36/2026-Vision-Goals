import { api } from '@/lib/api-client'
import type { Goal, GoalsExport } from '@/lib/types'
import type { GoalsRepository, ImportResult } from './types'

export const remoteRepository: GoalsRepository = {
  kind: 'remote',

  list: (year) => api(`/api/goals?year=${year}`),

  async create(input) {
    const { goal } = await api<{ goal: Goal }>('/api/goals', { method: 'POST', json: input })
    return goal
  },

  async update(id, patch) {
    const { goal } = await api<{ goal: Goal }>(`/api/goals/${id}`, { method: 'PATCH', json: patch })
    return goal
  },

  async remove(id) {
    await api(`/api/goals/${id}`, { method: 'DELETE' })
  },

  async reorder(ids) {
    await api('/api/goals/reorder', { method: 'POST', json: { ids } })
  },

  exportAll: () => api<GoalsExport>('/api/goals/export'),

  importGoals: (goals) => api<ImportResult>('/api/goals/import', { method: 'POST', json: { goals } }),
}
