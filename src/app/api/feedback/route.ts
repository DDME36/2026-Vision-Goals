import { env } from '@/server/env'
import { ApiError, json, readJson, route } from '@/server/http'
import { clientIp, rateLimit } from '@/server/rate-limit'
import { feedbackSchema } from '@/lib/validation'
import { APP_NAME, BRAND } from '@/lib/config'

export const POST = route(async (request) => {
  const webhookUrl = env.discordWebhookUrl
  if (!webhookUrl) throw new ApiError(503, 'ระบบ Feedback ยังไม่ได้ตั้งค่า', 'NOT_CONFIGURED')

  const limit = rateLimit(`feedback:${clientIp(request)}`, 5, 10 * 60 * 1000)
  if (!limit.ok) throw new ApiError(429, 'ส่งบ่อยเกินไป กรุณารอสักครู่', 'RATE_LIMITED')

  const { feedback } = await readJson(request, feedbackSchema)

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      allowed_mentions: { parse: [] },
      embeds: [
        {
          title: '💬 Feedback ใหม่',
          description: feedback,
          color: 0xea580c,
          timestamp: new Date().toISOString(),
          footer: { text: `${APP_NAME} by ${BRAND} · Anonymous` },
        },
      ],
    }),
  })
  if (!response.ok) throw new Error(`Discord webhook failed: ${response.status}`)

  return json({ ok: true })
})
