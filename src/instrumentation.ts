// Runs once when the Next.js server boots. Applies database migrations so a
// fresh Coolify deploy needs no manual step.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.SKIP_MIGRATIONS === 'true' || !process.env.DATABASE_URL) return

  const { runMigrations } = await import('@/server/db/migrate')
  const startedAt = Date.now()
  try {
    await runMigrations()
    console.info(`[db] migrations up to date (${Date.now() - startedAt}ms)`)
  } catch (error) {
    console.error('[db] migration failed', error)
    throw error
  }
}
