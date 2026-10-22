import { App } from '@/components/App'
import { getCurrentUser } from '@/server/auth/session'
import { env } from '@/server/env'

export const dynamic = 'force-dynamic'

export default async function Page() {
  // Resolve the session on the server so signed-in users never see a login flash.
  const user = await getCurrentUser().catch((error) => {
    console.error('[page] could not resolve session', error)
    return null
  })

  return (
    <App
      initialUser={user}
      features={{
        feedback: Boolean(env.discordWebhookUrl),
        registration: env.allowRegistration,
      }}
    />
  )
}
