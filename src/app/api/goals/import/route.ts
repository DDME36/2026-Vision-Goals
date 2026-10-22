import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/server/db'
import { json, readJson, requireUser, route } from '@/server/http'
import { importGoalSchema, importSchema } from '@/lib/validation'

// Accepts `{ goals: [...] }` from an export file, the old Supabase table or guest mode.
// Goals with the same title in the same year are skipped so re-importing is safe.
export const POST = route(async (request) => {
  const user = await requireUser()
  const { goals: raw } = await readJson(request, importSchema)

  const parsed = raw.flatMap((item) => {
    const result = importGoalSchema.safeParse(item)
    return result.success ? [result.data] : []
  })
  const invalid = raw.length - parsed.length

  const result = await getDb().transaction(async (tx) => {
    const existing = await tx
      .select({ title: schema.goals.title, year: schema.goals.year, position: schema.goals.position })
      .from(schema.goals)
      .where(eq(schema.goals.userId, user.id))
    const seen = new Set(existing.map((g) => `${g.year}:${g.title.toLowerCase()}`))
    const nextPos = new Map<number, number>()
    for (const g of existing) nextPos.set(g.year, Math.max(nextPos.get(g.year) ?? 0, g.position + 1))

    let added = 0
    let skipped = 0
    const sorted = [...parsed].sort((a, b) => a.year - b.year || a.position - b.position)
    for (const g of sorted) {
      const key = `${g.year}:${g.title.toLowerCase()}`
      if (seen.has(key)) {
        skipped += 1
        continue
      }
      seen.add(key)
      const position = nextPos.get(g.year) ?? 0
      nextPos.set(g.year, position + 1)
      await tx.insert(schema.goals).values({
        userId: user.id,
        title: g.title,
        description: g.description,
        status: g.status,
        priority: g.priority,
        category: g.category,
        year: g.year,
        position,
        targetDate: g.target_date,
        subtasks: g.subtasks,
        completedAt: g.status ? new Date() : null,
        ...(g.created_at && { createdAt: new Date(g.created_at) }),
      })
      added += 1
    }
    return { added, skipped }
  })

  return json({ ...result, invalid })
})
