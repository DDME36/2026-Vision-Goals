import { getCurrentUser } from '@/server/auth/session'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = route(async () => {
  return json({ user: await getCurrentUser() })
})
