import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/server/db'
import { findOwnedGoal, nextPosition, serializeGoal } from '@/server/goals'
import { ApiError, json, readJson, requireUser, route } from '@/server/http'
import { updateGoalSchema } from '@/lib/validation'

type Params = { id: string }

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function loadGoal(userId: string, id: string) {
  const goal = UUID_RE.test(id) ? await findOwnedGoal(userId, id) : null
  if (!goal) throw new ApiError(404, 'ไม่พบเป้าหมายนี้', 'NOT_FOUND')
  return goal
}

export const PATCH = route<Params>(async (request, { params }) => {
  const user = await requireUser()
  const { id } = await params
  const existing = await loadGoal(user.id, id)
  const patch = await readJson(request, updateGoalSchema)

  const statusChanged = patch.status !== undefined && patch.status !== existing.status
  const yearChanged = patch.year !== undefined && patch.year !== existing.year

  const [row] = await getDb()
    .update(schema.goals)
    .set({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.category !== undefined && { category: patch.category }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
      ...(patch.target_date !== undefined && { targetDate: patch.target_date }),
      ...(patch.subtasks !== undefined && { subtasks: patch.subtasks }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(statusChanged && { completedAt: patch.status ? new Date() : null }),
      ...(yearChanged && { year: patch.year, position: await nextPosition(user.id, patch.year!) }),
      updatedAt: new Date(),
    })
    .where(eq(schema.goals.id, existing.id))
    .returning()

  return json({ goal: serializeGoal(row) })
})

export const DELETE = route<Params>(async (_request, { params }) => {
  const user = await requireUser()
  const { id } = await params
  const existing = await loadGoal(user.id, id)
  await getDb().delete(schema.goals).where(eq(schema.goals.id, existing.id))
  return json({ ok: true })
})
