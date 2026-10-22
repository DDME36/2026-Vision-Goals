import { listGoals } from '@/server/goals'
import { requireUser, route } from '@/server/http'
import type { GoalsExport } from '@/lib/types'

export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  const user = await requireUser()
  const payload: GoalsExport = {
    app: 'vision-goals',
    version: 1,
    exported_at: new Date().toISOString(),
    goals: await listGoals(user.id),
  }
  const date = payload.exported_at.slice(0, 10)
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="vision-goals-${date}.json"`,
      'Cache-Control': 'no-store',
    },
  })
})
