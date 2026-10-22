// Shared domain types used by both the server and the client.

export type Priority = 'high' | 'medium' | 'low'

export interface SubTask {
  id: string
  title: string
  completed: boolean
}

export interface Goal {
  id: string
  title: string
  description: string
  status: boolean
  priority: Priority
  category: string
  position: number
  year: number
  target_date: string | null
  subtasks: SubTask[]
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface AppUser {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isGuest?: boolean
}

/** Fields a user can set when creating or editing a goal. */
export interface GoalInput {
  title: string
  description: string
  category: string
  priority: Priority
  target_date: string | null
  subtasks: SubTask[]
}

export type GoalPatch = Partial<GoalInput & { status: boolean }>

export interface GoalsExport {
  app: 'vision-goals'
  version: 1
  exported_at: string
  goals: Goal[]
}
