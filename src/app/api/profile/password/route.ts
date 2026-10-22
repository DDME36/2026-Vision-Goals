import { eq } from 'drizzle-orm'
import { destroyOtherSessions } from '@/server/auth/session'
import { hashPassword, verifyPassword } from '@/server/auth/password'
import { getDb, schema } from '@/server/db'
import { ApiError, json, readJson, requireUser, route } from '@/server/http'
import { changePasswordSchema } from '@/lib/validation'

export const POST = route(async (request) => {
  const user = await requireUser()
  const { currentPassword, newPassword } = await readJson(request, changePasswordSchema)
  const db = getDb()

  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, user.id)).limit(1)
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    throw new ApiError(400, 'รหัสผ่านปัจจุบันไม่ถูกต้อง', 'INVALID_PASSWORD')
  }

  await db
    .update(schema.users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))
  // Sign out every other device after a password change.
  await destroyOtherSessions(user.id)

  return json({ ok: true })
})
