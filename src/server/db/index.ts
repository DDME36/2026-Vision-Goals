import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/server/env'
import * as schema from './schema'

type Db = ReturnType<typeof drizzle<typeof schema>>

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __db?: Db; __sql?: postgres.Sql }

function createDb() {
  const sql = postgres(env.databaseUrl, {
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 30,
    connect_timeout: 10,
    onnotice: () => {},
  })
  globalForDb.__sql = sql
  return drizzle(sql, { schema })
}

export function getDb(): Db {
  if (!globalForDb.__db) globalForDb.__db = createDb()
  return globalForDb.__db
}

export function getSql(): postgres.Sql {
  getDb()
  return globalForDb.__sql!
}

export { schema }
