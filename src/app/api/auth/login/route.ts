import { sql } from 'drizzle-orm'
import { createSession, toAppUser } from '@/server/auth/session'
import { hashPassword, verifyPassword } from '@/server/auth/password'
import { getDb, schema } from '@/server/db'
import { ApiError, json, readJson, route } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'
import { loginSchema } from '@/lib/validation'

// Verified against when the user does not exist, so response time doesn't leak which usernames exist.
let dummyHash: Promise<string> | null = null

export const POST = route(async (request) => {
  const { username, password } = await readJson(request, loginSchema)

  const ip = clientIp(request)
  const limit = rateLimit(`login:${ip}:${username.toLowerCase()}`, 10, 15 * 60 * 1000)
  if (!limit.ok) {
    throw new ApiError(429, `ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอ ${Math.ceil(limit.retryAfter / 60)} นาที`, 'RATE_LIMITED', {
      'Retry-After': String(limit.retryAfter),
    })
  }

  const [user] = await getDb()
    .select()
    .from(schema.users)
    .where(sql`lower(${schema.users.username}) = ${username.toLowerCase()}`)
    .limit(1)

  dummyHash ??= hashPassword('dummy-password')
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash))
  if (!user || !valid) throw new ApiError(401, 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'INVALID_CREDENTIALS')

  await createSession(user.id, request.headers.get('user-agent'))
  return json({ user: toAppUser(user) })
})
