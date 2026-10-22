import { sql } from 'drizzle-orm'
import { createSession, toAppUser } from '@/server/auth/session'
import { hashPassword } from '@/server/auth/password'
import { getDb, schema } from '@/server/db'
import { env } from '@/server/env'
import { ApiError, json, readJson, route } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'
import { registerSchema } from '@/lib/validation'

export const POST = route(async (request) => {
  if (!env.allowRegistration) throw new ApiError(403, 'ปิดรับสมัครสมาชิกใหม่ชั่วคราว', 'REGISTRATION_CLOSED')

  const limit = rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000)
  if (!limit.ok) {
    throw new ApiError(429, 'สมัครบ่อยเกินไป กรุณาลองใหม่ภายหลัง', 'RATE_LIMITED', { 'Retry-After': String(limit.retryAfter) })
  }

  const { username, password, displayName } = await readJson(request, registerSchema)
  const db = getDb()

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(sql`lower(${schema.users.username}) = ${username.toLowerCase()}`)
    .limit(1)
  if (existing) throw new ApiError(409, 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว', 'USERNAME_TAKEN')

  const [user] = await db
    .insert(schema.users)
    .values({
      username,
      passwordHash: await hashPassword(password),
      displayName: displayName || username,
    })
    .returning()

  await createSession(user.id, request.headers.get('user-agent'))
  return json({ user: toAppUser(user) }, { status: 201 })
})
