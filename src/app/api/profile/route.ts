import { eq } from 'drizzle-orm'
import { toAppUser } from '@/server/auth/session'
import { getDb, schema } from '@/server/db'
import { json, readJson, requireUser, route } from '@/server/http'
import { profileSchema } from '@/lib/validation'

export const PATCH = route(async (request) => {
  const user = await requireUser()
  const { displayName, avatarUrl } = await readJson(request, profileSchema)

  const [updated] = await getDb()
    .update(schema.users)
    .set({
      displayName,
      ...(avatarUrl !== undefined && { avatarUrl }),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id))
    .returning()

  return json({ user: toAppUser(updated) })
})
