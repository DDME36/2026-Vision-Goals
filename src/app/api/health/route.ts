import { getSql } from '@/server/db'

export const dynamic = 'force-dynamic'

// Used by Docker/Coolify health checks.
export async function GET() {
  const startedAt = Date.now()
  try {
    await getSql()`select 1`
    return Response.json({ status: 'ok', db: 'up', latencyMs: Date.now() - startedAt })
  } catch {
    return Response.json({ status: 'degraded', db: 'down' }, { status: 503 })
  }
}
