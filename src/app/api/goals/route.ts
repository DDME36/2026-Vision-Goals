import { getDb, schema } from '@/server/db'
import { listGoals, listYears, nextPosition, serializeGoal } from '@/server/goals'
import { json, readJson, requireUser, route } from '@/server/http'
import { createGoalSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// GET /api/goals?year=2026 → { goals, years }
export const GET = route(async (request) => {
  const user = await requireUser()
  const yearParam = new URL(request.url).searchParams.get('year')
  const year = yearParam ? Number(yearParam) : undefined
  const [goals, years] = await Promise.all([
    listGoals(user.id, Number.isInteger(year) ? year : undefined),
    listYears(user.id),
  ])
  return json({ goals, years })
})

export const POST = route(async (request) => {
  const user = await requireUser()
  const input = await readJson(request, createGoalSchema)

  const [row] = await getDb()
    .insert(schema.goals)
    .values({
      userId: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      targetDate: input.target_date,
      subtasks: input.subtasks,
      year: input.year,
      position: await nextPosition(user.id, input.year),
    })
    .returning()

  return json({ goal: serializeGoal(row) }, { status: 201 })
})
