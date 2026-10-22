import path from 'node:path'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { getDb } from './index'

/** Applies pending SQL migrations from /drizzle. Safe to run on every boot. */
export async function runMigrations() {
  const migrationsFolder = path.join(process.cwd(), 'drizzle')
  await migrate(getDb(), { migrationsFolder })
}
