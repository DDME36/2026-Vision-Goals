import 'server-only'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const env = {
  get databaseUrl() {
    return required('DATABASE_URL')
  },
  get discordWebhookUrl() {
    return process.env.DISCORD_WEBHOOK_URL || null
  },
  get allowRegistration() {
    return process.env.ALLOW_REGISTRATION !== 'false'
  },
  get isProduction() {
    return process.env.NODE_ENV === 'production'
  },
  /** Set COOKIE_SECURE=false only when serving over plain http (e.g. LAN testing). */
  get secureCookies() {
    if (process.env.COOKIE_SECURE) return process.env.COOKIE_SECURE !== 'false'
    return process.env.NODE_ENV === 'production'
  },
}
