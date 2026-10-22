import { reorderGoals } from '@/server/goals'
import { json, readJson, requireUser, route } from '@/server/http'
import { reorderSchema } from '@/lib/validation'

export const POST = route(async (request) => {
  const user = await requireUser()
  const { ids } = await readJson(request, reorderSchema)
  await reorderGoals(user.id, ids)
  return json({ ok: true })
})
