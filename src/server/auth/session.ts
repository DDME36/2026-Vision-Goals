import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, lt, ne } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { getDb, schema } from '@/server/db'
import { env } from '@/server/env'
import type { AppUser } from '@/lib/types'
import type { UserRow } from '@/server/db/schema'

export const SESSION_COOKIE = 'vg_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
// Extend the session when less than this much time is left (sliding expiry).
const RENEW_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export function toAppUser(row: UserRow): AppUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
  }
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.secureCookies,
    path: '/',
    expires: expiresAt,
  })
}

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
  const db = getDb()
  await db.insert(schema.sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    userAgent: userAgent?.slice(0, 255) ?? null,
  })
  // Opportunistic cleanup keeps the table small without a cron job.
  await db.delete(schema.sessions).where(lt(schema.sessions.expiresAt, new Date()))
  await setSessionCookie(token, expiresAt)
}

/** Returns the signed-in user for this request, or null. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const db = getDb()
  const sessionId = hashToken(token)
  const [row] = await db
    .select({ session: schema.sessions, user: schema.users })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, sessionId), gt(schema.sessions.expiresAt, new Date())))
    .limit(1)

  if (!row) return null

  if (row.session.expiresAt.getTime() - Date.now() < RENEW_THRESHOLD_MS) {
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    await db.update(schema.sessions).set({ expiresAt }).where(eq(schema.sessions.id, sessionId))
    try {
      await setSessionCookie(token, expiresAt)
    } catch {
      // Cookies are read-only during Server Component rendering; the next API call renews it.
    }
  }

  return toAppUser(row.user)
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (token) {
    await getDb().delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token)))
  }
  store.delete(SESSION_COOKIE)
}

export async function destroyOtherSessions(userId: string) {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  const sameUser = eq(schema.sessions.userId, userId)
  await getDb()
    .delete(schema.sessions)
    .where(token ? and(sameUser, ne(schema.sessions.id, hashToken(token))) : sameUser)
}
