import 'server-only'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { getDb, schema } from '@/server/db'
import type { GoalRow } from '@/server/db/schema'
import type { Goal } from '@/lib/types'

export function serializeGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    position: row.position,
    year: row.year,
    target_date: row.targetDate,
    subtasks: row.subtasks ?? [],
    completed_at: row.completedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }
}

const g = schema.goals

export async function listGoals(userId: string, year?: number) {
  const where = year ? and(eq(g.userId, userId), eq(g.year, year)) : eq(g.userId, userId)
  const rows = await getDb().select().from(g).where(where).orderBy(asc(g.year), asc(g.position), asc(g.createdAt))
  return rows.map(serializeGoal)
}

export async function listYears(userId: string): Promise<number[]> {
  const rows = await getDb().selectDistinct({ year: g.year }).from(g).where(eq(g.userId, userId))
  return rows.map((r) => r.year)
}

export async function nextPosition(userId: string, year: number): Promise<number> {
  const [row] = await getDb()
    .select({ max: sql<number | null>`max(${g.position})` })
    .from(g)
    .where(and(eq(g.userId, userId), eq(g.year, year)))
  return (row?.max ?? -1) + 1
}

export async function findOwnedGoal(userId: string, id: string) {
  const [row] = await getDb()
    .select()
    .from(g)
    .where(and(eq(g.id, id), eq(g.userId, userId)))
    .limit(1)
  return row ?? null
}

export async function reorderGoals(userId: string, ids: string[]) {
  const db = getDb()
  await db.transaction(async (tx) => {
    const owned = await tx
      .select({ id: g.id })
      .from(g)
      .where(and(eq(g.userId, userId), inArray(g.id, ids)))
    const ownedIds = new Set(owned.map((r) => r.id))
    let position = 0
    for (const id of ids) {
      if (!ownedIds.has(id)) continue
      await tx.update(g).set({ position }).where(eq(g.id, id))
      position += 1
    }
  })
}
